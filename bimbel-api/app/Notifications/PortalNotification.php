<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;

/**
 * Notifikasi dalam aplikasi (lonceng di web & Android). Disimpan di tabel notifications.
 * $kind: jenis untuk ikon/warna (registration_approved, registration_rejected, ...).
 * $details: pasangan label => nilai yang ditampilkan, mis. email & password sementara.
 */
class PortalNotification extends Notification
{
    public function __construct(
        protected string $kind,
        protected string $title,
        protected string $message,
        protected array $details = [],
        protected ?string $link = null,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'kind'    => $this->kind,
            'title'   => $this->title,
            'message' => $this->message,
            'details' => $this->details,
            'link'    => $this->link,
        ];
    }
}
