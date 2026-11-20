const STORAGE_KEY = 'hilko-sidebar-collapsed'

export function useSidebarCollapsed() {
  const collapsed = useState('sidebar-collapsed', () => false)

  onMounted(() => {
    collapsed.value = localStorage.getItem(STORAGE_KEY) === '1'
  })

  watch(collapsed, (value) => {
    localStorage.setItem(STORAGE_KEY, value ? '1' : '0')
  })

  function toggle() {
    collapsed.value = !collapsed.value
  }

  return { collapsed, toggle }
}