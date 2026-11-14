<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

#[Fillable(['name', 'slug', 'theme', 'logo_path'])]
class Restaurant extends Model
{
    public const THEMES = ['klasik', 'modern', 'sade'];

    protected function casts(): array
    {
        return [
            'published_at' => 'datetime',
        ];
    }

    /**
     * Herkese açık menü cache'i: restoran kaydedildiğinde temizlenir. Kategori ve ürün
     * değişiklikleri $touches zinciriyle (Item → Category → Restaurant) buraya ulaşır.
     */
    protected static function booted(): void
    {
        $forget = function (Restaurant $restaurant) {
            $slugs = array_unique(array_filter([$restaurant->slug, $restaurant->getOriginal('slug')]));

            DB::afterCommit(function () use ($slugs) {
                foreach ($slugs as $slug) {
                    Cache::forget(static::publicCacheKey($slug));
                }
            });
        };

        static::saved($forget);
        static::deleted($forget);
    }

    public static function publicCacheKey(string $slug): string
    {
        return "public-menu:{$slug}";
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function categories(): HasMany
    {
        return $this->hasMany(Category::class)->orderBy('sort_order')->orderBy('id');
    }

    public function menuImports(): HasMany
    {
        return $this->hasMany(MenuImport::class);
    }

    public function hasItems(): bool
    {
        return Item::whereHas('category', fn ($q) => $q->where('restaurant_id', $this->id))->exists();
    }

    public function deleteLogo(): void
    {
        if ($this->logo_path) {
            Storage::disk('public')->delete($this->logo_path);
        }
    }

    public function logoUrl(): ?string
    {
        return $this->logo_path ? Storage::disk('public')->url($this->logo_path) : null;
    }

    public function toApi(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'theme' => $this->theme,
            'logo_url' => $this->logoUrl(),
            'published_at' => $this->published_at?->toIso8601String(),
        ];
    }

    public function toPublicApi(): array
    {
        $categories = $this->categories()->with('items')->get()
            ->filter(fn (Category $category) => $category->items->isNotEmpty())
            ->map(fn (Category $category) => [
                'id' => $category->id,
                'name' => $category->name,
                'items' => $category->items->map(fn (Item $item) => [
                    'id' => $item->id,
                    'name' => $item->name,
                    'description' => $item->description,
                    'price' => $item->price === null ? null : (float) $item->price,
                    'image_url' => $item->image_path ? Storage::disk('public')->url($item->image_path) : null,
                ])->values()->all(),
            ]);

        return [
            'name' => $this->name,
            'slug' => $this->slug,
            'theme' => $this->theme,
            'logo_url' => $this->logoUrl(),
            'categories' => $categories->values()->all(),
        ];
    }

    public static function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $name = mb_strtolower(strtr($name, ['İ' => 'i', 'I' => 'ı']), 'UTF-8');
        $name = strtr($name, ['ç' => 'c', 'ğ' => 'g', 'ı' => 'i', 'ö' => 'o', 'ş' => 's', 'ü' => 'u']);
        $base = Str::slug($name) ?: 'restoran';

        $taken = fn (string $slug) => static::where('slug', $slug)
            ->when($ignoreId, fn ($q) => $q->whereKeyNot($ignoreId))
            ->exists();

        $slug = $base;
        for ($i = 2; $taken($slug); $i++) {
            $slug = "{$base}-{$i}";
        }

        return $slug;
    }
}
