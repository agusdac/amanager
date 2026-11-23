export function useBodyScrollLock(lockId: string) {
  const locks = useState<Record<string, boolean>>('body-scroll-locks', () => ({}))

  function sync() {
    if (!import.meta.client) return
    const active = Object.values(locks.value).some(Boolean)
    document.body.style.overflow = active ? 'hidden' : ''
  }

  function setLocked(locked: boolean) {
    if (locked) locks.value = { ...locks.value, [lockId]: true }
    else {
      const next = { ...locks.value }
      delete next[lockId]
      locks.value = next
    }
    sync()
  }

  onUnmounted(() => setLocked(false))

  return { setLocked, sync }
}

export function clearBodyScrollLocks() {
  const locks = useState<Record<string, boolean>>('body-scroll-locks', () => ({}))
  locks.value = {}
  if (import.meta.client) document.body.style.overflow = ''
}