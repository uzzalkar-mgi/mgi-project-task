<?php

namespace App\Http\Controllers;

use App\Models\Attachment;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AttachmentController extends Controller
{
    /**
     * Stream an attachment through the app (works regardless of the public/storage
     * symlink or web-server config). Auth-protected by the route middleware.
     */
    public function show(Attachment $attachment)
    {
        // Derive the storage-relative path from the stored URL.
        $rel = Str::after($attachment->url, '/storage/');
        abort_unless($rel && Storage::disk('public')->exists($rel), 404);

        return Storage::disk('public')->response($rel, $attachment->title);
    }
}
