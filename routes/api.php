<?php

use App\Http\Controllers\ImageController;
use Illuminate\Support\Facades\Route;

// Image upload to Google Cloud Storage.
// NOTE: currently unauthenticated for testing — add ->middleware('auth:sanctum')
// (or a token guard) before exposing in production.
Route::post('/images/upload', [ImageController::class, 'upload'])->name('api.images.upload');
Route::delete('/images', [ImageController::class, 'destroy'])->name('api.images.destroy');
