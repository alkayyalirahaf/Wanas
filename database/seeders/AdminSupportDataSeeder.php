<?php

namespace Database\Seeders;

use App\Models\AiSession;
use App\Models\AppNotification;
use App\Models\Booking;
use App\Models\Event;
use App\Models\FacilitatorApplication;
use App\Models\Group;
use App\Models\Report;
use App\Models\Specialist;
use App\Models\User;
use Illuminate\Database\Seeder;
use RuntimeException;

class AdminSupportDataSeeder extends Seeder
{
    public function run(): void
    {
        // Admins are manually managed; this seeder only looks up the existing account.
        $admin = User::query()->where('role', 'admin')->where('status', 'Active')->first();
        if (!$admin) {
            throw new RuntimeException('Wanas demo support data requires an existing active Admin; no Admin was created.');
        }

        $this->applications($admin);
        $this->reports();
        $this->notifications($admin);
        $this->aiSessions();
    }

    private function applications(User $admin): void
    {
        $cases = [
            [UserSeeder::MEMBERS[0], 'تيسير دائرة دعم الناجين من السرطان', 'Pending', null],
            // The approved application reflects the post-approval role transition.
            [UserSeeder::FACILITATORS[2], 'تيسير مساحة دعم رحلة الخصوبة', 'Approved', $admin->id],
            [UserSeeder::MEMBERS[1], 'تيسير مساحة دعم أفراد العائلة', 'Rejected', $admin->id],
        ];

        foreach ($cases as [$email, $topic, $status, $reviewerId]) {
            $applicant = User::query()->where('email', $email)->firstOrFail();
            if ($status === 'Approved' && ($applicant->role !== 'facilitator' || $applicant->status !== 'Active')) {
                throw new RuntimeException('An approved demo Facilitator application must belong to an active Facilitator account.');
            }
            if ($status === 'Rejected' && $applicant->role !== 'member') {
                throw new RuntimeException('A rejected demo Facilitator application must leave its applicant as a Member.');
            }

            $application = FacilitatorApplication::firstOrCreate(
                ['userId' => $applicant->id, 'proposedTopic' => $topic],
                [
                    'reviewedBy' => $reviewerId,
                    'reason' => 'أرغب في تيسير مساحة دعم آمنة مبنية على تبادل الخبرات بين الأقران.',
                    'status' => $status,
                ],
            );
            
            $reviewedBy = $application->reviewedBy === null
                ? null
                : (int) $application->reviewedBy;

            if (
                $application->status !== $status
                || $reviewedBy !== $reviewerId
            ) {
                throw new RuntimeException("Demo Facilitator application for [{$email}] has an inconsistent review state.");
            }
        }
    }

    private function reports(): void
    {
        $reporter = User::query()->where('email', UserSeeder::MEMBERS[0])->where('status', 'Active')->firstOrFail();
        $blockedUser = User::query()->where('email', UserSeeder::MEMBERS[6])->firstOrFail();
        $group = Group::query()->where('title', GroupSeeder::GROUPS['recovery'])->firstOrFail();
        $event = Event::query()->where('title', EventSeeder::TITLES['canceled'])->firstOrFail();

        $targets = [
            ['user', $blockedUser->id, 'safety', 'مراجعة سلوك حساب داخل مساحة المجتمع. تنبيه تجريبي لسير عمل السلامة.'],
            ['event', $event->id, 'event_content', 'مراجعة وصف فعالية مجتمعية ملغاة قبل إعادة نشرها.'],
            ['group', $group->id, 'group_content', 'مراجعة معلومات المجموعة المؤرشفة ضمن سجل البلاغات.'],
        ];

        foreach ($targets as [$type, $targetId, $category, $description]) {
            Report::firstOrCreate(
                ['reporterId' => $reporter->id, 'targetType' => $type, 'targetId' => $targetId, 'category' => $category],
                [
                    'description' => $description,
                    'status' => match ($type) {
                        'user' => 'Open',
                        'event' => 'Resolved',
                        default => 'Dismissed',
                    }
                ],
            );
        }
    }

