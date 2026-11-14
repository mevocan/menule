# Menüle: owner app design plan

Scope: `/giris`, `/kayit`, `/panel`, `/panel/tasarim`. The public diner themes (`/qr/[slug]`) are a separate task and do not inherit these tokens.

## 1. Brief

- **Subject:** a tool that turns a photo of a paper menu into an editable digital menu, then a printable QR code.
- **Audience:** owners of small restaurants, cafés and kebab shops in Turkey. Usually on a phone, between customers, not designers.
- **Primary job:** photo, then check what was read, then fix it, then publish and print. Most of the time goes into the "check and fix" step.

## 2. First pass (rejected in parts, kept for the record)

**Direction: "thermal receipt".** The owner's world is full of receipts, so the app looks like one.

| Name | Hex | Role |
|---|---|---|
| Fiş kâğıdı | `#F6F3EC` | background |
| Termal siyah | `#111111` | text |
| Fiş grisi | `#8C8C8C` | secondary |
| Uyarı sarısı | `#FFD600` | uncertain |
| Domates | `#E5482D` | accent / CTA |

Type: IBM Plex Mono for prices and labels, a high-contrast serif (Fraunces) for headings, Inter for body.
Layout: a centred narrow column like a till roll, dashed dividers between sections, ALL-CAPS small labels ("KATEGORİ", "FİYAT").

## 3. Review against the brief

I tried the same prompt for a generic "restaurant SaaS" and landed in almost the same place. That means the first pass was a default, not a choice:

| Drift | Why it's a default | Change |
|---|---|---|
| `#F6F3EC` paper + serif + tomato-red accent | This is calibration tell #1 almost exactly: cream, serif, terracotta. | Dropped the cream. The background is plain white paper, and the accent is ballpoint-pen blue. |
| `#111` "thermal black" | Tell #5: tinted near-black standing in for black. | Text is graphite `#26292E`, the pencil the owner already uses. |
| Monospace for prices and labels | Tell #5. Receipts are mono, but owners never *write* on receipts. | One grotesque family with tabular figures. Prices line up without the mono look. |
| ALL-CAPS labels, dashed dividers | Tells #3 and #5. Decoration, not information. | Sentence-case labels. The only rules are the item rows and the price column, which are real structure. |
| Tomato red as CTA | Red has to mean "error" in a correction tool. A red CTA trains people to ignore red. | Red is reserved for the red pen (errors). |
| Receipt as the metaphor | A receipt is printed *by* the system. The owner's job is to *correct* a sheet. | Switched the metaphor to the **adisyon** (the carbon order pad every eatery has) and the three pens on the counter. |

**Revised direction: "adisyon and three pens".**
The menu being edited is a ruled order-pad sheet: pale-blue printed lines, a vertical rule separating the price column. Every mark on it comes from one of the three pens the owner already has by the till:

- **Blue ballpoint (tükenmez mavisi):** the owner's actions. Buttons, links, focus.
- **Yellow highlighter (fosforlu kalem):** "check this". Only for `uncertain` items. The spec's yellow becomes the identity instead of clashing with it.
- **Red pen (kırmızı kalem):** errors. Nothing else is red.

Second check: is "white + blue primary" the SaaS default? The risk is real. What separates it: (a) the blue is a violet-leaning ballpoint ink, not Tailwind `blue-500`. (b) There are no cards: one ruled sheet, not a grid of boxes. (c) Headings use a condensed width taken from shop-sign lettering. (d) The highlighter carries the personality. If the build starts to look like a card dashboard, the sheet has been lost.

## 4. Final token system

### 4.1 Color (light only)

