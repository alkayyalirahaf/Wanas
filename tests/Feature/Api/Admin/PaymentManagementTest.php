<?php

namespace Tests\Feature\Api\Admin;

use App\Models\Payment;

class PaymentManagementTest extends AdminApiTestCase
{
    public function test_payments_support_search_status_pagination_and_validation(): void
    {
        Payment::factory()->create(['status' => 'succeeded', 'stripePaymentIntentId' => 'pi_search_target']);
        Payment::factory()->failed()->create();
        $this->asAdmin()->getJson('/api/admin/payments?search=pi_search_target&status=succeeded&per_page=10')
            ->assertOk()->assertJsonPath('data.total', 1);
        $this->asAdmin()->getJson('/api/admin/payments?status=invalid')->assertUnprocessable();
        $this->asAdmin()->getJson('/api/admin/payments?per_page=11')->assertUnprocessable();
    }

    public function test_payment_details_include_booking_relationships_and_read_does_not_mutate(): void
    {
        $payment = Payment::factory()->create();
        $before = $payment->fresh()->toArray();
        $this->asAdmin()->getJson("/api/admin/payments/{$payment->id}")->assertOk()
            ->assertJsonPath('data.booking.id', $payment->bookingId)
            ->assertJsonStructure(['data' => ['booking' => ['user', 'specialist', 'slot']]]);
        $this->assertSame($before, $payment->fresh()->toArray());
    }
}
