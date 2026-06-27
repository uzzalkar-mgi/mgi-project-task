<?php

namespace App\Http\Middleware;

use App\Models\AppNotification;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user,
                // Flat permission list for frontend gating (super-admin -> ['*']).
                'permissions' => $user ? $user->permissionNames() : [],
                'roles' => $user ? $user->roles->pluck('code') : [],
            ],
            'notifications' => fn () => $user ? [
                'unread' => AppNotification::where('user_id', $user->id)->where('is_read', false)->count(),
                'items'  => AppNotification::where('user_id', $user->id)->latest()->limit(15)->get()
                    ->map(fn (AppNotification $n) => [
                        'id'         => $n->id,
                        'type'       => $n->type,
                        'message'    => $n->message,
                        'link'       => $n->data['link'] ?? null,
                        'is_read'    => $n->is_read,
                        'created_at' => $n->created_at?->diffForHumans(),
                    ]),
            ] : ['unread' => 0, 'items' => []],
        ];
    }
}
