import { ref, onMounted, onBeforeUnmount, type Ref } from 'vue'

export function useAlphaTab(containerRef: Ref<HTMLElement | null>) {
  const api = ref<any>(null)
  const isLoaded = ref(false)
  const isPlaying = ref(false)
  const currentTick = ref(0)

  let playerStateListener: ((e: any) => void) | null = null
  let tickListener: ((e: any) => void) | null = null

  onMounted(async () => {
    if (!containerRef.value) return

    const alphaTab = await import('@coderline/alphatab')

    const settings = new alphaTab.Settings()
    settings.core.engine = 'html5'
    settings.core.logLevel = alphaTab.LogLevel.None
    settings.player.enablePlayer = true
    settings.player.enableCursor = true
    settings.player.enableUserInteraction = true
    settings.display.resources.staffLineColor = '#4C566A' as any
    settings.display.resources.barSeparatorColor = '#4C566A' as any
    settings.display.resources.mainGlyphColor = '#ECEFF4' as any
    settings.display.resources.secondaryGlyphColor = '#D8DEE9' as any

    api.value = new alphaTab.AlphaTabApi(containerRef.value, settings)

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
