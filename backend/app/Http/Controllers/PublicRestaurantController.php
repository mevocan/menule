<?php

namespace App\Http\Controllers;

use App\Models\Restaurant;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class PublicRestaurantController extends Controller
{
    public function show(string $slug): JsonResponse
    {
        $key = Restaurant::publicCacheKey($slug);
        $menu = Cache::get($key);

        if ($menu === null) {
            $restaurant = Restaurant::where('slug', $slug)->whereNotNull('published_at')->first();
            abort_unless($restaurant, 404, 'Menü bulunamadı.');

            $menu = $restaurant->toPublicApi();
            Cache::put($key, $menu, now()->addMinutes(10));
        }

        return response()->json($menu)->header('Cache-Control', 'public, max-age=60');
    }
}
