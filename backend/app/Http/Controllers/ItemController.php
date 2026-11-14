<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Item;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class ItemController extends Controller
{
    public function store(Request $request, Category $category): JsonResponse
    {
        abort_unless($category->restaurant_id === $request->user()->restaurant->id, 404);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'price' => ['nullable', 'numeric', 'min:0', 'max:99999999.99'],
        ]);

        $item = $category->items()->create($data + [
            'uncertain' => false,
            'sort_order' => $this->nextSortOrder($category->id),
        ]);

        return response()->json($item->refresh()->toApi(), 201);
    }

    public function update(Request $request, Item $item): JsonResponse
    {
        $restaurantId = $this->authorizeItem($request, $item);

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'price' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:99999999.99'],
            'uncertain' => ['sometimes', 'boolean'],
            'category_id' => ['sometimes', 'integer', Rule::exists('categories', 'id')->where('restaurant_id', $restaurantId)],
        ]);

        if (isset($data['category_id']) && (int) $data['category_id'] !== $item->category_id) {
            $data['sort_order'] = $this->nextSortOrder((int) $data['category_id']);
        }

        $item->update($data);

        return response()->json($item->refresh()->toApi());
    }

    public function destroy(Request $request, Item $item): Response
    {
        $this->authorizeItem($request, $item);

        $item->deleteImage();
        $item->delete();

        return response()->noContent();
    }

    public function storeImage(Request $request, Item $item): JsonResponse
    {
        $this->authorizeItem($request, $item);
        $request->validate([
            'image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $path = $request->file('image')->store('items', 'public');
        $item->deleteImage();
        $item->update(['image_path' => $path]);

        return response()->json($item->toApi());
    }

    public function destroyImage(Request $request, Item $item): JsonResponse
    {
        $this->authorizeItem($request, $item);

        $item->deleteImage();
        $item->update(['image_path' => null]);

        return response()->json($item->toApi());
    }

    private function authorizeItem(Request $request, Item $item): int
    {
        $restaurantId = $request->user()->restaurant->id;
        abort_unless($item->category->restaurant_id === $restaurantId, 404);

        return $restaurantId;
    }

    private function nextSortOrder(int $categoryId): int
    {
        return (Item::where('category_id', $categoryId)->max('sort_order') ?? -1) + 1;
    }
}
