import { ref, onMounted, onBeforeUnmount, watch, type Ref } from 'vue'
import type { AlphaTabApi } from '@coderline/alphatab'

export function useAlphaTab(containerRef: Ref<HTMLElement | null>) {
  const api = ref<AlphaTabApi | null>(null)
  const isLoaded = ref(false)
  const isPlaying = ref(false)
  const currentTick = ref(0)

  let playerStateListener: ((e: unknown) => void) | null = null
  let tickListener: ((e: unknown) => void) | null = null
  let ColorClass: unknown = null

  function applyThemeColors(settings: unknown, isDark: boolean) {
    if (!ColorClass) return
    const s = settings as { display?: { resources?: Record<string, unknown> } }
    if (!s.display?.resources) return
    
    const Color = ColorClass as new (r: number, g: number, b: number) => unknown
    if (isDark) {
      s.display.resources.staffLineColor = new Color(76, 86, 106) // #4C566A nord3
      s.display.resources.barSeparatorColor = new Color(76, 86, 106) // #4C566A nord3
      s.display.resources.barNumberColor = new Color(191, 97, 106) // #BF616A nord11 (red)
      s.display.resources.mainGlyphColor = new Color(236, 239, 244) // #ECEFF4 nord6
      s.display.resources.secondaryGlyphColor = new Color(216, 222, 233) // #D8DEE9 nord4
      s.display.resources.scoreInfoColor = new Color(216, 222, 233) // #D8DEE9 nord4
    } else {
      s.display.resources.staffLineColor = new Color(76, 86, 106) // #4C566A nord3
      s.display.resources.barSeparatorColor = new Color(59, 66, 82) // #3B4252 nord1
      s.display.resources.barNumberColor = new Color(191, 97, 106) // #BF616A nord11 (red)
      s.display.resources.mainGlyphColor = new Color(46, 52, 64) // #2E3440 nord0
      s.display.resources.secondaryGlyphColor = new Color(59, 66, 82) // #3B4252 nord1
      s.display.resources.scoreInfoColor = new Color(59, 66, 82) // #3B4252 nord1
    }
  }

  onMounted(async () => {
    if (!containerRef.value) return

    const alphaTab = await import('@coderline/alphatab')
    ColorClass = alphaTab.model.Color

    const settingsStore = useSettingsStore()
    const isDark = settingsStore.theme !== 'light'

    const settings = new alphaTab.Settings()
    settings.core.engine = 'html5'
    settings.core.logLevel = alphaTab.LogLevel.None
    settings.core.fontDirectory = '/font/'
    settings.player.enablePlayer = true
    settings.player.enableCursor = true
    settings.player.enableUserInteraction = true
    settings.player.soundFont = '/soundfonts/sonivox.sf2'

    applyThemeColors(settings, isDark)

    api.value = new alphaTab.AlphaTabApi(containerRef.value, settings)

    // Update colors when theme changes
    watch(() => settingsStore.theme, (newTheme) => {
      if (!api.value) return
      applyThemeColors(api.value.settings, newTheme !== 'light')
      api.value.updateSettings()
      api.value.render()
    })

    api.value.renderFinished.on(() => {
      isLoaded.value = true
    })

    playerStateListener = (e: unknown) => {
      const event = e as { state?: number }
      isPlaying.value = event.state === 1
    }
    api.value.playerStateChanged.on(playerStateListener)

    tickListener = (e: unknown) => {
      const event = e as { currentTick?: number }
      currentTick.value = event.currentTick ?? 0
    }
    api.value.playerPositionChanged.on(tickListener)
  })

  onBeforeUnmount(() => {
    if (api.value) {
      api.value.destroy()
      api.value = null
    }
  })

  const loadAlphaTex = (tex: string) => {
    if (!api.value) return
    api.value.tex(tex)
  }

  const loadFile = (data: string | ArrayBuffer) => {
    if (!api.value) return
    api.value.load(data)
  }

  const play = () => {
    if (!api.value) return
    api.value.playPause()
  }

  const stop = () => {
    if (!api.value) return
    api.value.stop()
    isPlaying.value = false
  }

  const setTempo = (tempo: number) => {
    if (!api.value) return
    api.value.playbackSpeed = tempo / 100
  }

  return { api, isLoaded, isPlaying, currentTick, loadAlphaTex, loadFile, play, stop, setTempo }
}
