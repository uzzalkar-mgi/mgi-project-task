<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ApiTokenController extends Controller
{
    /** Create a personal access token; the plain text is flashed once. */
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:60'],
        ]);

        $token = $request->user()->createToken($data['name']);

        // Show the plain token exactly once (never stored/retrievable again).
        return back()->with('status', 'Token created.')->with('newToken', $token->plainTextToken);
    }

    /** Revoke one of the current user's tokens. */
    public function destroy(Request $request, int $tokenId): RedirectResponse
    {
        $request->user()->tokens()->whereKey($tokenId)->delete();

        return back()->with('status', 'Token revoked.');
    }
}
