/**
 * Shrinks a photo in the browser before upload: long edge at most `maxEdge`, re-encoded as JPEG,
 * or as PNG when transparency must survive (logos).
 * Throws when the browser cannot decode the file.
 */
export async function resizeImage(
  file: Blob,
  maxEdge = 1200,
  quality = 0.85,
  type: 'image/jpeg' | 'image/png' = 'image/jpeg',
): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas unavailable')
  if (type === 'image/jpeg') {
    // JPEG has no transparency: put transparent PNGs on white, not black.
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, width, height)
  }
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('encode failed'))), type, quality)
  })
}
