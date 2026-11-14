<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['image_paths', 'image_count', 'status', 'error', 'added_items', 'skipped_items'])]
class MenuImport extends Model
{
    public const MONTHLY_LIMIT = 10;

    public const MAX_PER_UPLOAD = 5;

    protected $attributes = [
        'status' => 'pending',
    ];

    protected function casts(): array
    {
        return [
            'image_paths' => 'array',
            'image_count' => 'integer',
            'added_items' => 'integer',
            'skipped_items' => 'integer',
        ];
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    /** Bu takvim ayında kullanılan görsel sayısı (başarısız okumalar sayılmaz). */
    public static function usedThisMonth(int $restaurantId): int
    {
        return (int) static::where('restaurant_id', $restaurantId)
            ->where('status', '!=', 'failed')
            ->where('created_at', '>=', now()->startOfMonth())
            ->sum('image_count');
    }

    public static function quota(int $restaurantId): array
    {
        $used = static::usedThisMonth($restaurantId);

        return [
            'limit' => self::MONTHLY_LIMIT,
            'used' => $used,
            'remaining' => max(0, self::MONTHLY_LIMIT - $used),
        ];
    }

    public function toApi(): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status,
            'image_count' => $this->image_count,
            'error' => $this->error,
            'added_items' => $this->status === 'done' ? $this->added_items : null,
            'skipped_items' => $this->status === 'done' ? $this->skipped_items : null,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
