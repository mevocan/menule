/**
 * The public site origin that menu addresses and QR codes use: `NUXT_PUBLIC_SITE_URL` when set,
 * otherwise the address the panel is open on.
 */
export function useSiteOrigin(): string {
  const { siteUrl } = useRuntimeConfig().public
  return (String(siteUrl || '') || useRequestURL().origin).replace(/\/+$/, '')
}
