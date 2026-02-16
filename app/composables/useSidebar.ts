export function useSidebar() {
  const mobileOpen = useState('sidebar-mobile-open', () => false)
  const toggle = () => { mobileOpen.value = !mobileOpen.value }
  const close = () => { mobileOpen.value = false }
  return { mobileOpen, toggle, close }
}
