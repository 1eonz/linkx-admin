import { onBeforeUnmount, onMounted, watch, type Ref } from 'vue'

interface ThemeSession {
  dark: boolean
  hud: boolean
  instances: Map<symbol, boolean>
}

const sessions = new WeakMap<Document, ThemeSession>()

/** 多个 Demo 共用页面主题；最后一个实例退出时才恢复进入前的主题。 */
export function useDemoHudTheme(enabled: Ref<boolean>) {
  const key = Symbol('demo-hud-theme')
  let owner: Document | undefined
  let session: ThemeSession | undefined

  function apply() {
    if (!owner || !session) return
    const active = [...session.instances.values()].some(Boolean)
    owner.documentElement.classList.toggle('dark', session.dark || active)
    owner.documentElement.classList.toggle(
      'lx-theme-hud',
      session.hud || active,
    )
  }

  watch(enabled, (value) => {
    if (!session) return
    session.instances.set(key, value)
    apply()
  })

  onMounted(() => {
    owner = document
    session = sessions.get(owner)
    if (!session) {
      session = {
        dark: owner.documentElement.classList.contains('dark'),
        hud: owner.documentElement.classList.contains('lx-theme-hud'),
        instances: new Map(),
      }
      sessions.set(owner, session)
    }
    session.instances.set(key, enabled.value)
    apply()
  })

  onBeforeUnmount(() => {
    if (!owner || !session) return
    session.instances.delete(key)
    apply()
    if (session.instances.size === 0) sessions.delete(owner)
    owner = undefined
    session = undefined
  })
}
