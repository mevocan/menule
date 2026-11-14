<?php

namespace App\Console\Commands;

use App\Services\MenuReader;
use Illuminate\Console\Command;

class ReadMenu extends Command
{
    protected $signature = 'menu:read {paths* : Menü fotoğraflarının yolları}';

    protected $description = 'Menü fotoğraflarını MenuReader ile okur ve JSON olarak basar';

    public function handle(MenuReader $reader): int
    {
        $paths = array_map(
            fn (string $path) => str_starts_with($path, '/') ? $path : getcwd().'/'.$path,
            $this->argument('paths'),
        );

        $started = microtime(true);
        $menu = $reader->read($paths);

        $this->line(json_encode($menu, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));

        $items = collect($menu['categories'])->flatMap(fn ($c) => $c['items']);
        $this->newLine();
        $this->info(sprintf(
            '%d kategori, %d ürün, %d emin değil, %d fiyatsız — %.1f sn',
            count($menu['categories']),
            $items->count(),
            $items->where('uncertain', true)->count(),
            $items->whereNull('price')->count(),
            microtime(true) - $started,
        ));

        return self::SUCCESS;
    }
}
