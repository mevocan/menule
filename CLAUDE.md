# Menüle

Restoranlar için QR menü. Restoran menü fotoğrafını yükler, sistem ürünleri okur, restoran düzeltir, tema seçer, yayınlar. Çıktı: `/qr/{slug}` sayfası ve basılabilir QR kodu.

Fotoğraf zorunlu değil: restoran menüsünü sıfırdan elle de oluşturabilir. Boş panel iki yolu eşit sunar (fotoğraf yükle / elle ekle). Okunan ürünler ile elle eklenenler aynı tablolarda, aynı düzenleme ekranında durur.

## Stack

- `backend/` Laravel, sadece API. Auth: Sanctum (SPA cookie). Veritabanı: PostgreSQL.
- Kuyruk: `database` driver. Dosyalar: `public` disk.
- `frontend/` Nuxt, TypeScript, Tailwind, Pinia ORM.
- QR: `qr-code-styling`, tamamen tarayıcıda.
- LLM: Anthropic Messages API, Laravel `Http` facade ile (SDK yok). Model `.env` içinde: `MENU_READER_MODEL=claude-haiku-5-5`.
- Deploy: Coolify. Frontend `menule.mevlutcandag.com`, API `api.menule.mevlutcandag.com`. Repo: github.com/mevocan/menule.

## Veri modeli

| Tablo | Alanlar |
|---|---|
| `restaurants` | user_id, name, slug (unique), theme, logo_path, published_at |
| `categories` | restaurant_id, name, sort_order |
| `items` | category_id, name, description, price decimal(10,2) nullable, image_path, uncertain bool, sort_order |
| `menu_imports` | restaurant_id, image_paths json, image_count, status (pending/done/failed), error |

Kurallar:

- Bir kullanıcının tek restoranı vardır, kayıt olurken oluşur.
- Slug restoran adından üretilir, yayınlandıktan sonra değişmez (basılı QR bozulmasın).
- Varyant yok. Porsiyon/boy farkı ayrı ürün satırıdır.

## Menü okuma

Akış: tarayıcı fotoğrafı küçültür (uzun kenar 2000px, JPEG) → `POST /menu-imports` → `ReadMenuJob` → `MenuReader` → doğrulama → `categories` ve `items` tablolarına yazma. Frontend 2 saniyede bir `GET /menu-imports/{id}` ile durumu sorar.

- `MenuReader::read(array $imagePaths): array` tek sınıf, tek metot. Tüm fotoğraflar tek API isteğinde gider.
- `php artisan menu:read {paths*}` aynı sınıfı çağırır, JSON'u ekrana basar. Test için.
- İstek formatını ve structured output kullanımını yazmadan önce güncel dokümandan doğrula: https://platform.claude.com/docs
- Okunan ürünler mevcut menünün sonuna eklenir. Okuma hiçbir şeyi silmez.
- Yanıt Laravel Validator ile doğrulanır. Geçersizse bir kez tekrar denenir, yine olmazsa `failed`.

Beklenen yanıt:

```json
{
  "is_menu": true,
  "categories": [
    {
      "name": "Çorbalar",
      "items": [
        { "name": "Mercimek Çorbası", "description": null, "price": 120, "uncertain": false }
      ]
    }
  ]
}
```

Prompt kuralları:

- Sadece gördüğünü yaz, ürün veya fiyat uydurma.
- Fiyat okunmuyorsa `null`. Emin değilsen `uncertain: true`.
- Fiyat sadece sayı.
- Porsiyon/boy farkı varsa ayrı ürün yaz ("Adana 1.5 Porsiyon").
- Kategori başlığı yoksa "Diğer".
- Adres, telefon, wifi şifresi, slogan gibi menü dışı yazıları atla.
- Görsel menü değilse `is_menu: false`.

## Limit

