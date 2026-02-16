import { type Ref } from 'vue'

export function useVexFlow(containerRef: Ref<HTMLElement | null>) {
  const renderNotation = async (
    notes: string[],
    clef: string = 'treble',
    timeSignature: string = '4/4',
  ) => {
    if (!containerRef.value) return

    const VF = await import('vexflow')
    const { Renderer, Stave, StaveNote, Voice, Formatter } = VF.default || VF

    containerRef.value.innerHTML = ''

    const renderer = new Renderer(containerRef.value, Renderer.Backends.SVG)
    renderer.resize(600, 200)
    const context = renderer.getContext()

    context.setFillStyle('#ECEFF4')
    context.setStrokeStyle('#D8DEE9')

    const stave = new Stave(10, 40, 560)
    stave.addClef(clef)
    stave.addTimeSignature(timeSignature)
    stave.setContext(context).draw()

    if (notes.length === 0) return

    const staveNotes = notes.map(
      (note) =>
        new StaveNote({
          keys: [note],
          duration: 'q',
        }),
    )

    const voice = new Voice({ num_beats: notes.length, beat_value: 4 })
    voice.addTickables(staveNotes)

    new Formatter().joinVoices([voice]).format([voice], 500)
    voice.draw(context, stave)
  }

  return { renderNotation }
}
