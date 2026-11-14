# Menüle: diner themes

Scope: the three public menu themes (`components/themes/`), rendered on `/qr/[slug]` and as previews on `/panel/tasarim`. They do **not** use the owner app's tokens (`plan.md`); each theme carries its own scoped tokens and loads only its own font.

## 1. Brief

- **Subject:** the menu a diner opens by scanning the QR on the table. Phone in one hand, often in a loud, dim or sunny room.
- **Audience:** diners at very different places: a kebapçı, a third-wave café, a meyhane, a fine-dining room, a pastane. The owner chooses which of the three fits their place.
- **Primary job:** find a dish and its price quickly. Jump to a category, scan names, read a description if there is one.
- **Hard content facts:** long Turkish names ("Fıstıklı Kuzu Şiş Kebabı Közlenmiş Domates ve Biber ile 1.5 Porsiyon"), prices missing, descriptions missing, most items without photo, 1 category or 15, a logo or none. Logos can be transparent PNGs, dark or light.

Shared rules (all three):
- Real `h1` with the restaurant name in type, always (a logo alone, e.g. a monogram, does not tell the diner the name). With a logo, the logo `img` (`alt=""`) sits above the name and the name is set one step smaller, `h2` per category, item names in list items.
- Missing price: nothing is drawn. Missing description: nothing. Prices from `formatAmount`/`formatPrice`, `tabular-nums lining-nums`.
- Category navigation only when there are 2+ categories. Each theme designs its own.
- Scoped styles, own tokens, own Google Font (`latin-ext` verified for each). `html` background set from the page so overscroll matches.
- One theme = one structure. Not three colour swaps.

## 2. First pass (rejected, kept for the record)

| Key | First idea | Why it was a default |
|---|---|---|
| klasik | Cream paper `#F5F0E6`, Playfair Display, terracotta prices, dotted leaders | Calibration tell #1 almost exactly. It's what "restaurant menu" produces for any prompt. |
| modern | Near-black ground, white grotesk, one acid-yellow accent for prices | Tell #2. Also reads "burger chain", not a Turkish place. |
| sade | White, hairline rules between every item, two dense columns on desktop, small mono prices | Tell #3 (broadsheet) plus tell #5 (mono labels). |

## 3. Review and revision

I re-ran the brief as "a QR menu theme for a Turkish restaurant" and looked for what's specific to the subject instead of the category:

- **klasik → "Çini".** The thing every Turkish eatery already has on its walls is glazed tile, cobalt on white. Kept the dotted leader (it's the oldest real menu structure: it connects a name to its price), dropped the cream and the terracotta. The ground is glaze white, the ink is cobalt, the type is a calligraphic humanist serif (Alegreya), not a high-contrast display serif.
- **modern → "Pano".** Instead of a dark burger look: the shop's price board. A saturated pistachio ground (Antep fıstığı: baklava, kebap, and a café's matcha all sit fine on it), a condensed signage grotesk (Big Shoulders, made from city signage), and the menu opens with its table of contents in huge type, like the board above a counter.
- **sade → "Akşam".** Instead of the broadsheet: the fine-dining card. Everything centred, one quiet geometric face (Jost), dark petrol ground for dim rooms, and item photos cropped into circles: plates seen from above. No rules between items; space does the separating.

Second check on each revision:
- Çini: "white + blue" could be generic. What keeps it specific: the tile band is a drawn İznik-style motif, not a gradient; turquoise and İznik red only live inside the tile; the leader dots are structure.
- Pano: "colour-block poster" is a 2020s trend. It's justified here by the board metaphor and by function: the giant contents list is the category navigation.
- Akşam: dark themes drift to "near-black + gold". The ground is a coloured petrol, there is no gold or bright accent, and the boldness is in the plates, not in colour.

## 4. Tokens

### 4.1 Çini (key `klasik`, default)

| Name | Hex | Role | Contrast |
|---|---|---|---|
| Sır | `#F8FAFD` | ground | |
| Mürekkep | `#1A2A52` | body text, item names, prices | 13.4:1 |
| Kobalt | `#2343A0` | restaurant name, `h2`, tile, active chip fill | 8.4:1 |
| Kurşun | `#4A5878` | descriptions | 6.8:1 |
| Turkuaz | `#0F7C7C` | tile only | |
| İznik kırmızısı | `#B8322A` | tile only (tiny dots) | |
| Nokta | `#8E9BBB` | leader dots (decorative, aria-hidden) | |

Type: **Alegreya** 400–800 + italic. Name 34/38 700. `h2` 26/30 700 kobalt. Item 18/24 500. Description 16/23 italic 400. Price 18 600, lining tabular figures (Alegreya defaults to oldstyle). Left aligned; header centred.

