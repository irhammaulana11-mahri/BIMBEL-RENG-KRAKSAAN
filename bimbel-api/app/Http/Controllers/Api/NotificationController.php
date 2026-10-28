<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\LocalTime;
use Illuminate\Http\Request;

/**
 * Notifikasi dalam aplikasi milik pengguna yang login (semua role).
 */
class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $items = $user->notifications()->limit(30)->get()->map(fn($n) => [
            'id'         => $n->id,
            'kind'       => $n->data['kind'] ?? null,
            'title'      => $n->data['title'] ?? '',
            'message'    => $n->data['message'] ?? '',
            'details'    => $n->data['details'] ?? [],
            'link'       => $n->data['link'] ?? null,
            'read'       => $n->read_at !== null,
            'created_at' => LocalTime::format($n->created_at, 'Y-m-d H:i'),
        ]);

        return response()->json(['data' => $items, 'unread' => $user->unreadNotifications()->count()]);
    }

    public function markRead(Request $request, string $id)
    {
        $request->user()->notifications()->where('id', $id)->firstOrFail()->markAsRead();
        return response()->json(['unread' => $request->user()->unreadNotifications()->count()]);
    }

    public function markAllRead(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();
        return response()->json(['unread' => 0]);
    }
}
