export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('error', (error, { event }) => {
    if (process.env.NODE_ENV === 'production') return
    const path = event?.path ?? 'unknown'
    const code = (error as { statusCode?: number }).statusCode
    if (code && code < 500) return
    console.error(`[nitro error] ${path}`, error)
  })
})