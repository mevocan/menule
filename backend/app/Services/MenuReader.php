<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use RuntimeException;
use UnexpectedValueException;

class MenuReader
{
    private const MAX_IMAGE_BYTES = 7_500_000; // API sınırı: base64 halinde 10 MB

    private const MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    private const PROMPT = <<<'TXT'
        Bu fotoğraflar bir restoranın menüsüdür. Menüdeki ürünleri oku ve şemaya uygun JSON döndür.

        Kurallar:
        - Sadece fotoğrafta gördüğünü yaz. Ürün, açıklama veya fiyat uydurma, tahminle tamamlama.
        - Fiyat okunmuyorsa veya yoksa price: null.
        - Bir ürünün adını veya fiyatını tam okuyamadıysan ya da emin değilsen uncertain: true. Emin olduklarında false.
        - Fiyat sadece sayıdır: para birimi ve "TL", "₺" yazma. Türkçe yazımda nokta binlik ayırıcıdır, virgül ondalıktır: "1.250" → 1250, "87,50" → 87.5.
        - Bir üründe porsiyon veya boy farkı varsa (tek/duble, küçük/büyük, 1 porsiyon/1.5 porsiyon gibi) her biri ayrı ürün olsun ve fark adda yazsın: "Adana 1.5 Porsiyon".
        - Açıklama sadece menüde ürünün altında/yanında yazıyorsa doldur, yoksa null.
        - Ürünleri menüdeki kategori başlıkları altında, menüdeki sırayla yaz. Kategori başlığı olmayan ürünler "Diğer" kategorisine.
        - Birden fazla fotoğraf aynı menünün sayfalarıdır. Aynı kategori birden fazla fotoğrafta geçiyorsa tek kategoride birleştir.
        - Adres, telefon, wifi şifresi, çalışma saatleri, slogan, sosyal medya gibi menü dışı yazıları atla.
        - Ürün ve kategori adlarını menüde yazdığı gibi yaz; tamamı büyük harfse normal yazıma çevir ("MERCİMEK ÇORBASI" → "Mercimek Çorbası").
        - Görsel bir yemek/içecek menüsü değilse is_menu: false ve categories: [].
        TXT;

    /**
     * @param  string[]  $imagePaths  Dosya sistemindeki tam yollar
     * @return array{is_menu: bool, categories: array<int, array{name: string, items: array<int, array{name: string, description: ?string, price: int|float|null, uncertain: bool}>}>}
     */
    public function read(array $imagePaths): array
    {
        $content = array_map($this->imageBlock(...), $imagePaths);
        $content[] = ['type' => 'text', 'text' => self::PROMPT];

        $lastError = null;

        for ($attempt = 1; $attempt <= 2; $attempt++) {
            try {
                return $this->validate($this->request($content));
            } catch (UnexpectedValueException $e) {
                $lastError = $e;
                Log::warning('MenuReader geçersiz yanıt', ['attempt' => $attempt, 'error' => $e->getMessage()]);
            }
        }

        throw $lastError;
    }

    private function imageBlock(string $path): array
    {
        if (! is_file($path)) {
            throw new RuntimeException("Dosya bulunamadı: {$path}");
        }

        $mediaType = mime_content_type($path);

        if (! in_array($mediaType, self::MEDIA_TYPES, true)) {
            throw new RuntimeException("Desteklenmeyen dosya türü ({$mediaType}): {$path}");
        }

        if (filesize($path) > self::MAX_IMAGE_BYTES) {
            throw new RuntimeException("Dosya çok büyük (en fazla 7.5 MB): {$path}");
        }

        return [
            'type' => 'image',
            'source' => [
                'type' => 'base64',
                'media_type' => $mediaType,
                'data' => base64_encode(file_get_contents($path)),
            ],
        ];
    }

    private function request(array $content): array
    {
        $response = Http::withHeaders([
            'x-api-key' => config('services.anthropic.key'),
            'anthropic-version' => '2026-10-21',
        ])
            ->timeout(180)
            ->retry(3, 2000, fn ($e) => $e instanceof ConnectionException
                || ($e instanceof RequestException && in_array($e->response->status(), [429, 500, 502, 503, 504, 529], true)))
            ->post('https://api.anthropic.com/v1/messages', [
                'model' => config('services.anthropic.menu_reader_model'),
                'max_tokens' => 16000,
                'output_config' => [
                    'effort' => 'medium',
                    'format' => ['type' => 'json_schema', 'schema' => $this->schema()],
                ],
                'messages' => [['role' => 'user', 'content' => $content]],
            ])
            ->throw()
            ->json();

        Log::info('MenuReader kullanım', $response['usage'] ?? []);

        $stopReason = $response['stop_reason'] ?? null;

        if ($stopReason !== 'end_turn') {
            throw new UnexpectedValueException("Beklenmeyen stop_reason: {$stopReason}");
        }

        $text = collect($response['content'] ?? [])->firstWhere('type', 'text')['text'] ?? null;
        $data = $text === null ? null : json_decode($text, true);

        if (! is_array($data)) {
            throw new UnexpectedValueException('Yanıt JSON değil.');
        }

        return $data;
    }

    private function validate(array $data): array
    {
        $validator = Validator::make($data, [
            'is_menu' => ['required', 'boolean'],
            'categories' => ['present', 'array'],
            'categories.*.name' => ['required', 'string', 'max:120'],
            'categories.*.items' => ['present', 'array'],
            'categories.*.items.*.name' => ['required', 'string', 'max:255'],
            'categories.*.items.*.description' => ['present', 'nullable', 'string', 'max:1000'],
            'categories.*.items.*.price' => ['present', 'nullable', 'numeric', 'min:0', 'max:99999999.99'],
            'categories.*.items.*.uncertain' => ['required', 'boolean'],
        ]);

        if ($validator->fails()) {
            throw new UnexpectedValueException($validator->errors()->first());
        }

        return $data;
    }

    private function schema(): array
    {
        $nullable = fn (string $type) => ['anyOf' => [['type' => $type], ['type' => 'null']]];

        return [
            'type' => 'object',
            'additionalProperties' => false,
            'required' => ['is_menu', 'categories'],
            'properties' => [
                'is_menu' => ['type' => 'boolean'],
                'categories' => [
                    'type' => 'array',
                    'items' => [
                        'type' => 'object',
                        'additionalProperties' => false,
                        'required' => ['name', 'items'],
                        'properties' => [
                            'name' => ['type' => 'string'],
                            'items' => [
                                'type' => 'array',
                                'items' => [
                                    'type' => 'object',
                                    'additionalProperties' => false,
                                    'required' => ['name', 'description', 'price', 'uncertain'],
                                    'properties' => [
                                        'name' => ['type' => 'string'],
                                        'description' => $nullable('string'),
                                        'price' => $nullable('number'),
                                        'uncertain' => ['type' => 'boolean'],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ];
    }
}