### 4.2 Pano (key `modern`)

| Name | Hex | Role | Contrast |
|---|---|---|---|
| Fıstık | `#CFE6A1` | ground | |
| Yaprak | `#13311C` | all text, sticky bar ground, `h2` band | 10.4:1 |
| Kabuk | `#3E5C35` | descriptions, counts | 5.6:1 |
| Fıstık on Yaprak | `#CFE6A1` | text on the bar and bands | 10.4:1 |

Type: **Big Shoulders** (variable, `opsz` 10–72, `wght` 400–900): one family, its optical sizes do display and text. Name 60/54 900. Contents lines 40/42 800. `h2` 44/44 900. Item 23/26 700. Description 17/23 450. Price 26 800 tabular. Left aligned, prices right.

### 4.3 Akşam (key `sade`)

| Name | Hex | Role | Contrast |
|---|---|---|---|
| Gece | `#0F2B31` | ground | |
| Derin | `#163A41` | category sheet (overlay) | |
| Ay | `#EEF2EC` | text, plate rims, pill | 13.2:1 |
| Sis | `#A7BFBA` | descriptions, prices | 7.7:1 |
| Çizgi | `#2C5058` | the one short rule under each `h2` (decorative) | |

Type: **Jost** 300–600 + italic. Name 34/40 300. `h2` 24/30 italic 400. Item 18/26 500. Description 16/24 italic 300. Price 17 400 tabular. Everything centred, `text-wrap: balance`.

## 5. Layout sketches (390px)

### Çini
```
┌──────────────────────────────┐
│◆◇◆◇◆◇◆◇ tile band 28px ◆◇◆◇◆│  the one bold thing
│          [logo 80]           │
│        Kebapçı Mehmet        │  h1 centred
├──────────────────────────────┤  sticky chip strip, h-scroll
│ [Çorbalar] Kebaplar Tatlılar │  active = kobalt fill
├──────────────────────────────┤
│ Çorbalar                     │  h2 kobalt
│ Mercimek Çorbası ······ 120 ₺│  leaders join name to price
│ Limon ve kıtır ekmekle       │  italic
│ İşkembe Çorbası              │  no price: no leaders
│ ┌──┐ Adana Dürüm ······ 260 ₺│  photo 64px, 4px radius (tile)
│ └──┘ Lavaş, közlenmiş biber  │
│◆◇◆◇◆◇ tile band closes ◆◇◆◇◆│
└──────────────────────────────┘
```
Desktop: one column, max 640px, centred on the glaze; the band runs full width.

### Pano
```
┌──────────────────────────────┐
│ [logo]                       │
│ Kebapçı                      │  h1, huge, wraps
│ Mehmet                       │
│──────────────────────────────│
│ Çorbalar                   4 │  contents: 40px lines, item count
│ Kebaplar                  12 │  (the one bold thing)
│ Tatlılar                   3 │
├──────────────────────────────┤  sticky bar (yaprak): current
│ Kebaplar          Kategoriler│  category + back to contents
├──────────────────────────────┤
│▓ Kebaplar ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  h2 band, yaprak ground
│ Adana Dürüm              260 │  big price
│ Lavaş, közlenmiş biber       │
│ ┌──────────────────────────┐ │  photo full width 4:3
│ └──────────────────────────┘ │
└──────────────────────────────┘
```
Desktop: max 720px column, left aligned on a full-bleed ground; contents list in two columns from 900px.

### Akşam
```
┌──────────────────────────────┐
│           (logo)             │  logo on a light disc (plate)
│        Kebapçı Mehmet        │  light 300
│                              │
│           Çorbalar           │  italic h2
│             ──               │
│            (◯)               │  photo as a 112px plate
│       Mercimek Çorbası       │
│    Limon ve kıtır ekmekle    │
│             120              │
│                              │
│                              │
│        ( Kategoriler )       │  floating pill, opens a centred
└──────────────────────────────┘  list sheet (the nav)
```
Desktop: centred 560px column.

## 6. Principles

- **Çini:** the tile is the only ornament; everything else is a well-set list. Bold thing: the drawn tile band top and bottom.
- **Pano:** the type does the shouting. No ornament, no rules except the bands that carry information (category, current place). Bold thing: the opening contents list in huge type.
- **Akşam:** centred, quiet, dim-room friendly. Bold thing: photos as round plates (and the logo on a plate).
- Motion: none on load. Smooth scroll on category jumps (instant with reduced motion). Akşam's sheet opens with a 150ms fade.
- Focus: each theme has its own visible focus ring in its own ink.

## 7. Notes for later passes

- Remove-one-accessory check after screenshots: candidates are the closing tile band (Çini), the item counts (Pano), the short rule under `h2` (Akşam).
