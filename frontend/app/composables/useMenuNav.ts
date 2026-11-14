import type { PublicCategory } from '~/types/menu'

/**
 * Category navigation inside a theme: stable anchor ids, the category currently on screen,
 * and a jump that scrolls to a category and moves focus to its heading.
 * `offset` is the height of the theme's sticky bar (the heading uses the same scroll-margin).
 * Previews pass `enabled: false`: they are inert and must not listen to the page's scroll.
 */
export function useMenuNav(
  categories: () => PublicCategory[],
  options: { offset?: number, enabled?: boolean, /** No active category until the first heading reaches the bar. */ untilPassed?: boolean } = {},
) {
  const prefix = useId()
  const anchor = (id: number) => `${prefix}-k${id}`
  const first = () => options.untilPassed ? null : categories()[0]?.id ?? null
  const active = ref<number | null>(first())

  let frame = 0
  function measure() {
    frame = 0
    const line = (options.offset ?? 0) + 24
    let current = first()
    for (const c of categories()) {
      const el = document.getElementById(anchor(c.id))
      if (el && el.getBoundingClientRect().top <= line) current = c.id
      else break
    }
    active.value = current
  }
  const onScroll = () => {
    if (!frame) frame = requestAnimationFrame(measure)
  }

  onMounted(() => {
    if (options.enabled === false) return
    window.addEventListener('scroll', onScroll, { passive: true })
    measure()
  })
  onBeforeUnmount(() => {
    window.removeEventListener('scroll', onScroll)
    cancelAnimationFrame(frame)
  })

  function go(id: number) {
    const heading = document.getElementById(anchor(id))
    if (!heading) return
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    heading.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    heading.focus({ preventScroll: true })
    active.value = id
  }

  return { anchor, active, go }
}
