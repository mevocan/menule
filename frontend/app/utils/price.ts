const whole = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 })
const cents = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** 120 -> "120", 87.5 -> "87,50", 1250 -> "1.250". Decimals only when non-zero. */
export function formatAmount(value: number): string {
  return Number.isInteger(value) ? whole.format(value) : cents.format(value)
}

/** 120 -> "120 ₺" with a no-break space (Archivo has no U+202F glyph; the fallback collapses it). */
export function formatPrice(value: number): string {
  return `${formatAmount(value)} ₺`
}

/**
 * Reads a price the way it is written in Turkey.
 * "87,50" -> 87.5, "1.250" -> 1250, "1.250,50" -> 1250.5, "12.5" -> 12.5, "" -> null.
 * Returns undefined when the text is not a price.
 */
export function parsePrice(raw: string): number | null | undefined {
  let text = raw.replace(/\s|₺|tl/gi, '')
  if (text === '') return null

  if (text.includes(',')) {
    text = text.replace(/\./g, '').replace(',', '.')
  }
  else if (/^\d{1,3}(\.\d{3})+$/.test(text)) {
    text = text.replace(/\./g, '')
  }

  if (!/^\d+(\.\d{1,2})?$/.test(text)) return undefined
  const value = Number(text)
  return value < 100_000_000 ? value : undefined
}

export const PRICE_ERROR = 'Fiyatı sayı olarak yazın. Örnek: 120 veya 87,50'
