<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePermission
{
    /**
     * Block access when the user lacks the given permission.
     * Instead of a 403, redirect to the dashboard with an error toast.
     *
     * Usage: ->middleware('perm:projects.menu')
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();

        if (! $user || ! $user->hasPermission($permission)) {
            return redirect()
                ->route('dashboard')
                ->with('error', 'You do not have permission to access that page.');
        }

        return $next($request);
    }
}
