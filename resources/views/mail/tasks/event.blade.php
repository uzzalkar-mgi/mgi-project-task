<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $subject ?? 'Task Update' }}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 0;">
        <tr>
            <td align="center">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
                    <!-- Header -->
                    <tr>
                        <td style="background:linear-gradient(135deg,#1e40af,#3b82f6);padding:28px 32px;">
                            <span style="display:inline-block;background:rgba(255,255,255,0.2);color:#fff;font-size:12px;font-weight:600;padding:5px 12px;border-radius:999px;">
                                {{ $event === 'created' ? '🆕 New Task' : '🔄 Status Update' }}
                            </span>
                            <h1 style="margin:14px 0 0;color:#ffffff;font-size:20px;font-weight:700;">{{ $title }}</h1>
                            @if($taskNo)
                                <p style="margin:4px 0 0;color:#dbeafe;font-size:13px;">Task #{{ $taskNo }}</p>
                            @endif
                        </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                        <td style="padding:28px 32px;">
                            <p style="margin:0 0 18px;color:#334155;font-size:15px;line-height:1.6;">{{ $message }}</p>
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                                @if($project)
                                <tr><td style="padding:8px 0;color:#64748b;font-size:13px;width:120px;">Project</td><td style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:600;">{{ $project }}</td></tr>
                                @endif
                                <tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Status</td><td style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:600;">{{ $status }}</td></tr>
                                <tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Priority</td><td style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:600;">{{ $priority }}</td></tr>
                                @if($dueDate)
                                <tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Due Date</td><td style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:600;">{{ $dueDate }}</td></tr>
                                @endif
                            </table>
                            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
                                <tr>
                                    <td style="border-radius:10px;background:linear-gradient(135deg,#1e40af,#3b82f6);">
                                        <a href="{{ $url }}" style="display:inline-block;padding:12px 26px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">View Task Details →</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
                            <p style="margin:0;color:#94a3b8;font-size:12px;">You're receiving this because you're on this task. Manage alerts in your profile settings.</p>
                            <p style="margin:6px 0 0;color:#cbd5e1;font-size:12px;">© {{ date('Y') }} {{ $appName }}</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
