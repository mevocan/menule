interface Toast {
  id: number
  text: string
}

let timer: ReturnType<typeof setTimeout> | undefined

/** One short message at a time, closes after 4s. Uses the same verb as the action. */
export function useToast() {
  const toast = useState<Toast | null>('toast', () => null)

  function show(text: string) {
    toast.value = { id: Date.now(), text }
    clearTimeout(timer)
    timer = setTimeout(() => (toast.value = null), 4000)
  }

  function hide() {
    clearTimeout(timer)
    toast.value = null
  }

  return { toast, show, hide }
}
