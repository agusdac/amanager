export default defineEventHandler(() => {
  const config = useRuntimeConfig()
  return {
    allowPublicRegister: config.allowPublicRegister !== false,
  }
})