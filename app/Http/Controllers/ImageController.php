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
