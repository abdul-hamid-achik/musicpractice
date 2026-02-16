import { ref, onMounted, onBeforeUnmount, watch, type Ref } from 'vue'

export function useAlphaTab(containerRef: Ref<HTMLElement | null>) {
  const api = ref<any>(null)
  const isLoaded = ref(false)
  const isPlaying = ref(false)
  const currentTick = ref(0)

  let playerStateListener: ((e: any) => void) | null = null
  let tickListener: ((e: any) => void) | null = null
  let ColorClass: any = null

  function applyThemeColors(settings: any, isDark: boolean) {
    if (!ColorClass) return
    if (isDark) {
      settings.display.resources.staffLineColor = new ColorClass(76, 86, 106) // #4C566A nord3
      settings.display.resources.barSeparatorColor = new ColorClass(76, 86, 106) // #4C566A nord3
      settings.display.resources.barNumberColor = new ColorClass(191, 97, 106) // #BF616A nord11 (red)
      settings.display.resources.mainGlyphColor = new ColorClass(236, 239, 244) // #ECEFF4 nord6
      settings.display.resources.secondaryGlyphColor = new ColorClass(216, 222, 233) // #D8DEE9 nord4
      settings.display.resources.scoreInfoColor = new ColorClass(216, 222, 233) // #D8DEE9 nord4
    } else {
      settings.display.resources.staffLineColor = new ColorClass(76, 86, 106) // #4C566A nord3
      settings.display.resources.barSeparatorColor = new ColorClass(59, 66, 82) // #3B4252 nord1
      settings.display.resources.barNumberColor = new ColorClass(191, 97, 106) // #BF616A nord11 (red)
      settings.display.resources.mainGlyphColor = new ColorClass(46, 52, 64) // #2E3440 nord0
      settings.display.resources.secondaryGlyphColor = new ColorClass(59, 66, 82) // #3B4252 nord1
      settings.display.resources.scoreInfoColor = new ColorClass(59, 66, 82) // #3B4252 nord1
    }
  }

  onMounted(async () => {
    if (!containerRef.value) return

    const alphaTab = await import('@coderline/alphatab')
    ColorClass = (alphaTab as any).model.Color

    const settingsStore = useSettingsStore()
    const isDark = settingsStore.theme !== 'light'

    const settings = new alphaTab.Settings()
    settings.core.engine = 'html5'
    settings.core.logLevel = alphaTab.LogLevel.None
    settings.core.fontDirectory = '/font/'
    settings.core.scriptFile = '/alphatab/alphaTab.worker.mjs'
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

    playerStateListener = (e: any) => {
      isPlaying.value = e.state === 1
    }
    api.value.playerStateChanged.on(playerStateListener)

    tickListener = (e: any) => {
      currentTick.value = e.currentTick
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

  const loadFile = (url: string) => {
    if (!api.value) return
    api.value.load(url)
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