```css
:root {
  color-scheme: light;

  /* paper */
  --paper:        #FFFFFF; /* page and sheet background */
  --carbon:       #F2F4FA; /* blue carbon-copy tint: upload zone, desktop side column, read-only rows */

  /* pencil */
  --graphite:     #26292E; /* body text, headings (14.5:1 on paper) */
  --graphite-2:   #5F6670; /* secondary text, helper text (5.8:1) */
  --line-strong:  #7D8696; /* input borders, checkbox borders (3.7:1, meets the 3:1 non-text minimum) */
  --rule:         #C7D0EC; /* printed adisyon lines: item rows, price-column rule. Structure only, never a control boundary */

  /* blue ballpoint */
  --ink:          #1D3AB0; /* primary buttons, links, focus ring, selected state (8.6:1) */
  --ink-press:    #152A85; /* hover and active */
  --ink-wash:     #E7EBFA; /* selected row, drag target */

  /* highlighter */
  --marker:       #FFE14D; /* uncertain highlight fill */
  --marker-edge:  #C9A400; /* 3px left tick on uncertain rows; also visible in grayscale */

  /* red pen */
  --redpen:       #C4231B; /* error text, error border, delete (5.9:1) */
  --redpen-wash:  #FCECEA; /* error banner background */
}
```

There is no success green. A success message is written in `--ink`; the "done" state is the blue pen ticking something off. That keeps the three-pen system clean and stops green competing with the yellow.

**No dark mode.** The work is short, happens in daylight in a shop, and is built on a paper metaphor. A highlighter on a dark surface loses its meaning. The spec doesn't ask for it, and skipping it halves the QA. Set `color-scheme: light` so form controls don't invert.

Tailwind: map these in `tailwind.config` under `colors` (`paper`, `carbon`, `graphite`, `graphite-2`, `line-strong`, `rule`, `ink`, `ink-press`, `ink-wash`, `marker`, `marker-edge`, `redpen`, `redpen-wash`) as `var(--name)`. Do not use the default Tailwind palette anywhere in the owner app.

### 4.2 Type

One family, two widths: **Archivo** (Google Fonts, variable, `wdth` 62–125, `wght` 100–900).

- Verified: the Google CSS serves `latin` (contains ç ö ü ı, U+0131) and `latin-ext` (contains ğ İ ş, U+011E–015F, and ₺ U+20BA). The font's GSUB includes `locl` for `TRK` (correct i/İ casing), plus `tnum`, `case`, `frac`, `zero`.
- Load: `https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..800&display=swap`. Set `<html lang="tr">` so `locl TRK` and CSS `text-transform` handle dotted İ correctly.
- **Archivo Condensed** (`font-stretch: 72%`) is for headings and the wordmark. It comes from the condensed lettering on Turkish shop signs and price boards, and it fits long Turkish words ("Kahvaltılıklar", "Ara Sıcaklar") on a phone width.
- **Archivo Normal** (`font-stretch: 100%`) is for body, labels, inputs, buttons.
- Prices: always `font-variant-numeric: tabular-nums;`, right-aligned, formatted `120 ₺` (thin space U+202F before ₺). Decimals only when non-zero: `87,50 ₺`.

| Token | Size / line-height | Weight | Width | Use |
|---|---|---|---|---|
| `display` | 40px / 42px (2.5rem) | 800 | 72% | auth headline on desktop only |
| `h1` | 30px / 34px (1.875rem) | 750 | 72% | page title, auth headline on mobile |
| `h2` | 22px / 26px (1.375rem) | 700 | 72% | category name on the sheet |
| `body` | 16px / 24px (1rem) | 400 | 100% | default, all inputs (16px avoids iOS zoom) |
| `item` | 17px / 24px (1.0625rem) | 550 | 100% | item name on the sheet |
| `small` | 14px / 20px (0.875rem) | 400 | 100% | helper, description, quota |
| `label` | 14px / 20px | 600 | 100% | form labels, sentence case |
| `button` | 16px / 20px | 650 | 100% | buttons |

Letter-spacing: 0 for body. Condensed headings get `-0.005em`. Never track out.
Line length: max `34rem` (~65 characters) for any running text.

### 4.3 Spacing

4px base. Tailwind's default steps already match; use only these: `1`=4, `2`=8, `3`=12, `4`=16, `6`=24, `8`=32, `12`=48, `16`=64.

- Page gutter: 16px on mobile, 32px from `md`.
- Sheet row: min-height 56px, padding-y 12px. The touch target is the whole row.
- Between categories: 32px. Between form fields: 20px (label to input 6px, input to helper or error 6px).

### 4.4 Radii by hierarchy

Rule: the larger the object, the smaller the relative radius, and an inner radius never exceeds its container's.

