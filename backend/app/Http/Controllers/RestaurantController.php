<?php

namespace App\Http\Controllers;

use App\Models\Restaurant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class RestaurantController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json($request->user()->restaurant->toApi());
    }

    public function update(Request $request): JsonResponse
    {
        $restaurant = $request->user()->restaurant;

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'theme' => ['sometimes', 'required', Rule::in(Restaurant::THEMES)],
        ]);

        // Yayınlandıktan sonra slug değişmez: basılı QR kodları bozulmasın.
        if (isset($data['name']) && $data['name'] !== $restaurant->name && ! $restaurant->published_at) {
            $data['slug'] = Restaurant::uniqueSlug($data['name'], $restaurant->id);
        }

        $restaurant->update($data);

        return response()->json($restaurant->toApi());
    }

    public function storeLogo(Request $request): JsonResponse
    {
        $restaurant = $request->user()->restaurant;
        $request->validate([
            'logo' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $path = $request->file('logo')->store('logos', 'public');
        $restaurant->deleteLogo();
        $restaurant->update(['logo_path' => $path]);

        return response()->json($restaurant->toApi());
    }

    /** Logoyu aynı CORS kurallarıyla verir; QR çizerken canvas'ın kirlenmemesi için. */
    public function showLogo(Request $request): BinaryFileResponse
    {
        $path = $request->user()->restaurant->logo_path;
        abort_unless($path && Storage::disk('public')->exists($path), 404);

        return response()->file(Storage::disk('public')->path($path));
    }

    public function destroyLogo(Request $request): JsonResponse
    {
        $restaurant = $request->user()->restaurant;

        $restaurant->deleteLogo();
        $restaurant->update(['logo_path' => null]);

        return response()->json($restaurant->toApi());
    }

    public function publish(Request $request): JsonResponse
    {
        $restaurant = $request->user()->restaurant;

        if (! $restaurant->hasItems()) {
            throw ValidationException::withMessages(['menu' => 'Yayınlamak için menünüzde en az bir ürün olmalı.']);
        }

        if (! $restaurant->published_at) {
            $restaurant->published_at = now();
            $restaurant->save();
        }

        return response()->json($restaurant->toApi());
    }
}
