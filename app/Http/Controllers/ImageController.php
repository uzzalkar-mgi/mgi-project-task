<?php

namespace App\Http\Controllers;

use App\Services\ImageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ImageController extends Controller
{
    public function __construct(private ImageService $images)
    {
    }

    /** POST /api/images/upload — multipart field: image. Optional: folder. */
    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'image'  => ['required', 'image', 'mimes:jpg,jpeg,png,webp,gif', 'max:10240'],
            'folder' => ['nullable', 'string', 'max:100', 'regex:/^[a-zA-Z0-9_\-\/]+$/'],
        ]);

        try {
            $result = $this->images->upload($request->file('image'), $request->input('folder', 'images'));
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Upload failed: '.$e->getMessage()], 500);
        }

        return response()->json(['success' => true, ...$result], 201);
    }

    /**
     * Stream a GCS object through the app (bucket stays private).
     * Path from the route param (/media/{path}) OR ?path= query (/api/show?path=…).
     */
    public function show(Request $request, ?string $path = null)
    {
        $path = $path ?: $request->query('path');
        if (! $path) {
            abort(400, 'path is required');
        }

        try {
            $obj = $this->images->get($path);
        } catch (\Throwable $e) {
            abort(404);
        }

        return response($obj['body'], 200, [
            'Content-Type'  => $obj['type'],
            'Cache-Control' => 'public, max-age=86400',
        ]);
    }

    /** DELETE /api/images — body: path. */
    public function destroy(Request $request): JsonResponse
    {
        $data = $request->validate(['path' => ['required', 'string']]);

        try {
            $ok = $this->images->delete($data['path']);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }

        return response()->json(['success' => $ok]);
    }
}
