<?php

namespace App\Jobs;

use App\Models\Category;
use App\Models\Item;
use App\Models\MenuImport;
use App\Models\Restaurant;
use App\Services\MenuReader;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;

class ReadMenuJob implements ShouldQueue
{
    use Queueable;

    public int $timeout = 600;

    public int $tries = 1;

    private const ERROR_NOT_MENU = 'Fotoğraflarda bir menü bulunamadı. Menünün tamamı görünecek şekilde, net bir fotoğraf yükleyin.';

    private const ERROR_NO_ITEMS = 'Fotoğraflarda okunabilen ürün bulunamadı. Daha net bir fotoğraf deneyin.';

    private const ERROR_GENERIC = 'Menü okunamadı. Fotoğrafı daha net çekip tekrar deneyin.';

    public function __construct(public int $menuImportId) {}

    public function handle(MenuReader $reader): void
    {
        $import = MenuImport::find($this->menuImportId);

        if (! $import || $import->status !== 'pending') {
            return;
        }

        try {
            $disk = Storage::disk('public');
            $result = $reader->read(array_map($disk->path(...), $import->image_paths));
        } catch (Throwable $e) {
            report($e);
            $this->markFailed($import, self::ERROR_GENERIC);

            return;
        }

        if ($result['is_menu'] === false) {
            $this->markFailed($import, self::ERROR_NOT_MENU);

            return;
        }

        $categories = array_filter($result['categories'], fn ($c) => count($c['items']) > 0);

        if ($categories === []) {
            $this->markFailed($import, self::ERROR_NO_ITEMS);

            return;
        }

        try {
            DB::transaction(fn () => $this->append($import, $categories));
        } catch (Throwable $e) {
            report($e);
            $this->markFailed($import, self::ERROR_GENERIC);
        }
    }

    public function failed(?Throwable $e): void
    {
        MenuImport::whereKey($this->menuImportId)
            ->where('status', 'pending')
            ->update(['status' => 'failed', 'error' => self::ERROR_GENERIC, 'updated_at' => now()]);
    }

    private function append(MenuImport $import, array $categories): void
    {
        $restaurant = Restaurant::whereKey($import->restaurant_id)->lockForUpdate()->firstOrFail();

        $existing = $restaurant->categories()->get()->keyBy(fn (Category $c) => self::key($c->name));
        $nextCategoryOrder = ($restaurant->categories()->max('sort_order') ?? -1) + 1;
        $added = 0;
        $skipped = 0;

        foreach ($categories as $read) {
            $key = self::key($read['name']);
            $category = $existing->get($key);

            if (! $category) {
                $category = $restaurant->categories()->create([
                    'name' => trim($read['name']),
                    'sort_order' => $nextCategoryOrder++,
                ]);
                $existing->put($key, $category);
            }

            $nextItemOrder = (Item::where('category_id', $category->id)->max('sort_order') ?? -1) + 1;

            // Aynı kategoride aynı adlı ürün varsa (önceden ya da bu okumada eklenmiş) tekrar eklenmez.
            $names = Item::where('category_id', $category->id)->pluck('name')
                ->mapWithKeys(fn (string $name) => [self::key($name) => true]);

            foreach ($read['items'] as $item) {
                $itemKey = self::key($item['name']);

                if ($names->has($itemKey)) {
                    $skipped++;

                    continue;
                }

                $names->put($itemKey, true);
                $category->items()->create([
                    'name' => trim($item['name']),
                    'description' => $item['description'],
                    'price' => $item['price'],
                    'uncertain' => $item['uncertain'],
                    'sort_order' => $nextItemOrder++,
                ]);
                $added++;
            }
        }

        $import->update(['status' => 'done', 'error' => null, 'added_items' => $added, 'skipped_items' => $skipped]);
    }

    private function markFailed(MenuImport $import, string $error): void
    {
        $import->update(['status' => 'failed', 'error' => $error]);
    }

    private static function key(string $name): string
    {
        return preg_replace('/\s+/u', ' ', trim(mb_strtolower(strtr($name, ['İ' => 'i', 'I' => 'ı']), 'UTF-8')));
    }
}
