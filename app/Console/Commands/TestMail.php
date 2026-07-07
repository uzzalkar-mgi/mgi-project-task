<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

#[Signature('mail:test {email}')]
#[Description('Send a test email synchronously to verify SMTP config.')]
class TestMail extends Command
{
    public function handle(): int
    {
        $to = $this->argument('email');

        $this->line('Mailer: '.config('mail.default').' | host: '.config('mail.mailers.smtp.host').':'.config('mail.mailers.smtp.port'));

        try {
            Mail::raw('✅ PTS test email — your SMTP configuration works. Sent at '.now(), function ($m) use ($to) {
                $m->to($to)->subject('PTS Mail Test');
            });
            $this->info("Sent to {$to}. Check the inbox (and spam).");

            return self::SUCCESS;
        } catch (\Throwable $e) {
            $this->error('FAILED: '.$e->getMessage());

            return self::FAILURE;
        }
    }
}