| Level | Radius | Applies to |
|---|---|---|
| Sheet / panel | 4px | the ruled menu sheet, upload zone, desktop side column. It's paper: barely softened. |
| Controls | 8px | buttons, inputs, selects, photo thumbnails, theme preview frames |
| Marks | 2px | highlighter fill, tags ("Kontrol et") |
| Round | 999px | avatar-free app, so only the QR-style swatches on `/panel/tasarim` |

No shadows except one: a pop-up (menu, toast) gets `0 6px 20px -8px rgba(38,41,46,.35)` plus a 1px `--line-strong` border. Nothing on the page itself has a shadow.

### 4.5 Focus

```css
:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; border-radius: inherit; }
```
On highlighted rows the blue ring sits outside the yellow, so it stays visible. Never remove an outline without replacing it.

### 4.6 The uncertain treatment (highlighter)

An item with `uncertain: true` is drawn as if someone highlighted it on paper:

- The item **name text** gets the marker behind it, not the whole row. Use `background: linear-gradient(transparent 12%, var(--marker) 12%, var(--marker) 88%, transparent 88%); box-decoration-break: clone; padding: 0 .15em; border-radius: 2px;` on an inline `<span>`, so it follows line wraps like a real highlighter stroke.
- If the price is missing (`null`) on an uncertain item, the empty price field also gets the marker fill.
- A 3px `--marker-edge` tick on the row's left edge, so the state survives grayscale and colour blindness.
- A text tag at the end of the name line: `Kontrol et` (small, 600, graphite on `--marker`, radius 2px). The state is never colour-only.
- The owner clears it with a `Doğru` button in the expanded row, or automatically when they edit the name or price. On clear, the highlight fades out over 200ms.
- On `/panel`, above the sheet: `3 ürünü kontrol edin` as an ink link that scrolls to the first highlighted row. When none are left it disappears. There's no "all good!" celebration.

### 4.7 Components

**Primary button.** Background `--ink`, text white, 48px tall, padding-x 20px, radius 8px, weight 650. Hover and active use `--ink-press`. Disabled: `--carbon` background, `--graphite-2` text, no opacity tricks. Loading: label changes to the present continuous ("Giriş yapılıyor…"), width locked, no spinner-only state. Full width on mobile, auto from `md`.

**Secondary button.** Background `--paper`, 1.5px `--ink` border, `--ink` text, same size.

**Text button.** `--ink` text, underline on hover only, 44px min touch height. No trailing arrows.

**Destructive.** Text button in `--redpen`. Deleting an item or category asks inline ("Silinsin mi? Sil / Vazgeç") in the row itself, with no modal.

**Input.** 48px tall, 16px text, padding-x 12px, 1px `--line-strong` border, radius 8px, `--paper` background. The label sits above the input and is always visible (no placeholder-as-label). Focus: border becomes `--ink` plus the focus ring. Price input: `inputmode="decimal"`, right-aligned, with a ` ₺` suffix inside the field.

**Error (field).** Border `--redpen`, and the message below in 14px `--redpen` starting with a 16px exclamation icon. `aria-describedby` links it, and the field gets `aria-invalid`. Error text says what's wrong and what to do.

**Error (form/page).** A full-width banner above the form: `--redpen-wash` background, 4px `--redpen` left border, graphite text, radius 4px. Use it for network and server errors only.

**Toast.** Bottom centre on mobile, bottom left on desktop. Paper, the pop-up shadow, graphite text, one optional ink action. It closes after 4s. It uses the same verb as the action ("Yayınla" produces "Yayınlandı").

**The sheet (`/panel` editing).** One white sheet. Each category is an `h2` (condensed, editable on tap) followed by rows. A row is the item name, with the description below in `small`/`--graphite-2`, and the price right-aligned in a fixed 96px column. A 1px `--rule` line separates rows, and a single 1px `--rule` vertical line marks the price column from the top of the category to the bottom. That vertical line is the adisyon. Tapping a row expands it in place into fields (Ürün adı, Açıklama, Fiyat, Görsel) with `Kaydet` / `Vazgeç`; only one row is open at a time. The drag handle (6 dots) sits at the left, visible from `md`; on mobile, sorting uses "Yukarı taşı / Aşağı taşı" in the expanded row.

