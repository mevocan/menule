<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Item;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $categories = $request->user()->restaurant->categories()->with('items')->get();

        return response()->json($categories->map->toApi()->values());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate(['name' => ['required', 'string', 'max:120']]);
        $restaurant = $request->user()->restaurant;

        $category = $restaurant->categories()->create([
            'name' => $data['name'],
            'sort_order' => ($restaurant->categories()->max('sort_order') ?? -1) + 1,
        ]);

        return response()->json($category->load('items')->toApi(), 201);
    }

    public function update(Request $request, Category $category): JsonResponse
    {
        $this->authorizeCategory($request, $category);
        $data = $request->validate(['name' => ['required', 'string', 'max:120']]);

        $category->update($data);

        return response()->json($category->load('items')->toApi());
    }

    public function destroy(Request $request, Category $category): Response
    {
        $this->authorizeCategory($request, $category);

        $category->items->each->deleteImage();
        $category->delete();

        return response()->noContent();
    }

    public function order(Request $request): Response
    {
        $restaurant = $request->user()->restaurant;
        $ids = $this->validateOrder($request, $restaurant->categories()->pluck('id')->all());

        DB::transaction(function () use ($restaurant, $ids) {
            foreach ($ids as $index => $id) {
                $restaurant->categories()->whereKey($id)->update(['sort_order' => $index]);
            }
        });

        $restaurant->touch();

        return response()->noContent();
    }

    public function itemOrder(Request $request, Category $category): Response
    {
        $this->authorizeCategory($request, $category);
        $ids = $this->validateOrder($request, $category->items()->pluck('id')->all());

        DB::transaction(function () use ($category, $ids) {
            foreach ($ids as $index => $id) {
                Item::whereKey($id)->where('category_id', $category->id)->update(['sort_order' => $index]);
            }
        });

        $category->restaurant->touch();

        return response()->noContent();
    }

    private function authorizeCategory(Request $request, Category $category): void
    {
        abort_unless($category->restaurant_id === $request->user()->restaurant->id, 404);
    }

    /** @return int[] */
    private function validateOrder(Request $request, array $expected): array
    {
        $ids = $request->validate([
            'ids' => ['array'],
            'ids.*' => ['integer'],
        ])['ids'] ?? [];
        $ids = array_map('intval', $ids);

        $sorted = $ids;
        sort($sorted);
        sort($expected);
        if ($sorted !== array_map('intval', $expected)) {
            throw ValidationException::withMessages(['ids' => 'Sıralama listesi güncel değil, sayfayı yenileyin.']);
        }

        return $ids;
    }
}
