<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Pindahkan berkas materi dari disk publik (bisa diunduh tanpa login lewat /storage)
     * ke disk privat. file_path "/storage/modules/x.pdf" -> "materials/x.pdf".
     */
    public function up(): void
    {
        DB::table('academic.materials')->where('file_path', 'like', '/storage/%')->orderBy('id')->each(function ($material) {
            $source = Str::after($material->file_path, '/storage/');
            $target = 'materials/' . basename($source);

            if (Storage::disk('public')->exists($source)) {
                Storage::disk('local')->put($target, Storage::disk('public')->get($source));
                Storage::disk('public')->delete($source);
            } elseif (!Storage::disk('local')->exists($target)) {
                return; // berkas tidak ada di server: biarkan path lama apa adanya
            }

            DB::table('academic.materials')->where('id', $material->id)->update(['file_path' => $target]);
        });
    }

    public function down(): void
    {
        DB::table('academic.materials')->where('file_path', 'like', 'materials/%')->orderBy('id')->each(function ($material) {
            $target = 'modules/' . basename($material->file_path);

            if (Storage::disk('local')->exists($material->file_path)) {
                Storage::disk('public')->put($target, Storage::disk('local')->get($material->file_path));
                Storage::disk('local')->delete($material->file_path);
            }

            DB::table('academic.materials')->where('id', $material->id)->update(['file_path' => '/storage/' . $target]);
        });
    }
};
