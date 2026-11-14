<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\MenuImportController;
use App\Http\Controllers\PublicRestaurantController;
use App\Http\Controllers\RestaurantController;
use Illuminate\Support\Facades\Route;

Route::middleware('throttle:6,1')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

Route::get('/public/restaurants/{slug}', [PublicRestaurantController::class, 'show'])
    ->middleware('throttle:120,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    Route::get('/restaurant', [RestaurantController::class, 'show']);
    Route::put('/restaurant', [RestaurantController::class, 'update']);
    Route::get('/restaurant/logo', [RestaurantController::class, 'showLogo']);
    Route::post('/restaurant/logo', [RestaurantController::class, 'storeLogo']);
    Route::delete('/restaurant/logo', [RestaurantController::class, 'destroyLogo']);
    Route::post('/restaurant/publish', [RestaurantController::class, 'publish']);

    Route::get('/categories', [CategoryController::class, 'index']);
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/order', [CategoryController::class, 'order']);
    Route::put('/categories/{category}', [CategoryController::class, 'update'])->whereNumber('category');
    Route::delete('/categories/{category}', [CategoryController::class, 'destroy'])->whereNumber('category');
    Route::put('/categories/{category}/items/order', [CategoryController::class, 'itemOrder'])->whereNumber('category');
    Route::post('/categories/{category}/items', [ItemController::class, 'store'])->whereNumber('category');

    Route::put('/items/{item}', [ItemController::class, 'update'])->whereNumber('item');
    Route::delete('/items/{item}', [ItemController::class, 'destroy'])->whereNumber('item');
    Route::post('/items/{item}/image', [ItemController::class, 'storeImage'])->whereNumber('item');
    Route::delete('/items/{item}/image', [ItemController::class, 'destroyImage'])->whereNumber('item');

    Route::get('/menu-imports', [MenuImportController::class, 'index']);
    Route::post('/menu-imports', [MenuImportController::class, 'store']);
    Route::get('/menu-imports/{menuImport}', [MenuImportController::class, 'show'])->whereNumber('menuImport');
});
