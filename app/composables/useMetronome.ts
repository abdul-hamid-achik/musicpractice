import { ref, onBeforeUnmount } from 'vue'

export function useMetronome() {
  const bpm = ref(120)
  const isRunning = ref(false)
  const beatsPerMeasure = ref(4)
  const currentBeat = ref(0)

  let synth: any = null
  let accentSynth: any = null
  let loop: any = null

  const start = async () => {
    const Tone = await import('tone')
    await Tone.start()

    if (!synth) {
      synth = new Tone.MembraneSynth({
        pitchDecay: 0.008,
        octaves: 2,
        envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.05 },
      }).toDestination()
    }

    if (!accentSynth) {
      accentSynth = new Tone.MembraneSynth({
        pitchDecay: 0.008,
        octaves: 2,
        envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.05 },
      }).toDestination()
    }

    Tone.getTransport().bpm.value = bpm.value

    loop = new Tone.Loop((time: number) => {
      const beat = currentBeat.value
      if (beat === 0) {
        accentSynth.triggerAttackRelease('C2', '8n', time)
      } else {
        synth.triggerAttackRelease('C3', '8n', time)
      }
      currentBeat.value = (beat + 1) % beatsPerMeasure.value
    }, '4n')

    loop.start(0)
    Tone.getTransport().start()
    isRunning.value = true
  }

  const stop = async () => {
    const Tone = await import('tone')
    Tone.getTransport().stop()
    if (loop) {
      loop.stop()
      loop.dispose()
      loop = null
    }
    currentBeat.value = 0
    isRunning.value = false
  }

  const setBpm = async (newBpm: number) => {
    bpm.value = newBpm
    const Tone = await import('tone')
    Tone.getTransport().bpm.value = newBpm
  }

  onBeforeUnmount(async () => {
    if (isRunning.value) {
      await stop()
    }
    if (synth) {
      synth.dispose()
      synth = null
    }
    if (accentSynth) {
      accentSynth.dispose()
      accentSynth = null
    }
  })

  return { bpm, isRunning, beatsPerMeasure, currentBeat, start, stop, setBpm }
}
