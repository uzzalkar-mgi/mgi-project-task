<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Generic real-time event (SCAFFOLD — not yet dispatched anywhere).
 *
 * Activation (see REALTIME_SETUP.md):
 *   1. composer require laravel/reverb && php artisan reverb:install
 *   2. npm install --save laravel-echo pusher-js
 *   3. set BROADCAST_CONNECTION=reverb + REVERB_* env
 *   4. dispatch RealtimeEvent from controllers, e.g.
 *        RealtimeEvent::dispatch('task.'.$task->uuid, 'TaskUpdated', ['uuid' => $task->uuid]);
 *   5. run: php artisan reverb:start   (a persistent process)
 *
 * With BROADCAST_CONNECTION=null (default), dispatching this is a safe no-op,
 * so wiring the dispatch calls early will NOT break anything.
 */
class RealtimeEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public string $channel,
        public string $name,
        public array $payload = [],
    ) {
    }

    public function broadcastOn(): Channel
    {
        return new PrivateChannel($this->channel);
    }

    public function broadcastAs(): string
    {
        return $this->name;
    }

    public function broadcastWith(): array
    {
        return $this->payload;
    }
}
