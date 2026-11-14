import type { Options } from 'qr-code-styling'

export type QrStyleKey = 'siyah' | 'cini' | 'pano' | 'aksam'

export interface QrStyle {
  key: QrStyleKey
  name: string
  description: string
  /** Modules and the centres of the finder patterns. */
  dots: string
  /** The finder patterns' outer rings. */
  corners: string
  /** Always light: phones read dark-on-light most reliably, and print shops expect it. */
  background: string
  dotType: NonNullable<Options['dotsOptions']>['type']
  cornerSquareType: NonNullable<Options['cornersSquareOptions']>['type']
  cornerDotType: NonNullable<Options['cornersDotOptions']>['type']
}

/**
 * Four print styles. Every pair is dark on light with luminance contrast of at least 8:1
 * (siyah 21, çini 14.0 dots / 8.8 corners, pano 10.4, akşam 13.2), so they read on matte paper, glossy tents and windows.
 * Three echo the menu themes; one is plain black for any printer.
 */
export const QR_STYLES: QrStyle[] = [
  {
    key: 'siyah',
    name: 'Siyah',
    description: 'Kare noktalar, beyaz zemin. Her yazıcıda net çıkar.',
    dots: '#000000',
    corners: '#000000',
    background: '#FFFFFF',
    dotType: 'square',
    cornerSquareType: 'square',
    cornerDotType: 'square',
  },
  {
    key: 'cini',
    name: 'Çini',
    description: 'Lacivert yuvarlak noktalar, kobalt köşeler.',
    dots: '#1A2A52',
    corners: '#2343A0',
    background: '#FFFFFF',
    dotType: 'rounded',
    cornerSquareType: 'extra-rounded',
    cornerDotType: 'dot',
  },
  {
    key: 'pano',
    name: 'Pano',
    description: 'Fıstık yeşili zemin, koyu yeşil kare noktalar.',
    dots: '#13311C',
    corners: '#13311C',
    background: '#CFE6A1',
    dotType: 'square',
    cornerSquareType: 'extra-rounded',
    cornerDotType: 'square',
  },
  {
    key: 'aksam',
    name: 'Akşam',
    description: 'Açık zemin üstünde koyu petrol rengi yuvarlak noktalar.',
    dots: '#0F2B31',
    corners: '#0F2B31',
    background: '#EEF2EC',
    dotType: 'dots',
    cornerSquareType: 'dot',
    cornerDotType: 'dot',
  },
]

export function qrStyle(key: string | null | undefined): QrStyle {
  return QR_STYLES.find(s => s.key === key) ?? QR_STYLES[0]!
}

/**
 * Options for qr-code-styling at a given pixel size.
 * The margin keeps a quiet zone of about four modules for the URL lengths we encode (QR versions 3 to 6).
 * With a logo: error correction H, the logo at most 30% wide, and no dots behind it.
 */
export function qrOptions(data: string, style: QrStyle, size: number, logo: string | null, type: 'svg' | 'canvas'): Partial<Options> {
  return {
    type,
    width: size,
    height: size,
    margin: Math.round(size * 0.11),
    data,
    image: logo ?? undefined,
    qrOptions: { errorCorrectionLevel: logo ? 'H' : 'Q' },
    imageOptions: { imageSize: 0.3, hideBackgroundDots: true, margin: Math.round(size * 0.008) },
    dotsOptions: { type: style.dotType, color: style.dots },
    cornersSquareOptions: { type: style.cornerSquareType, color: style.corners },
    cornersDotOptions: { type: style.cornerDotType, color: style.dots },
    backgroundOptions: { color: style.background },
  }
}
