<?php
namespace App\Services\Academic;

use Anthropic\Client;
use Anthropic\Core\Exceptions\APIConnectionException;
use Anthropic\Core\Exceptions\APIStatusException;
use Anthropic\Core\Exceptions\AuthenticationException;
use Anthropic\Core\Exceptions\RateLimitException;
use App\Models\Academic\ClassRoom;
use App\Models\Academic\ProgressReport;
use App\Models\Admin\Student;
use Carbon\Carbon;
use Illuminate\Validation\ValidationException;

/**
 * Rekomendasi perkembangan anak untuk rapor bulanan, disusun Claude dari data rapor
 * (kehadiran, nilai ujian, catatan tentor) dengan acuan psikologi perkembangan.
 * Hasil adalah DRAF: Admin meninjau/menyunting sebelum rapor diterbitkan.
 *
 * Privasi: nama diganti "Ananda"; NIS, sekolah, dan identitas lain tidak dikirim.
 */
class ProgressRecommendationService {

    // Struktur jawaban yang diminta dari model (output terstruktur JSON schema)
    public const FIELDS = ['summary', 'strengths', 'growth_areas', 'learning_recommendations', 'parent_tips', 'developmental_note'];

    private const SYSTEM_PROMPT = <<<'TXT'
Anda adalah konsultan pendidikan anak untuk sebuah lembaga bimbingan belajar di Indonesia, dengan latar psikologi perkembangan dan psikologi pendidikan.

Tugas: menyusun rekomendasi perkembangan bulanan untuk satu siswa berdasarkan data rapor yang diberikan (kehadiran, nilai ujian per mata pelajaran, tren nilai, dan catatan tentor). Rekomendasi ini dibaca orang tua dan tentor, ditinjau Admin sebelum diterbitkan.

Pedoman:
- Dasarkan setiap pernyataan pada data yang tersedia. Bila data sedikit (misalnya belum ada ujian atau catatan), katakan dengan jujur dan beri saran umum yang sesuai usia/jenjang, jangan mengarang capaian.
- Gunakan kerangka ilmu tumbuh kembang anak secara wajar dan relevan dengan usia/jenjang, misalnya tahap perkembangan kognitif (Piaget), zona perkembangan proksimal dan scaffolding (Vygotsky), tahap psikososial (Erikson, misalnya industry vs inferiority pada usia SD, identitas pada remaja), motivasi dan growth mindset (Dweck), serta kebiasaan belajar dan regulasi diri. Sebut kerangka hanya bila membantu, dengan bahasa yang mudah dipahami orang tua.
- Jangan menegakkan diagnosis atau label klinis (misalnya ADHD, disleksia, gangguan kecemasan). Bila ada pola yang patut diperhatikan, sarankan berdiskusi dengan guru/psikolog tanpa menyimpulkan kondisi.
- Nada hangat, menghargai usaha, konstruktif, tidak menghakimi. Sebut anak sebagai "Ananda".
- Saran harus konkret dan dapat dilakukan: kegiatan di rumah, durasi wajar, contoh latihan, cara memberi pujian atas proses.
- Bahasa Indonesia baku yang ramah. Setiap butir daftar maksimal 2 kalimat. Ringkasan maksimal 4 kalimat.
TXT;

    public function __construct(protected ProgressReportService $reports) {}

    public static function enabled(): bool {
        return !empty(config('services.anthropic.key'));
    }

    public function generate(Student $student, ClassRoom $class, int $year, int $month): ProgressReport {
        if (!self::enabled()) {
            throw ValidationException::withMessages(['ai' => 'Fitur rekomendasi AI belum diaktifkan. Isi ANTHROPIC_API_KEY di file .env server.']);
        }

        $data = $this->reports->detail($student, $class, $year, $month);
        if (($data['status'] ?? null) === 'PUBLISHED') {
            throw ValidationException::withMessages(['report' => 'Rapor sudah diterbitkan. Tarik rapor terlebih dahulu untuk membuat ulang rekomendasi.']);
        }

        // Penyusunan bisa memakan waktu hingga beberapa menit; jangan diputus batas waktu PHP
        @set_time_limit(300);
        $recommendation = $this->ask($this->buildPrompt($student, $class, $data));

        return $this->reports->saveRecommendation($student, $class, $year, $month, $recommendation, false);
    }

    // Suntingan Admin atas rekomendasi (tetap draf sampai rapor diterbitkan)
    public function update(Student $student, ClassRoom $class, int $year, int $month, array $recommendation): ProgressReport {
        return $this->reports->saveRecommendation($student, $class, $year, $month, $this->normalize($recommendation), true);
    }

    /*
    |--------------------------------------------------------------------------
    | PROMPT & PEMANGGILAN MODEL
    |--------------------------------------------------------------------------
    */

