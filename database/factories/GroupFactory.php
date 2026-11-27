<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class GroupFactory extends Factory
{
    public function definition(): array
    {
        return [
            'ownerId' => User::factory()->facilitatorRole(),
            'title' => 'دائرة الناجين من السرطان',
            'topic' => 'cancer-survivors',
            'description' => 'مساحة دعم بين الأقران لتبادل الخبرات باحترام، وتكمل الرعاية المتخصصة ولا تحل محلها.',
            'coverImageUrl' => null,
            'isPrivate' => false,
            'status' => 'Active',
        ];
    }

    public function survivors(): static
    {
        return $this->state(fn() => [
            'title' => 'دائرة الناجين من السرطان',
            'topic' => 'cancer-survivors',
            'description' => 'مساحة آمنة للناجين من السرطان لتبادل الخبرات اليومية والتشجيع المتبادل، مع احترام دور الرعاية الطبية المتخصصة.',
        ]);
    }

    public function caregivers(): static
    {
        return $this->state(fn() => [
            'title' => 'مساحة أهالي ومقدمي رعاية مرضى السرطان',
            'topic' => 'cancer-caregivers',
            'description' => 'مساحة لأفراد العائلة ومقدمي الرعاية لمشاركة تجارب الدعم والاهتمام بأحبائهم دون أن تحل محل الإرشاد المهني.',
        ]);
    }

    public function fertility(): static
    {
        return $this->state(fn() => [
            'title' => 'رفقاء رحلة الخصوبة وأطفال الأنابيب',
            'topic' => 'fertility-ivf',
            'description' => 'مجتمع للأشخاص الذين يمرون بتحديات الخصوبة أو علاج أطفال الأنابيب لتبادل الخبرات باحترام وخصوصية.',
        ]);
    }

    public function recovery(): static
    {
        return $this->state(fn() => [
            'title' => 'مجتمع التعافي من الإدمان',
            'topic' => 'addiction-recovery',
            'description' => 'مجتمع للأشخاص في رحلة التعافي من الإدمان لتبادل الخبرات والتشجيع بين الأقران إلى جانب الرعاية المتخصصة.',
        ]);
    }

    public function privateGroup(): static
    {
        return $this->state(fn() => [
            'isPrivate' => true,
        ]);
    }

    public function archived(): static
    {
        return $this->state(fn() => [
            'status' => 'Archived',
        ]);
    }
}