    private function notifications(User $admin): void
    {
        $pendingSpecialist = Specialist::query()->whereHas('user', fn($query) => $query->where('email', UserSeeder::SPECIALISTS[0]))->where('status', 'pending')->firstOrFail();
        $pendingApplication = FacilitatorApplication::query()
            ->where('userId', $this->userId(UserSeeder::MEMBERS[0]))
            ->where('proposedTopic', 'تيسير دائرة دعم الناجين من السرطان')
            ->where('status', 'Pending')
            ->firstOrFail();
        $safetyReport = Report::query()
            ->where('reporterId', $this->userId(UserSeeder::MEMBERS[0]))
            ->where('targetType', 'user')
            ->where('targetId', $this->userId(UserSeeder::MEMBERS[6]))
            ->where('category', 'safety')
            ->firstOrFail();
        $publishedEvent = Event::query()
            ->where('hostId', $this->userId(UserSeeder::FACILITATORS[0]))
            ->where('title', EventSeeder::TITLES['survivors'])
            ->firstOrFail();
        $confirmedBooking = Booking::query()
            ->where('userId', $this->userId(UserSeeder::MEMBERS[3]))
            ->where('status', 'Confirmed')
            ->firstOrFail();

        $entries = [
            [$admin->id, 'specialist_application', "لديك طلب أخصائي قيد المراجعة رقم {$pendingSpecialist->id}.", '/api/admin/dashboard'],
            [$admin->id, 'facilitator_application', "يوجد طلب تيسير قيد المراجعة رقم {$pendingApplication->id}.", '/api/admin/dashboard'],
            [$admin->id, 'report', "بلاغ السلامة رقم {$safetyReport->id} بحالة {$safetyReport->status}.", '/api/admin/dashboard'],
            [$this->userId(UserSeeder::MEMBERS[0]), 'event', "نُشر لقاء {$publishedEvent->title}.", null],
            [$this->userId(UserSeeder::MEMBERS[3]), 'booking', "تم تأكيد حجزك رقم {$confirmedBooking->id}.", null],
            [$this->userId(UserSeeder::FACILITATORS[1]), 'membership', 'لديك طلب عضوية جديد لمراجعته بصفتك ميسر المجموعة.', null],
            [$this->userId(UserSeeder::SPECIALISTS[1]), 'booking', 'لديك موعد مؤكد مع عضو في المجتمع.', null],
        ];

        foreach ($entries as [$userId, $type, $message, $link]) {
            foreach ([false, true] as $isRead) {
                AppNotification::firstOrCreate(
                    ['userId' => $userId, 'type' => $type, 'message' => $message, 'link' => $link, 'isRead' => $isRead],
                    ['message' => $message],
                );
            }
        }
    }

    private function aiSessions(): void
    {
        $examples = [
            [UserSeeder::MEMBERS[0], ['message' => 'أبحث عن مجموعة لأشخاص أنهوا علاج السرطان.'], [['type' => 'group', 'title' => GroupSeeder::GROUPS['survivors']]]],
            [UserSeeder::MEMBERS[1], ['message' => 'أحتاج إلى موارد دعم لمرافقة أحد أفراد عائلتي.'], [['type' => 'resource', 'title' => 'موارد دعم مقدمي الرعاية']]],
            [UserSeeder::MEMBERS[2], ['message' => 'كيف أجد مساحة للحديث عن رحلة أطفال الأنابيب؟'], [['type' => 'group', 'title' => GroupSeeder::GROUPS['fertility']]]],
            [UserSeeder::MEMBERS[3], ['message' => 'أود معرفة خيارات الدعم المهني المتاحة.'], [['type' => 'event', 'title' => EventSeeder::TITLES['standalone']]]],
        ];

        foreach ($examples as [$email, $input, $recommendations]) {
            $user = User::query()->where('email', $email)->where('status', 'Active')->firstOrFail();
            // No unique key exists for AI sessions. Avoid duplication without rewriting user history.
            if (!AiSession::query()->where('userId', $user->id)->exists()) {
                AiSession::create([
                    'userId' => $user->id,
                    'userInput' => $input,
                    'recommendations' => $recommendations,
                ]);
            }
        }
    }

    private function userId(string $email): int
    {
        return (int) User::query()->where('email', $email)->firstOrFail()->getKey();
    }
}
