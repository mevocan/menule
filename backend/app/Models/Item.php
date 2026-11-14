<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

#[Fillable(['category_id', 'name', 'description', 'price', 'image_path', 'uncertain', 'sort_order'])]
class Item extends Model
{
    protected $touches = ['category'];

    protected function casts(): array
    {
        return [
            'uncertain' => 'boolean',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function deleteImage(): void
    {
        if ($this->image_path) {
            Storage::disk('public')->delete($this->image_path);
        }
    }

    public function toApi(): array
    {
        return [
            'id' => $this->id,
            'category_id' => $this->category_id,
            'name' => $this->name,
            'description' => $this->description,
            'price' => $this->price === null ? null : (float) $this->price,
            'image_url' => $this->image_path ? Storage::disk('public')->url($this->image_path) : null,
            'uncertain' => $this->uncertain,
            'sort_order' => $this->sort_order,
        ];
    }
}
