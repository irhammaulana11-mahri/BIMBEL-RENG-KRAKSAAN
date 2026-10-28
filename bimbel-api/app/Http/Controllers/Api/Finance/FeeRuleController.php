<?php

namespace App\Http\Controllers\Api\Finance;

use App\Http\Controllers\Controller;
use App\Http\Requests\Finance\FeeRuleRequest;
use App\Models\Admin\EducationLevel;
use App\Models\Admin\Tentor;
use App\Models\Finance\FeeRule;
use App\Models\Website\Package;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Aturan tarif Rule Engine (tagihan wali & honor tentor), dikelola Admin.
 */
class FeeRuleController extends Controller
{
    public function index(Request $request)
    {
        $type = $request->input('rule_type');

        $rules = FeeRule::with(['package:id,package_name', 'tentor.user:id,name'])
            ->when(in_array($type, FeeRule::TYPES, true), fn($q) => $q->where('rule_type', $type))
            ->orderBy('rule_type')->orderByDesc('is_active')->orderByDesc('effective_from')
            ->get()
            ->map(fn(FeeRule $r) => $this->present($r));

        return response()->json([
            'data' => $rules,
            'options' => [
                'methods'       => FeeRule::METHODS,
                'method_labels' => FeeRule::METHOD_LABELS,
                'statuses'      => FeeRule::STUDENT_STATUSES,
                'class_types'   => ['PRIVATE', 'REGULER', 'ONLINE'],
                'education_levels' => EducationLevel::orderBy('sort_order')->pluck('education_level')->map(fn($l) => strtoupper($l))->unique()->values(),
                'packages'      => Package::orderBy('display_order')->get(['id', 'package_name', 'class_type', 'default_price'])
                    ->map(fn($p) => ['id' => $p->id, 'name' => $p->package_name, 'class_type' => $p->class_type, 'price' => (float) $p->default_price]),
                'tentors'       => Tentor::with('user:id,name')->where('is_active', true)->get()
                    ->map(fn($t) => ['id' => $t->id, 'name' => $t->user?->name])->sortBy('name')->values(),
            ],
        ]);
    }

    public function store(FeeRuleRequest $request)
    {
        $rule = FeeRule::create($request->validated() + ['created_by' => Auth::id()]);

        return response()->json(['message' => 'Aturan tarif ditambahkan.', 'data' => $this->present($rule->load('package', 'tentor.user'))], 201);
    }

    public function update(FeeRuleRequest $request, FeeRule $feeRule)
    {
        $feeRule->update($request->validated());

        return response()->json(['message' => 'Aturan tarif diperbarui. Tagihan/payroll yang sudah dibuat tidak berubah.', 'data' => $this->present($feeRule->load('package', 'tentor.user'))]);
    }

    // Aturan yang pernah dipakai tetap tercatat di baris tagihan/honor (salinan), aman dihapus
    public function destroy(FeeRule $feeRule)
    {
        $feeRule->delete();

        return response()->json(['message' => 'Aturan tarif dihapus.']);
    }

    private function present(FeeRule $r): array
    {
        return [
            'id'               => $r->id,
            'rule_type'        => $r->rule_type,
            'name'             => $r->name,
            'class_type'       => $r->class_type,
            'package_id'       => $r->package_id,
            'package_name'     => $r->package?->package_name,
            'education_level'  => $r->education_level,
            'tentor_id'        => $r->tentor_id,
            'tentor_name'      => $r->tentor?->user?->name,
            'method'           => $r->method,
            'method_label'     => FeeRule::METHOD_LABELS[$r->method] ?? $r->method,
            'amount'           => (float) $r->amount,
            'counted_statuses' => $r->counted_statuses ?: [],
            'effective_from'   => $r->effective_from?->toDateString(),
            'effective_to'     => $r->effective_to?->toDateString(),
            'is_active'        => $r->is_active,
            'note'             => $r->note,
            'specificity'      => $r->specificity(),
        ];
    }
}
