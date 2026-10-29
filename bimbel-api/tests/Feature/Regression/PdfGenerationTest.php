<?php

namespace Tests\Feature\Regression;

use App\Models\Admin\User;
use App\Services\Finance\PayrollService;
use Illuminate\Testing\TestResponse;
use Tests\Concerns\BuildsAuditFixtures;
use Tests\TestCase;

/**
 * Semua PDF yang dibuat aplikasi (invoice, slip honor, rekap nilai) tetap terbentuk.
 * Penjaga regresi untuk upgrade dompdf / framework.
 */
class PdfGenerationTest extends TestCase
{
    use BuildsAuditFixtures;

    protected function setUp(): void {
        parent::setUp();
        $this->buildAuditFixtures();
    }

    private function assertPdf(TestResponse $res): void {
        $res->assertOk();
        $this->assertStringContainsString('application/pdf', $res->headers->get('Content-Type'));
        $this->assertStringStartsWith('%PDF', $res->getContent());
    }

    public function test_invoice_pdf_admin(): void {
        $this->assertPdf($this->api('GET', "/admin/finance/invoices/{$this->f['invA']}/pdf", $this->tokenFor($this->f['admin'])));
    }

    public function test_invoice_pdf_orang_tua(): void {
        $this->assertPdf($this->api('GET', "/parent/invoices/{$this->f['invA']}/pdf", $this->tokenFor($this->f['puA'])));
    }

    public function test_slip_honor_tentor(): void {
        $this->insert('academic.tentor_attendances', [
            'session_id' => $this->f['ssA'], 'tentor_id' => $this->f['tA'], 'attendance_status' => 'HADIR',
            'teaching_minutes' => 90, 'checked_in_at' => '2026-10-05 08:00:00', 'checked_out_at' => '2026-10-05 09:30:00',
        ]);
        $this->actingAs(User::findOrFail($this->f['admin']));
        $payroll = app(PayrollService::class)->generate(2026, 10);

        $this->assertPdf($this->api('GET', "/tentor/honor/{$payroll->id}/slip", $this->tokenFor($this->f['tuA'])));
    }

    public function test_rekap_nilai_tentor(): void {
        $this->assertPdf($this->api('GET', '/tentor/exam-results/export', $this->tokenFor($this->f['tuA'])));
    }
}