- Restoran başına takvim ayında 10 görsel. Her fotoğraf 1 sayılır.
- Tek yüklemede en fazla 5 fotoğraf.
- Hesap: bu ay oluşturulmuş, `status != failed` olan `menu_imports` kayıtlarının `image_count` toplamı. Ayrı sayaç tablosu yok.
- Limit aşılırsa 422 ve Türkçe mesaj. Yükleme ekranında "Bu ay kalan: 7/10" yazar.

## API

- `POST /register`, `/login`, `/logout`
- `GET|PUT /restaurant`, `POST /restaurant/publish`
- `POST /menu-imports`, `GET /menu-imports/{id}`
- `categories` ve `items` için CRUD, sıralama, ürün görseli yükleme/silme
- `GET /public/restaurants/{slug}` herkese açık, cache'li

## Sayfalar

- `/giris`, `/kayit`
- `/panel` menü: fotoğraf yükleme ve düzenleme tek ekranda. `uncertain` ürünler sarı işaretli.
- `/panel/tasarim` tema seçimi ve QR indirme
- `/qr/[slug]` herkese açık menü, SSR

## Temalar

3 tema, `components/themes/` altında birer Vue bileşeni. Hepsi aynı `menu` prop'unu alır. Veritabanında sadece `restaurants.theme` tutulur. Tema seçim ekranı aynı menüyü üç temada yan yana gösterir.

## QR

- İçerik: sayfanın tam URL'si.
- 4 hazır stil (renk, nokta şekli), ortada isteğe bağlı logo.
- PNG ve SVG indirme. Sunucuda QR saklanmaz.

## YAPMA

- Sipariş, sepet, ödeme, masa takibi
- Abonelik, ücretli plan, ödeme entegrasyonu
- Çoklu dil, özel domain
- Bir kullanıcıya birden fazla restoran, şube
- Admin paneli, istatistik, ziyaretçi sayacı
- Varyant/opsiyon tabloları, alerjen, kalori
- AI ile tema veya görsel üretimi
- Birden fazla LLM sağlayıcısı, model fallback zinciri
- WebSocket, Redis, Horizon
- İstenmemiş paket, soyutlama katmanı, repository pattern
- İstenmemiş test, seed, dokümantasyon dosyası

## Aşamalar

Sırayla ilerle. Her aşamada sadece o aşamanın işini yap, bitince dur ve özet ver.

1. **Kurulum:** Laravel + Nuxt iskeleti, kayıt/giriş, kayıtta restoran ve slug oluşturma.
2. **MenuReader:** sınıf, prompt, doğrulama ve `menu:read` komutu. Arayüz yok. Gerçek menü fotoğraflarıyla elle test, proje bitince (Aşama 7'den sonra) yapılacak.
3. **Düzenleme:** kategori ve ürün CRUD, sıralama, ürün görseli. Elle sıfırdan menü oluşturma bu ekranla yapılır.
4. **Yükleme:** `menu_imports`, job, limit, tablolara yazma, panelde (düzenleme ekranına) yükleme alanı ve durum sorgusu.
5. **Yayın:** 3 tema, tema seçimi, `publish`, `/qr/[slug]` sayfası.
6. **QR:** stil seçimi ve indirme.
7. **Deploy:** Coolify ayarları, kuyruk worker'ı, kalıcı dosya alanı.
8. **Mobil (Flutter):** Aşama 7 ve gerçek fotoğraf testi bittikten sonra. Detay aşağıda.

## Mobil (Aşama 8)

- `mobile/` Flutter uygulaması, sadece restoran sahibi paneli. Müşteri tarafı web'de kalır (`/qr/{slug}`).
- Aynı API'yi kullanır, yeni iş kuralı yok. Auth: Sanctum token (mobil cookie kullanmaz); login/register token döndürecek şekilde genişletilir, web'in cookie akışı bozulmaz.
- Ekranlar: giriş/kayıt, menü düzenleme + fotoğraf yükleme (kamera veya galeri, uzun kenar 2000px JPEG'e küçültülür), tasarım (tema seçimi, yayınla, QR'ı PNG olarak paylaş).
- API adresi derleme zamanında verilir (`--dart-define=API_URL=...`), deploy edilmiş backend'e bağlanır.
