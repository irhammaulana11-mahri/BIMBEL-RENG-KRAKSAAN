<?php

namespace App\Http\Controllers\Api\Website;

use App\Models\Website\Lead;
use App\Http\Controllers\Controller;
use App\Http\Requests\Website\LeadRequest;
use App\Http\Resources\Website\LeadResource;
use App\Http\Resources\Admin\ParentResource;
use App\Http\Resources\Admin\StudentResource;
use App\Models\Admin\User;
use App\Models\Admin\ParentModel;
use App\Models\Admin\Role;
use App\Services\Lead\LeadConversionService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Builder;

class LeadController extends Controller {
    public function __construct(
        protected LeadConversionService $conversionService
    ) {}

    public function index(Request $request) {
        $query = Lead::query()
            ->with('package');

        // | Keyword Search
        if ($request->filled('keyword')) {

            $keyword = trim($request->keyword);

            $query->where(function (Builder $q) use ($keyword) {

                $q->where('parent_name', 'ILIKE', "%{$keyword}%")
                    ->orWhere('student_name', 'ILIKE', "%{$keyword}%")
                    ->orWhere('phone', 'ILIKE', "%{$keyword}%")
                    ->orWhere('email', 'ILIKE', "%{$keyword}%");

            });

        }

        // | Status
        if ($request->filled('status')) {

            $query->where('status', $request->status);

        }

        // | Daily Filter
        if ($request->period === 'daily' && $request->filled('date')) {
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $request->date)) {
                return response()->json([
                    'message' => 'Format tanggal harian tidak valid.'
                ], 422);
            }

            $query->whereDate('created_at', $request->date);
        }

        // | Monthly Filter
        if ($request->period === 'monthly' && $request->filled('date')) {
            if (!preg_match('/^\d{4}-\d{2}$/', $request->date)) {
                return response()->json([
                    'message' => 'Format bulan tidak valid.'
                ], 422);
            }

            [$year, $month] = explode('-', $request->date);

            $query->whereYear('created_at', $year)
                ->whereMonth('created_at', $month);
        }

        // | Statistics
        $summary = [
            'total' => (clone $query)->count(),

            'new' => (clone $query)
                ->where('status', 'NEW')
                ->count(),

            'contacted' => (clone $query)
                ->where('status', 'CONTACTED')
                ->count(),

            'registered' => (clone $query)
                ->where('status', 'REGISTERED')
                ->count(),
        ];

        // | Pagination
        $perPage = $request->integer('per_page', 10);

        $leads = $query
            ->latest()
            ->paginate($perPage)
            ->withQueryString();

        return LeadResource::collection($leads)
            ->additional([
                'summary' => $summary,
            ]);
    }

    public function store(LeadRequest $request)
    {
        $data = $request->validated();
        $data['status'] = 'NEW';
        $lead = Lead::create($data);
        return new LeadResource(
            $lead->load('package')
        );
    }

    public function show(Lead $lead) {
        return new LeadResource($lead->load('package'));
    }

    public function update(LeadRequest $request,Lead $lead) {
        $lead->update($request->validated());
        return new LeadResource($lead->fresh()->load('package')
        );
    }

    public function destroy(Lead $lead) {
        $lead->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }


    public function convert(Lead $lead) {
        $result = $this->conversionService->convert($lead);
        return response()->json([
            'message' => 'Lead berhasil dikonversi.',
            'temporary_password' => $result['password'],
            'parent' => new ParentResource($result['parent']),
            'student' => new StudentResource($result['student']),
        ]);
    }

//     public function convert(Lead $lead)
//     {
//         $existingUser = User::where('phone',$lead->phone)->first();
//         if ($existingUser) {
//             return response()->json(['message' =>'Nomor WhatsApp sudah terdaftar'], 422);
//         }

//         if ($lead->status === 'REGISTERED') {
//             return response()->json(['message' => 'Lead sudah dikonversi'], 422);
//         }

//         DB::beginTransaction();

//         try {
//             if ($lead->status !== 'CONTACTED') {
//                 return response()->json(['message' => 'Lead harus berstatus CONTACTED'], 422);
// }
//             $parentRole = Role::where('role_name','orang_tua')->first();

//             if (!$parentRole) {
//                 throw new \Exception('Role parent tidak ditemukan');
//             }

//             $password = Str::random(8);

//             $user = User::create([
//                 'role_id' => $parentRole->id,
//                 'name' => $lead->parent_name,
//                 'phone' => $lead->phone,
//                 'email' => $lead->email,
//                 'password' => Hash::make($password),
//                 'is_active' => true,
//             ]);

//             $parent = ParentModel::create([
//                 'user_id' => $user->id,
//                 'full_name' => $lead->parent_name,
//                 'occupation' => null,
//                 'relationship' => 'Orang Tua',
//                 'address' => null,
//             ]);

//             $lead->update([
//                 'status' => 'REGISTERED',
//                 'user_id' => $user->id,
//             ]);

//             DB::commit();

//             return response()->json([
//                 'message' => 'Lead berhasil dikonversi',
//                 'user_id' => $user->id,
//                 'parent_id' => $parent->id,

//                 // sementara tampilkan password
//                 // nanti bisa dikirim WA
//                 'temporary_password' => $password
//             ]);

//         } catch (\Exception $e) {
//             DB::rollBack();
//             return response()->json([
//                 'message' => $e->getMessage()
//             ], 500);
//         }
//     }
}