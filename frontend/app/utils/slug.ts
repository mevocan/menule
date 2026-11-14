/**
 * Display only: previews the address the backend will derive from a restaurant name
 * (Restaurant::uniqueSlug). The backend stays the source of truth; a taken slug gets a "-2" suffix there.
 */
export function slugPreview(name: string): string {
  return name.replace(/İ/g, 'i').replace(/I/g, 'ı').toLocaleLowerCase('tr')
    .replace(/[çğıöşü]/g, c => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' })[c] ?? c)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/_+/g, '-')
    .replace(/@/g, '-at-')
    .replace(/[^-\p{L}\p{N}\s]+/gu, '')
    .replace(/[-\s]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
