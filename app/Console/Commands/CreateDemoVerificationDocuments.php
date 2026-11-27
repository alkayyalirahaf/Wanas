<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use App\Models\User;
use App\Models\VerificationDocument;

class CreateDemoVerificationDocuments extends Command
{
    protected $signature = 'demo:create-verification-documents';

    protected $description = 'Create demo PDF verification documents for test specialists';

    public function handle(): int
    {
        $emails = [
            'specialist.test1@demo.wanas.test',
            'specialist.test2@demo.wanas.test',
            'specialist.test3@demo.wanas.test',
            'specialist.test4@demo.wanas.test',
        ];

        foreach ($emails as $email) {

            $user = User::where('email', $email)
                ->where('role', 'specialist')
                ->first();

            if (!$user) {
                $this->warn("User not found: {$email}");
                continue;
            }

            $specialist = $user->specialistProfile;

            if (!$specialist) {
                $this->warn("Specialist profile not found: {$email}");
                continue;
            }

            $documentStatus = match ($specialist->status) {
                'pending' => 'pending',
                'active' => 'approved',
                'rejected' => 'rejected',
                default => 'pending',
            };

            $documents = [
                'license' => 'Professional License',
                'id_card' => 'Identity Card',
            ];

            foreach ($documents as $type => $title) {

                $path = "verification/demo/{$user->id}-{$type}.pdf";

                $pdfContent = $this->createPdf(
                    "WANAS DEMO - {$title}",
                    "User ID: {$user->id}",
                    "Email: {$user->email}",
                    "NOT A REAL DOCUMENT"
                );

                Storage::disk('local')->put($path, $pdfContent);

                VerificationDocument::updateOrCreate(
                    [
                        'userId' => $user->id,
                        'documentType' => $type,
                    ],
                    [
                        'fileUrl' => $path,
                        'status' => $documentStatus,
                    ]
                );
            }

            $this->info("Documents created for: {$email}");
        }

        $this->info('Demo verification documents created successfully.');

        return self::SUCCESS;
    }

    private function createPdf(string ...$lines): string
    {
        $content = "BT\n/F1 18 Tf\n";

        $y = 750;

        foreach ($lines as $index => $line) {
            $line = str_replace(
                ['\\', '(', ')'],
                ['\\\\', '\\(', '\\)'],
                $line
            );

            $fontSize = $index === 0 ? 18 : 12;

            $content .= "/F1 {$fontSize} Tf\n";
            $content .= "1 0 0 1 50 {$y} Tm\n";
            $content .= "({$line}) Tj\n";

            $y -= 40;
        }

        $content .= "ET";

        $objects = [
            '<< /Type /Catalog /Pages 2 0 R >>',
            '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
            '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
            "<< /Length " . strlen($content) . " >>\nstream\n{$content}\nendstream",
        ];

        $pdf = "%PDF-1.4\n";
        $offsets = [0];

        foreach ($objects as $index => $object) {
            $offsets[] = strlen($pdf);

            $number = $index + 1;

            $pdf .= "{$number} 0 obj\n";
            $pdf .= "{$object}\n";
            $pdf .= "endobj\n";
        }

        $xrefOffset = strlen($pdf);

        $pdf .= "xref\n";
        $pdf .= "0 6\n";
        $pdf .= "0000000000 65535 f \n";

        for ($i = 1; $i <= 5; $i++) {
            $pdf .= sprintf("%010d 00000 n \n", $offsets[$i]);
        }

        $pdf .= "trailer\n";
        $pdf .= "<< /Size 6 /Root 1 0 R >>\n";
        $pdf .= "startxref\n";
        $pdf .= "{$xrefOffset}\n";
        $pdf .= "%%EOF";

        return $pdf;
    }
}