    // Hanya data belajar yang dikirim; identitas anak disamarkan
    private function buildPrompt(Student $student, ClassRoom $class, array $data): string {
        $student->loadMissing('educationLevel');
        $age = $student->birth_date ? Carbon::parse($student->birth_date)->age : null;

        $payload = [
            'periode'          => $data['period']['label'] ?? null,
            'profil'           => [
                'jenjang'      => $student->educationLevel?->display_name ?? trim("{$student->education_level} kelas {$student->grade}"),
                'usia_tahun'   => $age,
                'jenis_kelas'  => strtoupper($class->class_type ?? 'REGULER'),
                'jenis_kelamin' => match ($student->gender) { 'L' => 'laki-laki', 'P' => 'perempuan', default => null },
            ],
            'kehadiran'        => $data['attendance'] ?? null,
            'ujian'            => [
                'jumlah'             => $data['exam']['count'] ?? 0,
                'rata_rata'          => $data['exam']['average'] ?? null,
                'rata_rata_bulan_lalu' => $data['exam']['previous_average'] ?? null,
                'tren'               => $data['exam']['trend'] ?? null,
                'rincian'            => collect($data['exams'] ?? [])->map(fn($e) => [
                    'mapel' => $e['subject_name'] ?? null, 'judul' => $e['title'] ?? null, 'nilai_0_100' => $e['score'] ?? null,
                ])->values()->all(),
            ],
            'per_mapel'        => collect($data['subjects'] ?? [])->map(fn($s) => [
                'mapel'            => $s['subject_name'],
                'sesi_terlaksana'  => $s['held_sessions'],
                'hadir'            => $s['hadir'],
                'rata_rata_ujian'  => $s['exam_average'],
                'catatan_tentor'   => $this->anonymize($s['note'] ?? null, $student),
            ])->values()->all(),
            'catatan_umum_admin' => $this->anonymize($data['general_note'] ?? null, $student),
        ];

        return "Data rapor bulanan siswa (JSON):\n" . json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
            . "\n\nSusun rekomendasi perkembangan sesuai pedoman.";
    }

    private function anonymize(?string $text, Student $student): ?string {
        if (!$text) return null;
        $names = array_filter(array_unique([$student->full_name, ...explode(' ', (string) $student->full_name)]), fn($n) => mb_strlen($n) >= 3);
        usort($names, fn($a, $b) => mb_strlen($b) <=> mb_strlen($a));
        foreach ($names as $name) $text = preg_replace('/\b' . preg_quote($name, '/') . '\b/iu', 'Ananda', $text);
        return $text;
    }

    protected function ask(string $prompt): array {
        $client = new Client(apiKey: config('services.anthropic.key'));
        $list = ['type' => 'array', 'items' => ['type' => 'string']];

        try {
            $message = $client->beta->messages->create(
                model: config('services.anthropic.model', 'claude-opus-5-5'),
                maxTokens: 16000,
                system: self::SYSTEM_PROMPT,
                messages: [['role' => 'user', 'content' => $prompt]],
                outputConfig: [
                    'effort' => 'medium',
                    'format' => [
                        'type'   => 'json_schema',
                        'schema' => [
                            'type'       => 'object',
                            'properties' => [
                                'summary'                  => ['type' => 'string', 'description' => 'Ringkasan perkembangan bulan ini'],
                                'strengths'                => $list + ['description' => 'Kekuatan / capaian Ananda'],
                                'growth_areas'             => $list + ['description' => 'Area yang perlu dikembangkan'],
                                'learning_recommendations' => $list + ['description' => 'Rekomendasi pendekatan belajar untuk tentor'],
                                'parent_tips'              => $list + ['description' => 'Saran kegiatan & pendampingan di rumah untuk orang tua'],
                                'developmental_note'       => ['type' => 'string', 'description' => 'Catatan dari sudut pandang tumbuh kembang sesuai usia/jenjang'],
                            ],
                            'required'             => self::FIELDS,
                            'additionalProperties' => false,
                        ],
                    ],
                ],
                // Bila model menolak karena kebijakan, server mencoba model pengganti bawaan
                fallbacks: 'default',
                betas: ['server-side-fallback-2026-07-01'],
            );
        } catch (AuthenticationException) {
            throw ValidationException::withMessages(['ai' => 'API key Anthropic tidak valid. Periksa ANTHROPIC_API_KEY.']);
        } catch (RateLimitException) {
            throw ValidationException::withMessages(['ai' => 'Layanan AI sedang sibuk (batas permintaan). Coba lagi beberapa saat.']);
        } catch (APIStatusException $e) {
            throw ValidationException::withMessages(['ai' => 'Layanan AI menolak permintaan: ' . $e->getMessage()]);
        } catch (APIConnectionException) {
            throw ValidationException::withMessages(['ai' => 'Tidak dapat terhubung ke layanan AI. Periksa koneksi internet server.']);
        }

        if ($message->stopReason === 'refusal') {
            throw ValidationException::withMessages(['ai' => 'AI tidak dapat menyusun rekomendasi untuk data ini. Silakan tulis catatan umum secara manual.']);
        }
        if ($message->stopReason === 'max_tokens') {
            throw ValidationException::withMessages(['ai' => 'Jawaban AI terpotong. Coba buat ulang.']);
        }

        foreach ($message->content as $block) {
            if ($block->type === 'text') {
                $decoded = json_decode($block->text, true);
                if (is_array($decoded)) return $this->normalize($decoded);
            }
        }

        throw ValidationException::withMessages(['ai' => 'Format jawaban AI tidak dikenali. Coba buat ulang.']);
    }

    // Pastikan bentuk tetap: string untuk ringkasan/catatan, daftar string untuk butir
    private function normalize(array $data): array {
        $text = fn($v) => is_string($v) ? trim($v) : '';
        $items = fn($v) => array_values(array_filter(array_map(fn($i) => is_string($i) ? trim($i) : '', is_array($v) ? $v : []), fn($i) => $i !== ''));

        return [
            'summary'                  => $text($data['summary'] ?? ''),
            'strengths'                => $items($data['strengths'] ?? []),
            'growth_areas'             => $items($data['growth_areas'] ?? []),
            'learning_recommendations' => $items($data['learning_recommendations'] ?? []),
            'parent_tips'              => $items($data['parent_tips'] ?? []),
            'developmental_note'       => $text($data['developmental_note'] ?? ''),
        ];
    }
}
