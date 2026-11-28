<?php

namespace Tests\Feature\Api\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

abstract class AdminApiTestCase extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->state(['role' => 'admin', 'status' => 'Active'])->create();
    }

    protected function asAdmin(): static
    {
        return $this->actingAs($this->admin, 'sanctum');
    }
}
