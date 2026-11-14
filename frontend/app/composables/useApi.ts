type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface ApiOptions {
  method?: Method
  body?: Record<string, unknown> | FormData
}

function readCookie(name: string): string | null {
  const row = document.cookie.split('; ').find(c => c.startsWith(`${name}=`))
  return row ? decodeURIComponent(row.slice(name.length + 1)) : null
}

/**
 * Must be called in a Nuxt context (setup, middleware, start of a store action).
 */
export function useApi() {
  const { apiBase } = useRuntimeConfig().public

  // SSR: forward the browser's cookies, and send a Referer from the frontend
  // origin so Sanctum treats the request as stateful (session-authenticated).
  const serverHeaders: Record<string, string> = {}
  if (import.meta.server) {
    Object.assign(serverHeaders, useRequestHeaders(['cookie']))
    serverHeaders.referer = useRequestURL().origin + '/'
  }

  return async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
    const method = options.method ?? 'GET'
    const headers: Record<string, string> = { Accept: 'application/json', ...serverHeaders }

    if (method !== 'GET' && import.meta.client) {
      if (!readCookie('XSRF-TOKEN')) {
        await $fetch('/sanctum/csrf-cookie', { baseURL: apiBase, credentials: 'include' })
      }
      const token = readCookie('XSRF-TOKEN')
      if (token) headers['X-XSRF-TOKEN'] = token
    }

    return $fetch<T>(path, {
      baseURL: apiBase,
      method,
      body: options.body,
      headers,
      credentials: 'include',
    })
  }
}

export interface FormErrors {
  /** Form-level message, empty when there is none. */
  message: string
  /** First message per field. */
  fields: Record<string, string>
}

export function toFormErrors(error: unknown): FormErrors {
  const e = error as { statusCode?: number, data?: { message?: string, errors?: Record<string, string[]> } }

  if (e?.statusCode === 422 && e.data) {
    const fields: Record<string, string> = {}
    for (const [field, messages] of Object.entries(e.data.errors ?? {})) {
      if (messages[0]) fields[field] = messages[0]
    }
    return { message: Object.keys(fields).length ? '' : (e.data.message ?? ''), fields }
  }
  if (e?.statusCode === 419) {
    return { message: 'Oturum süresi doldu. Sayfayı yenileyip tekrar deneyin.', fields: {} }
  }
  if (e?.statusCode === 429) {
    return { message: 'Çok fazla deneme yaptınız. Biraz bekleyip tekrar deneyin.', fields: {} }
  }
  return { message: 'Bir sorun oluştu. Lütfen tekrar deneyin.', fields: {} }
}
