<?php

namespace App\Http\Controllers;

use App\Models\LoginHistory;
use App\Models\User;
use App\Support\Totp;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class TwoFactorController extends Controller
{
    // ---- Login challenge (guest, mid-login) -----------------------------

    public function challenge(Request $request): Response|RedirectResponse
    {
        if (! $request->session()->has('2fa:user')) {
            return redirect()->route('login');
        }

        return Inertia::render('Auth/TwoFactorChallenge');
    }

    public function verify(Request $request): RedirectResponse
    {
        $request->validate(['code' => ['required', 'string']]);

        $userId = $request->session()->get('2fa:user');
        $user = $userId ? User::find($userId) : null;
        if (! $user || ! $user->two_factor_secret) {
            return redirect()->route('login');
        }

        if (! Totp::verify($user->two_factor_secret, $request->input('code'))) {
            return back()->withErrors(['code' => 'Invalid authentication code.']);
        }

        $remember = (bool) $request->session()->pull('2fa:remember', false);
        $request->session()->forget('2fa:user');

        Auth::login($user, $remember);
        $request->session()->regenerate();
        $this->recordLogin($request, $user);

        return redirect()->intended(route('dashboard', absolute: false));
    }

    // ---- Management (authenticated, from Profile) -----------------------

    /** Begin setup: generate a secret (not yet enabled). */
    public function enable(Request $request): RedirectResponse
    {
        $user = $request->user();
        if (! $user->two_factor_enabled) {
            $user->forceFill(['two_factor_secret' => Totp::secret()])->save();
        }

        return back();
    }

    /** Confirm the 6-digit code to finish enabling. */
    public function confirm(Request $request): RedirectResponse
    {
        $request->validate(['code' => ['required', 'string']]);
        $user = $request->user();

        if (! $user->two_factor_secret || ! Totp::verify($user->two_factor_secret, $request->input('code'))) {
            return back()->withErrors(['code' => 'Invalid code — try again.']);
        }

        $user->forceFill(['two_factor_enabled' => true])->save();

        return back()->with('status', 'Two-factor authentication enabled.');
    }

    public function disable(Request $request): RedirectResponse
    {
        $request->user()->forceFill(['two_factor_enabled' => false, 'two_factor_secret' => null])->save();

        return back()->with('status', 'Two-factor authentication disabled.');
    }

    public static function recordLogin(Request $request, User $user): void
    {
        try {
            LoginHistory::create([
                'user_id'    => $user->id,
                'ip'         => $request->ip(),
                'user_agent' => substr((string) $request->userAgent(), 0, 255),
                'created_at' => now(),
            ]);
        } catch (\Throwable $e) {
            // best-effort
        }
    }
}
