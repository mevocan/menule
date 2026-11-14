<?php

namespace App\Http\Controllers;

use App\Jobs\ReadMenuJob;
use App\Models\MenuImport;
use App\Models\Restaurant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class MenuImportController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $restaurant = $request->user()->restaurant;
        $latest = $restaurant->menuImports()->latest()->latest('id')->first();

        return response()->json(MenuImport::quota($restaurant->id) + [
            'latest' => $latest?->toApi(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'images' => ['required', 'array', 'min:1', 'max:'.MenuImport::MAX_PER_UPLOAD],
            'images.*' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:8192'],
        ]);

        $files = $request->file('images');
        $restaurantId = $request->user()->restaurant->id;
        $paths = [];

        try {
            $import = DB::transaction(function () use ($files, $restaurantId, &$paths) {
                $restaurant = Restaurant::whereKey($restaurantId)->lockForUpdate()->firstOrFail();

                $remaining = MenuImport::MONTHLY_LIMIT - MenuImport::usedThisMonth($restaurantId);

                if (count($files) > $remaining) {
                    $message = $remaining <= 0
                        ? 'Bu ayki '.MenuImport::MONTHLY_LIMIT.' fotoğraflık okuma hakkınız doldu. Yeni hakkınız ayın 1\'inde tanımlanır.'
                        : 'Bu ay en fazla '.MenuImport::MONTHLY_LIMIT.' fotoğraf okutabilirsiniz. Kalan hakkınız: '.$remaining.'.';

                    throw ValidationException::withMessages(['images' => $message]);
                }

                foreach ($files as $file) {
                    $paths[] = $file->store("menu-imports/{$restaurantId}", 'public');
                }

                $import = $restaurant->menuImports()->create([
                    'image_paths' => $paths,
                    'image_count' => count($paths),
                ]);

                ReadMenuJob::dispatch($import->id)->afterCommit();

                return $import;
            });
        } catch (\Throwable $e) {
            Storage::disk('public')->delete($paths);

            throw $e;
        }

        return response()->json([
            'import' => $import->refresh()->toApi(),
        ] + MenuImport::quota($restaurantId), 201);
    }

    public function show(Request $request, MenuImport $menuImport): JsonResponse
    {
        abort_unless($menuImport->restaurant_id === $request->user()->restaurant->id, 404);

        return response()->json($menuImport->toApi());
    }
}