**Upload zone.** A `--carbon` background with a 1.5px dashed `--line-strong` border, radius 4px. On mobile the whole zone is one button: `Fotoğraf çek veya seç` (`accept="image/*"`, multiple). Selected photos show as 64px thumbnails with an × to remove, then the button `Menüyü oku (3 fotoğraf)`. The quota appears on the zone's right edge: `Bu ay kalan: 7/10`.

**Reading state.** The zone becomes a status line: `Menü okunuyor… Bu biraz sürebilir, sayfadan çıkabilirsiniz.` The thumbnails stay visible. No progress bar (there's no real progress to show).

**Empty states.** Each one states the situation in one line, then offers one action. See section 5.

### 4.8 Motion

Exactly one orchestrated moment: when a read finishes, the new rows appear in order (30ms stagger, opacity only, 150ms each). Then each uncertain name gets its highlighter stroke drawn left to right (`background-size` 0 to 100%, 280ms ease-out). It's the AI handing the owner its marked-up sheet. Everything else is instant, apart from motion that responds to the owner: a row expanding (150ms height) and the highlight fading when cleared. With `prefers-reduced-motion: reduce`, nothing animates and the highlight is just present.

## 5. Layout and wireframes

Alignment: everything is left-aligned. Prices are right-aligned in their column. Nothing is centred except the toast on mobile.

### /giris and /kayit, mobile (360px)

```
┌────────────────────────────────┐
│ Menüle                    │  wordmark, condensed 800, 20px, graphite
│                                │
│ Giriş yap                      │  h1
│                                │
│ E-posta                        │
│ ┌────────────────────────────┐ │
│ │                            │ │
│ └────────────────────────────┘ │
│ Şifre                          │
│ ┌────────────────────────────┐ │
│ │                    Göster  │ │
│ └────────────────────────────┘ │
│ ┌────────────────────────────┐ │
│ │        Giriş yap           │ │  primary, full width
│ └────────────────────────────┘ │
│                                │
│ Hesabınız yok mu? Kayıt olun   │  text + ink link
└────────────────────────────────┘
```

### /giris, desktop (≥1024px)

On the left is the form column (max 400px), starting 96px from the top. On the right, in a `--carbon` panel, is a specimen of the product: a real ruled sheet fragment, not an illustration. It's static, aria-hidden, and not interactive.

```
┌──────────────────────────────────┬───────────────────────────────────────┐
│ Menüle                      │                                       │
│                                  │   Çorbalar                            │
│ Giriş yap                        │  ───────────────────────────┬──────── │
│                                  │   Mercimek Çorbası          │  120 ₺  │
│ E-posta                          │  ───────────────────────────┼──────── │
│ [                          ]     │   Ezogelin Çorbası          │  120 ₺  │
│ Şifre                            │  ───────────────────────────┼──────── │
│ [                          ]     │  ▌[İşkembe Çorbası] Kontrol et│ 16? ₺ │  ← highlighter
│                                  │  ───────────────────────────┼──────── │
│ [ Giriş yap ]                    │   Adana Dürüm               │  260 ₺  │
│                                  │  ───────────────────────────┼──────── │
│ Hesabınız yok mu? Kayıt olun     │   Adana 1.5 Porsiyon        │  390 ₺  │
│                                  │  ───────────────────────────┴──────── │
│                                  │                                       │
│                                  │   Kâğıt menünüzün fotoğrafını         │
│                                  │   çekin. Ürünler buraya yazılır,      │
│                                  │   emin olunmayanlar işaretlenir.      │
└──────────────────────────────────┴───────────────────────────────────────┘
          ~45%                                   ~55%
```
The price on the highlighted row is shown as an empty marked field on the real build, not "16?". `/kayit` uses the same layout.

### /panel, mobile (360px)

```
┌────────────────────────────────┐
│ Menüle        Tasarım  ≡  │  top bar 56px; "Tasarım" goes to /panel/tasarim; ≡ = Çıkış yap
├────────────────────────────────┤
│ Kebapçı Mehmet                 │  h1 = restaurant name
│ Yayında değil · Yayınla        │  status + ink action (see note)
│                                │
│ ┌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┐ │  upload zone (carbon, dashed)
│ ╎ Fotoğraf çek veya seç      ╎ │
│ ╎ En fazla 5 fotoğraf        ╎ │
│ ╎           Bu ay kalan: 7/10╎ │
│ └╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘ │
│                                │
│ 3 ürünü kontrol edin           │  ink link, only when > 0
│                                │
│ Çorbalar                       │  h2
│ ───────────────────────┬────── │
│ Mercimek Çorbası       │ 120 ₺ │
│ ───────────────────────┼────── │
│▌[İşkembe Çorbası]      │[    ] │  highlighter + empty marked price
│  Kontrol et            │       │
│ ───────────────────────┼────── │
│ + Ürün ekle            │       │
│ ───────────────────────┴────── │
│                                │
│ + Kategori ekle                │
└────────────────────────────────┘
```
Note: the status line is not a middle-dot meta string. Build it as two separate elements: a status word and a link. The "Yayınla" action belongs to stage 5, so in stage 3 show only the status.

### /panel, desktop (≥1024px)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Menüle                               Menü   Tasarım     Çıkış yap   │
├───────────────────────────┬──────────────────────────────────────────────┤
│ Kebapçı Mehmet            │  3 ürünü kontrol edin                        │
│ Yayında değil             │                                              │
│                           │  Çorbalar                                    │
│ ┌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┐ │  ⠿ ─────────────────────────────┬────────── │
│ ╎ Fotoğrafları buraya   ╎ │  ⠿  Mercimek Çorbası              │   120 ₺   │
│ ╎ sürükleyin veya seçin ╎ │      Günlük, limon ile            │           │
│ ╎ En fazla 5 fotoğraf   ╎ │  ⠿ ─────────────────────────────┼────────── │
│ └╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘ │  ⠿ ▌[İşkembe Çorbası] Kontrol et│ [      ]  │
│ Bu ay kalan: 7/10         │  ⠿ ─────────────────────────────┴────────── │
│                           │     + Ürün ekle                              │
│ Son okuma                 │                                              │
│ 12 ürün eklendi.          │  Kebaplar                                    │
│                           │  ...                                         │
│  side column 320px,       │  sheet max-width 720px                       │
│  carbon, sticky           │                                              │
└───────────────────────────┴──────────────────────────────────────────────┘
```

### /panel/tasarim (sketch, built in stages 5–6)

The three themes sit side by side as phone-sized frames (radius 8px) showing the same menu. Below them, a scrollable row on mobile. The selected one gets a 2px `--ink` border and the text `Seçili`. The QR section has 4 style swatches (round, 40px), a `Logo ekle` toggle, a live preview, and `PNG indir` / `SVG indir`. The themes' own colours live only inside their frames; the app chrome around them stays paper and graphite so it doesn't compete.

## 6. Turkish copy

Voice: "siz", plain and short. Buttons use the standard imperative ("Giriş yap", "Kaydet"). No exclamation marks, no "Harika!", no "Oops".

### /giris

| Element | Copy |
|---|---|
| Page title | `Giriş yap · Menüle` |
| h1 | `Giriş yap` |
| Label | `E-posta` |
| Label | `Şifre` |
| Password toggle | `Göster` / `Gizle` |
| Button | `Giriş yap`, loading: `Giriş yapılıyor…` |
| Footer | `Hesabınız yok mu?` + link `Kayıt olun` |
| Desktop specimen caption | `Kâğıt menünüzün fotoğrafını çekin. Ürünler buraya yazılır, emin olunmayanlar işaretlenir.` |

### /kayit

| Element | Copy |
|---|---|
| Page title | `Kayıt ol · Menüle` |
| h1 | `Menünüzü internete taşıyın` |
| Label | `Restoran adı` |
| Helper (live) | `Menü adresiniz: menule.mevlutcandag.com/qr/kebapci-mehmet` (slug preview updates as they type; this is the one place the slug is explained) |
| Label | `E-posta` |
| Label | `Şifre` |
| Helper | `En az 8 karakter.` |
| Button | `Hesap oluştur`, loading: `Hesap oluşturuluyor…` |
| Footer | `Zaten hesabınız var mı?` + link `Giriş yapın` |

(The browser tab titles use the separator because they are tab titles, not on-page meta strings.)

### Errors (auth)

| Case | Copy |
|---|---|
| Empty e-mail | `E-posta adresinizi yazın.` |
| Malformed e-mail | `Bu e-posta adresi eksik görünüyor. Örnek: ad@ornek.com` |
| Empty password | `Şifrenizi yazın.` |
| Short password | `Şifre en az 8 karakter olmalı.` |
| Empty restaurant name | `Restoran adını yazın. Menünüzün başlığında görünecek.` |
| Wrong credentials | `E-posta veya şifre yanlış.` |
| E-mail taken | `Bu e-posta ile bir hesap var.` + link `Giriş yapın` |
| Too many attempts | `Çok fazla deneme yapıldı. 1 dakika sonra tekrar deneyin.` |
| Network | `Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.` |
| Session expired (any page) | `Oturumunuzun süresi doldu. Tekrar giriş yapın.` |

### /panel (stage 3–4 strings, for consistency)

| Element | Copy |
|---|---|
| Empty menu, h2 | `Menünüz henüz boş` |
| Empty menu, body | `Kâğıt menünüzün fotoğrafını yükleyin. Ürünler ve fiyatlar buraya yazılır, siz kontrol edip düzeltirsiniz.` |
| Empty menu, actions | `Fotoğraf çek veya seç` (primary) · `Elle ürün ekle` (text button) |
| Upload hint | `En fazla 5 fotoğraf. Menünün tamamı görünsün, yazılar net olsun.` |
| Quota | `Bu ay kalan: 7/10` |
| Read button | `Menüyü oku (3 fotoğraf)` |
| Reading | `Menü okunuyor… Bu biraz sürebilir, sayfadan çıkabilirsiniz.` |
| Done | `12 ürün eklendi.` (+ ` 3 tanesini kontrol edin.` if any) |
| Not a menu | `Bu fotoğraflarda menü bulunamadı. Menünün tamamını, düz ve aydınlık bir yerde çekip tekrar deneyin.` |
| Failed | `Menü okunamadı. Fotoğraflar hakkınızdan düşülmedi. Tekrar deneyin.` |
| Over 5 photos | `Tek seferde en fazla 5 fotoğraf yükleyebilirsiniz.` |
| Monthly limit (422) | `Bu ayki 10 fotoğraf hakkınız doldu. Ürünleri elle ekleyebilirsiniz; hakkınız ayın 1'inde yenilenir.` |
| Remaining less than selected | `Bu ay 2 fotoğraf hakkınız kaldı. 2 fotoğraf seçin.` |
| Uncertain tag | `Kontrol et` |
| Uncertain summary | `3 ürünü kontrol edin` |
| Confirm uncertain | `Doğru` |
| Empty category | `Bu kategoride ürün yok.` + `Ürün ekle` |
| Missing price (placeholder) | `Fiyat` |
| Row actions | `Kaydet` · `Vazgeç` · `Sil` |
| Delete confirm | `Silinsin mi?` `Sil` / `Vazgeç` |
| Saved toast | `Kaydedildi` |

## 7. The one memorable thing

**The highlighter.** When the menu is read, the owner gets back their own menu as a ruled adisyon sheet, with the doubtful lines already marked in yellow highlighter, like a careful employee went over it with a fosforlu kalem. It is the product's core promise (the machine reads, you check only what's marked), it satisfies the spec's yellow requirement, and it's the one animated moment. It also appears as the specimen on the desktop login page, so the first screen shows the product instead of describing it.

### Kept quiet on purpose

- Colour: white paper, graphite text, one blue. Yellow and red appear only when they mean something.
- No cards, no shadows on the page, no gradients, no background textures, no paper grain, no fake carbon-copy pink.
- No illustrations, mascots, stock food photos or emoji. Food imagery belongs to the owner's own item photos.
- No ALL-CAPS labels, no eyebrows above headings, no numbered step markers (01/02/03), no trailing arrows on links.
- No hero marketing copy, feature lists or stats on the auth pages. Auth is a form, plus a single specimen on desktop.
- Wordmark is plain set type (Archivo condensed 800). No logo symbol yet; the name is "Menüle".
- One type family. No mono, no serif, no handwriting font for the pen metaphor: the pens are colours, not costumes.
- No motion apart from the read-complete reveal and direct responses to taps.
