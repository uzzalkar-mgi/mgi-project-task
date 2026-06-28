<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // Minimum password length = 6 (applies wherever Password::defaults() is used).
        Password::defaults(fn () => Password::min(6));

        // Super-admin bypasses every gate; otherwise resolve against role permissions.
        Gate::before(fn (User $user) => $user->isSuperAdmin() ? true : null);

        // Gate per permission name, e.g. @can('projects.create') / $user->can('tasks.assign').
        Gate::define('permission', fn (User $user, string $name) => $user->hasPermission($name));
    }
}
