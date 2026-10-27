<?php

namespace App\Http\Controllers\Api\Website;

use App\Http\Controllers\Api\Website\Concerns\PublicVisibility;

use App\Support\SafeDelete;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Website\PackageRequest;
use App\Http\Resources\Website\PackageResource;
use App\Models\Website\Package;

class PackageController extends Controller {
    use PublicVisibility;

    public function index() {
        return PackageResource::collection(
            Package::when(!$this->viewerIsCmsAdmin(), fn($q) => $q->where('is_active', true))
                ->orderBy('education_level')
                ->orderBy('package_name')
                ->get()
        );
    }

    public function store(PackageRequest $request) {
        $package = Package::create($request->validated());
        return new PackageResource($package);
    }

    public function show(Package $package) {
        abort_if(!$package->is_active && !$this->viewerIsCmsAdmin(), 404);
        return new PackageResource($package);
    }

    public function update(PackageRequest $request,Package $package) {
        $package->update($request->validated());

        return new PackageResource($package->fresh());
    }

    // Paket yang dipakai kelas/tagihan tidak dihapus (FK kelas SET NULL akan menghilangkan harga tagihan)
    public function destroy(Package $package) {
        $inUse = DB::table('academic.classes')->where('package_id', $package->id)->exists()
            || DB::table('finance.invoices')->where('package_id', $package->id)->exists();
        if ($inUse) {
            throw ValidationException::withMessages(['package' => 'Paket masih dipakai kelas atau tagihan sehingga tidak dapat dihapus. Nonaktifkan paket sebagai gantinya.']);
        }

        SafeDelete::run(fn() => $package->delete(), 'Paket masih dipakai data lain sehingga tidak dapat dihapus.');

        return response()->json(['message' => 'Deleted successfully']);
    }
}