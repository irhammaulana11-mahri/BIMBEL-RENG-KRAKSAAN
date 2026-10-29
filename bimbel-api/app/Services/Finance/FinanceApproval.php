<?php

namespace App\Services\Finance;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * Aturan persetujuan keuangan sesuai mode (D-11, config finance.approval_mode), dipakai bersama oleh
 * reversal pembayaran, persetujuan & transfer payroll, dan peninjauan pengecualian payroll.
 *
 * - single_operator: password wajib dikonfirmasi ulang; bila akun yang sama sudah mengerjakan tahap
 *   sebelumnya, alasan tertulis wajib dan persetujuan ditandai self_approved.
 * - separated: akun yang sudah mengerjakan tahap sebelumnya tidak boleh menyetujui.
 */
class FinanceApproval
{
    public const MIN_NOTE_LENGTH = 10;

    public function mode(): string {
        return config('finance.approval_mode') === 'separated' ? 'separated' : 'single_operator';
    }

    /**
     * @param array<int, string|null> $priorActors akun yang mengerjakan tahap sebelumnya (mis. pengaju, penyusun)
     * @return bool self_approved
     */
    public function authorize(array $priorActors, ?string $password, ?string $note, string $separatedMessage): bool {
        $user = Auth::user();
        $self = in_array($user->id, array_filter($priorActors), true);

        if ($this->mode() === 'separated') {
            if ($self) throw ValidationException::withMessages(['approval' => [$separatedMessage]]);
            return false;
        }

        if (!$password || !Hash::check($password, $user->password)) {
            throw ValidationException::withMessages(['password' => ['Password tidak sesuai.']]);
        }
        if ($self && mb_strlen(trim((string) $note)) < self::MIN_NOTE_LENGTH) {
            throw ValidationException::withMessages(['note' => ['Tulis alasan minimal ' . self::MIN_NOTE_LENGTH . ' karakter karena Anda juga mengerjakan tahap sebelumnya.']]);
        }

        return $self;
    }

    public function meta(bool $selfApproved): array {
        return ['approval_mode' => $this->mode(), 'self_approved' => $selfApproved];
    }
}
