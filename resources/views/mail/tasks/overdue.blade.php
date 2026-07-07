<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Task Overdue</title>
</head>
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family:'Segoe UI',Helvetica,Arial,sans-serif; color:#334155;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9; padding:24px 0;">
        <tr>
            <td align="center">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px; max-width:92%; background-color:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.08);">

                    <!-- Header -->
                    <tr>
                        <td style="background:linear-gradient(135deg,#9f1239,#e11d48); padding:24px 32px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="color:#ffffff; font-size:18px; font-weight:bold; letter-spacing:0.3px;">MGI · Project Tracking</td>
                                    <td align="right" style="color:#fecdd3; font-size:12px;">Overdue Alert</td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding:32px;">
                            <div style="display:inline-block; background-color:#ffe4e6; color:#be123c; font-size:12px; font-weight:600; padding:5px 12px; border-radius:999px;">
                                ⚠️ {{ $overdueLabel }}
                            </div>

                            <h1 style="margin:16px 0 6px; font-size:20px; color:#0f172a;">{{ $title }}</h1>
                            <p style="margin:0 0 20px; font-size:14px; color:#64748b;">This task has passed its due date and is not yet completed.</p>

                            <!-- Details -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:10px;">
                                <tr>
                                    <td style="padding:12px 18px; border-bottom:1px solid #eef2f7; font-size:13px; color:#94a3b8; width:110px;">Project</td>
                                    <td style="padding:12px 18px; border-bottom:1px solid #eef2f7; font-size:14px; color:#0f172a; font-weight:600;">{{ $project ?? '—' }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:12px 18px; border-bottom:1px solid #eef2f7; font-size:13px; color:#94a3b8;">Due Date</td>
                                    <td style="padding:12px 18px; border-bottom:1px solid #eef2f7; font-size:14px; color:#e11d48; font-weight:600;">{{ $dueDate }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:12px 18px; border-bottom:1px solid #eef2f7; font-size:13px; color:#94a3b8;">Priority</td>
                                    <td style="padding:12px 18px; border-bottom:1px solid #eef2f7; font-size:14px; color:#0f172a; font-weight:600;">{{ $priority }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:12px 18px; font-size:13px; color:#94a3b8;">Status</td>
                                    <td style="padding:12px 18px; font-size:14px; color:#0f172a; font-weight:600;">{{ $status }}</td>
                                </tr>
                            </table>

                            <!-- Button -->
                            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 6px;">
                                <tr>
                                    <td style="border-radius:8px; background:linear-gradient(135deg,#9f1239,#e11d48);">
                                        <a href="{{ $url }}" target="_blank" style="display:inline-block; padding:12px 26px; font-size:14px; font-weight:600; color:#ffffff; text-decoration:none; border-radius:8px;">View Task</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding:18px 32px; background-color:#f8fafc; border-top:1px solid #eef2f7; font-size:12px; color:#94a3b8;">
                            This is an automated alert from {{ $appName }}. Please do not reply to this email.
                        </td>
                    </tr>

                </table>
                <p style="margin:16px 0 0; font-size:11px; color:#cbd5e1;">© {{ date('Y') }} Meghna Group of Industries</p>
            </td>
        </tr>
    </table>
</body>
</html>
