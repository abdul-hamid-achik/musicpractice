type InstrumentType = 'guitar' | 'bass' | 'piano' | 'violin'

let toneModule: typeof import('tone') | null = null
let audioStarted = false
const synths = new Map<InstrumentType, unknown>()

async function getTone() {
  if (!toneModule) {
    toneModule = await import('tone')
  }
  return toneModule
}

async function ensureAudioStarted() {
  if (audioStarted) return
  const Tone = await getTone()
  await Tone.start()
  audioStarted = true
}

async function getSynth(instrument: InstrumentType) {
  if (synths.has(instrument)) return synths.get(instrument)

  const Tone = await getTone()
  let synth: unknown

  switch (instrument) {
    case 'guitar':
      synth = new Tone.PluckSynth({
        attackNoise: 1,
        dampening: 4000,
        resonance: 0.95,
      }).toDestination()
      break
    case 'bass':
      synth = new Tone.MonoSynth({
        oscillator: { type: 'fmsawtooth' },
        envelope: { attack: 0.02, decay: 0.3, sustain: 0.4, release: 1.0 },
        filterEnvelope: {
          attack: 0.01,
          decay: 0.2,
          sustain: 0.3,
          release: 0.8,
          baseFrequency: 100,
          octaves: 2.5,
        },
      }).toDestination()
      break
    case 'piano':
      synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.01, decay: 0.3, sustain: 0.3, release: 1.2 },
      }).toDestination()
      break
    case 'violin':
      synth = new Tone.FMSynth({
        harmonicity: 3.01,
        modulationIndex: 10,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.2, decay: 0.1, sustain: 0.8, release: 0.5 },
        modulation: { type: 'square' },
        modulationEnvelope: { attack: 0.3, decay: 0.01, sustain: 1, release: 0.5 },
      }).toDestination()
      break
  }

  synths.set(instrument, synth)
  return synth
}

export function useInstrumentSound() {
  const settings = useSettingsStore()

  async function playNote(note: string, octave: number, instrument: InstrumentType, duration = '8n') {
    if (!import.meta.client) return

    await ensureAudioStarted()
    const Tone = await getTone()
    const synth = await getSynth(instrument)

    // Volume: settings.volume is 0–100, map to dB (–40 to 0)
    const vol = settings.volume / 100
    const db = vol > 0 ? -40 + vol * 40 : -Infinity

    if (instrument === 'guitar') {
      const pluckSynth = synth as import('tone').PluckSynth
      pluckSynth.volume.value = db
      // PluckSynth uses triggerAttack only
      pluckSynth.triggerAttack(`${note}${octave}`, Tone.now())
    } else if (instrument === 'piano') {
      const polySynth = synth as import('tone').PolySynth
      polySynth.volume.value = db
      polySynth.triggerAttackRelease(`${note}${octave}`, duration, Tone.now())
    } else {
      const monoSynth = synth as import('tone').MonoSynth | import('tone').FMSynth
      monoSynth.volume.value = db
      ;(monoSynth as import('tone').MonoSynth).triggerAttackRelease?.(`${note}${octave}`, duration, Tone.now())
    }
  }

  return { playNote }
}
