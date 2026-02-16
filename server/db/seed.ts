import { db } from './index'
import { instruments, scales, chords, songs, metronomePresets, users } from './schema'

async function seed() {
  console.log('Seeding database...')

  // Seed a demo user for metronome presets
  const [demoUser] = await db.insert(users).values({
    email: 'demo@musicpractice.app',
    name: 'Demo User',
  }).returning()

  // Seed instruments
  const [guitar, bass, piano, violin] = await db.insert(instruments).values([
    {
      name: 'Standard Guitar',
      type: 'guitar',
      tuning: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
      stringCount: 6,
      fretCount: 24,
      isDefault: true,
    },
    {
      name: '4-String Bass',
      type: 'bass',
      tuning: ['E1', 'A1', 'D2', 'G2'],
      stringCount: 4,
      fretCount: 24,
      isDefault: true,
    },
    {
      name: 'Piano 88-Key',
      type: 'piano',
      tuning: null,
      stringCount: 88,
      fretCount: null,
      isDefault: true,
    },
    {
      name: 'Violin',
      type: 'violin',
      tuning: ['G3', 'D4', 'A4', 'E5'],
      stringCount: 4,
      fretCount: null,
      isDefault: true,
    },
  ]).returning()

  console.log('Instruments seeded:', [guitar, bass, piano, violin].map(i => i.name))

  // Seed scales
  await db.insert(scales).values([
    { name: 'Major (Ionian)', intervals: [0, 2, 4, 5, 7, 9, 11], category: 'diatonic', description: 'The major scale, foundation of Western music' },
    { name: 'Natural Minor (Aeolian)', intervals: [0, 2, 3, 5, 7, 8, 10], category: 'diatonic', description: 'The natural minor scale' },
    { name: 'Harmonic Minor', intervals: [0, 2, 3, 5, 7, 8, 11], category: 'minor', description: 'Minor scale with raised 7th degree' },
    { name: 'Melodic Minor', intervals: [0, 2, 3, 5, 7, 9, 11], category: 'minor', description: 'Minor scale with raised 6th and 7th degrees (ascending)' },
    { name: 'Pentatonic Major', intervals: [0, 2, 4, 7, 9], category: 'pentatonic', description: 'Five-note major scale, widely used in rock and blues' },
    { name: 'Pentatonic Minor', intervals: [0, 3, 5, 7, 10], category: 'pentatonic', description: 'Five-note minor scale, essential for blues and rock soloing' },
    { name: 'Blues', intervals: [0, 3, 5, 6, 7, 10], category: 'blues', description: 'Minor pentatonic with added flat 5th (blue note)' },
    { name: 'Dorian', intervals: [0, 2, 3, 5, 7, 9, 10], category: 'diatonic', description: 'Second mode of the major scale, minor with raised 6th' },
    { name: 'Phrygian', intervals: [0, 1, 3, 5, 7, 8, 10], category: 'diatonic', description: 'Third mode, minor with flat 2nd, Spanish flavor' },
    { name: 'Lydian', intervals: [0, 2, 4, 6, 7, 9, 11], category: 'diatonic', description: 'Fourth mode, major with raised 4th' },
    { name: 'Mixolydian', intervals: [0, 2, 4, 5, 7, 9, 10], category: 'diatonic', description: 'Fifth mode, major with flat 7th, dominant sound' },
    { name: 'Aeolian', intervals: [0, 2, 3, 5, 7, 8, 10], category: 'diatonic', description: 'Sixth mode, identical to natural minor' },
    { name: 'Locrian', intervals: [0, 1, 3, 5, 6, 8, 10], category: 'diatonic', description: 'Seventh mode, diminished sound with flat 2nd and flat 5th' },
    { name: 'Whole Tone', intervals: [0, 2, 4, 6, 8, 10], category: 'symmetric', description: 'Symmetrical scale with only whole steps' },
    { name: 'Diminished Half-Whole', intervals: [0, 1, 3, 4, 6, 7, 9, 10], category: 'symmetric', description: 'Alternating half and whole steps, starting with half' },
    { name: 'Diminished Whole-Half', intervals: [0, 2, 3, 5, 6, 8, 9, 11], category: 'symmetric', description: 'Alternating whole and half steps, starting with whole' },
    { name: 'Chromatic', intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], category: 'chromatic', description: 'All twelve semitones' },
    { name: 'Hungarian Minor', intervals: [0, 2, 3, 6, 7, 8, 11], category: 'exotic', description: 'Harmonic minor with raised 4th, Eastern European sound' },
    { name: 'Double Harmonic', intervals: [0, 1, 4, 5, 7, 8, 11], category: 'exotic', description: 'Also called Byzantine scale, Middle Eastern flavor' },
    { name: 'Phrygian Dominant', intervals: [0, 1, 4, 5, 7, 8, 10], category: 'exotic', description: 'Fifth mode of harmonic minor, flamenco sound' },
    { name: 'Lydian Dominant', intervals: [0, 2, 4, 6, 7, 9, 10], category: 'jazz', description: 'Lydian with flat 7th, used over dominant 7th chords' },
    { name: 'Altered', intervals: [0, 1, 3, 4, 6, 8, 10], category: 'jazz', description: 'Seventh mode of melodic minor, used over altered dominant chords' },
    { name: 'Super Locrian', intervals: [0, 1, 3, 4, 6, 8, 10], category: 'jazz', description: 'Also known as altered scale, all tensions altered' },
    { name: 'Bebop Dominant', intervals: [0, 2, 4, 5, 7, 9, 10, 11], category: 'jazz', description: 'Mixolydian with added major 7th for chromatic passing' },
    { name: 'Bebop Major', intervals: [0, 2, 4, 5, 7, 8, 9, 11], category: 'jazz', description: 'Major scale with added flat 6th' },
    { name: 'Bebop Dorian', intervals: [0, 2, 3, 4, 5, 7, 9, 10], category: 'jazz', description: 'Dorian with added major 3rd' },
    { name: 'Hirajoshi', intervals: [0, 4, 6, 7, 11], category: 'exotic', description: 'Japanese five-note scale' },
    { name: 'In Sen', intervals: [0, 1, 5, 7, 10], category: 'exotic', description: 'Japanese scale used in shakuhachi music' },
    { name: 'Kumoi', intervals: [0, 2, 3, 7, 9], category: 'exotic', description: 'Japanese pentatonic scale' },
    { name: 'Neapolitan Minor', intervals: [0, 1, 3, 5, 7, 8, 11], category: 'exotic', description: 'Harmonic minor with flat 2nd' },
    { name: 'Neapolitan Major', intervals: [0, 1, 3, 5, 7, 9, 11], category: 'exotic', description: 'Major scale with flat 2nd' },
    { name: 'Major Blues', intervals: [0, 2, 3, 4, 7, 9], category: 'blues', description: 'Major pentatonic with added flat 3rd' },
    { name: 'Minor Blues', intervals: [0, 3, 5, 6, 7, 10], category: 'blues', description: 'Minor pentatonic with added flat 5th (same as Blues scale)' },
    { name: 'Prometheus', intervals: [0, 2, 4, 6, 9, 10], category: 'exotic', description: 'Whole tone scale variant by Scriabin' },
    { name: 'Tritone', intervals: [0, 1, 4, 6, 7, 10], category: 'exotic', description: 'Symmetric scale built on tritone intervals' },
    { name: 'Augmented', intervals: [0, 3, 4, 7, 8, 11], category: 'symmetric', description: 'Symmetrical scale alternating minor 3rd and half step' },
    { name: 'Enigmatic', intervals: [0, 1, 4, 6, 8, 10, 11], category: 'exotic', description: 'Mysterious scale by Verdi' },
  ])

  console.log('Scales seeded: 37 scales')

  // Seed chords
  await db.insert(chords).values([
    { name: 'Major', symbol: '', intervals: [0, 4, 7] },
    { name: 'Minor', symbol: 'm', intervals: [0, 3, 7] },
    { name: 'Dominant 7th', symbol: '7', intervals: [0, 4, 7, 10] },
    { name: 'Major 7th', symbol: 'maj7', intervals: [0, 4, 7, 11] },
    { name: 'Minor 7th', symbol: 'm7', intervals: [0, 3, 7, 10] },
    { name: 'Diminished', symbol: 'dim', intervals: [0, 3, 6] },
    { name: 'Augmented', symbol: 'aug', intervals: [0, 4, 8] },
    { name: 'Suspended 2nd', symbol: 'sus2', intervals: [0, 2, 7] },
    { name: 'Suspended 4th', symbol: 'sus4', intervals: [0, 5, 7] },
    { name: 'Add 9', symbol: 'add9', intervals: [0, 4, 7, 14] },
    { name: 'Minor 7 Flat 5', symbol: 'm7b5', intervals: [0, 3, 6, 10] },
    { name: 'Diminished 7th', symbol: 'dim7', intervals: [0, 3, 6, 9] },
    { name: 'Augmented 7th', symbol: 'aug7', intervals: [0, 4, 8, 10] },
    { name: 'Major 6th', symbol: '6', intervals: [0, 4, 7, 9] },
    { name: 'Minor 6th', symbol: 'm6', intervals: [0, 3, 7, 9] },
    { name: 'Dominant 9th', symbol: '9', intervals: [0, 4, 7, 10, 14] },
    { name: 'Minor 9th', symbol: 'm9', intervals: [0, 3, 7, 10, 14] },
    { name: 'Dominant 13th', symbol: '13', intervals: [0, 4, 7, 10, 14, 21] },
    { name: 'Power Chord', symbol: '5', intervals: [0, 7] },
    { name: 'Minor Major 7th', symbol: 'mMaj7', intervals: [0, 3, 7, 11] },
  ])

  console.log('Chords seeded: 20 chord types')

  // Seed songs — 5 per instrument type with real AlphaTex notation
  await db.insert(songs).values([
    // Guitar songs
    {
      title: 'Open String Exercise',
      artist: null,
      difficulty: 'beginner',
      instrumentType: 'guitar',
      format: 'alphatex',
      notationData: '\\title "Open String Exercise"\n\\tempo 80\n.\n0.6 0.5 0.4 0.3 0.2 0.1 | 0.1 0.2 0.3 0.4 0.5 0.6',
      metadata: { category: 'exercise', tags: ['open strings', 'warm-up'] },
    },
    {
      title: 'Chromatic Warm-Up',
      artist: null,
      difficulty: 'beginner',
      instrumentType: 'guitar',
      format: 'alphatex',
      notationData: '\\title "Chromatic Warm-Up"\n\\tempo 60\n.\n1.6 2.6 3.6 4.6 | 1.5 2.5 3.5 4.5 | 1.4 2.4 3.4 4.4 | 1.3 2.3 3.3 4.3',
      metadata: { category: 'exercise', tags: ['chromatic', 'finger independence'] },
    },
    {
      title: 'Am Pentatonic Lick',
      artist: null,
      difficulty: 'intermediate',
      instrumentType: 'guitar',
      format: 'alphatex',
      notationData: '\\title "Am Pentatonic Lick"\n\\tempo 100\n.\n5.6 8.6 5.5 7.5 | 5.4 7.4 5.3 7.3 | 5.2 8.2 5.1 8.1',
      metadata: { category: 'lick', tags: ['pentatonic', 'A minor'] },
    },
    {
      title: 'Basic Chord Progression',
      artist: null,
      difficulty: 'beginner',
      instrumentType: 'guitar',
      format: 'alphatex',
      notationData: '\\title "Basic Chord Progression"\n\\tempo 90\n.\n(0.1 0.2 1.3 2.4 2.5 0.6).4 | (0.1 1.2 0.3 2.4 3.5 --.6).4 | (1.1 0.2 0.3 2.4 3.5 --.6).4 | (0.1 0.2 1.3 2.4 2.5 0.6).4',
      metadata: { category: 'chord progression', tags: ['Em', 'Am', 'C', 'chords'] },
    },
    {
      title: 'Blues Shuffle in E',
      artist: null,
      difficulty: 'intermediate',
      instrumentType: 'guitar',
      format: 'alphatex',
      notationData: '\\title "Blues Shuffle in E"\n\\tempo 120\n.\n(0.6 2.5).8 (0.6 2.5).8 (0.6 4.5).8 (0.6 2.5).8 | (2.6 4.5).8 (2.6 4.5).8 (2.6 6.5).8 (2.6 4.5).8',
      metadata: { category: 'blues', tags: ['shuffle', 'E blues', 'rhythm'] },
    },
    // Bass songs
    {
      title: 'Root Note Exercise',
      artist: null,
      difficulty: 'beginner',
      instrumentType: 'bass',
      format: 'alphatex',
      notationData: '\\title "Root Note Exercise"\n\\tempo 80\n\\instrument 37\n.\n0.4.4 0.4.4 0.4.4 0.4.4 | 0.3.4 0.3.4 0.3.4 0.3.4 | 0.2.4 0.2.4 0.2.4 0.2.4 | 0.1.4 0.1.4 0.1.4 0.1.4',
      metadata: { category: 'exercise', tags: ['open strings', 'basics'] },
    },
    {
      title: 'Walking Bass in C',
      artist: null,
      difficulty: 'intermediate',
      instrumentType: 'bass',
      format: 'alphatex',
      notationData: '\\title "Walking Bass in C"\n\\tempo 100\n\\instrument 37\n.\n3.4.4 2.4.4 0.4.4 3.3.4 | 2.3.4 0.3.4 2.3.4 3.3.4 | 3.4.4 2.4.4 0.4.4 3.3.4',
      metadata: { category: 'walking bass', tags: ['jazz', 'C major'] },
    },
    {
      title: 'Finger Plucking Pattern',
      artist: null,
      difficulty: 'beginner',
      instrumentType: 'bass',
      format: 'alphatex',
      notationData: '\\title "Finger Plucking Pattern"\n\\tempo 70\n\\instrument 37\n.\n0.4.8 0.3.8 0.2.8 0.1.8 0.1.8 0.2.8 0.3.8 0.4.8',
      metadata: { category: 'exercise', tags: ['plucking', 'technique'] },
    },
    {
      title: 'Octave Jumps',
      artist: null,
      difficulty: 'intermediate',
      instrumentType: 'bass',
      format: 'alphatex',
      notationData: '\\title "Octave Jumps"\n\\tempo 90\n\\instrument 37\n.\n0.4.8 2.2.8 0.4.8 2.2.8 | 2.4.8 4.2.8 2.4.8 4.2.8 | 3.4.8 5.2.8 3.4.8 5.2.8',
      metadata: { category: 'exercise', tags: ['octaves', 'technique'] },
    },
    {
      title: 'Funk Groove',
      artist: null,
      difficulty: 'advanced',
      instrumentType: 'bass',
      format: 'alphatex',
      notationData: '\\title "Funk Groove"\n\\tempo 100\n\\instrument 37\n.\n0.4.16 0.4.16 r.16 3.4.16 r.8 0.4.16 3.4.16 | 5.4.8 3.4.16 0.4.16 r.8 0.4.8',
      metadata: { category: 'groove', tags: ['funk', 'slap', 'rhythm'] },
    },
    // Piano songs
    {
      title: 'C Major Scale Both Hands',
      artist: null,
      difficulty: 'beginner',
      instrumentType: 'piano',
      format: 'alphatex',
      notationData: '\\title "C Major Scale Both Hands"\n\\tempo 72\n.\n60.4 62.4 64.4 65.4 67.4 69.4 71.4 72.4',
      metadata: { category: 'exercise', tags: ['C major', 'scale', 'both hands'] },
    },
    {
      title: 'Broken Chord Exercise',
      artist: null,
      difficulty: 'beginner',
      instrumentType: 'piano',
      format: 'alphatex',
      notationData: '\\title "Broken Chord Exercise"\n\\tempo 80\n.\n60.8 64.8 67.8 72.8 | 62.8 65.8 69.8 74.8 | 64.8 67.8 71.8 76.8',
      metadata: { category: 'exercise', tags: ['broken chords', 'arpeggios'] },
    },
    {
      title: 'Simple Melody in G',
      artist: null,
      difficulty: 'beginner',
      instrumentType: 'piano',
      format: 'alphatex',
      notationData: '\\title "Simple Melody in G"\n\\tempo 90\n.\n67.4 69.4 71.4 72.4 | 74.2 72.4 71.4 | 69.2 67.2',
      metadata: { category: 'melody', tags: ['G major', 'simple'] },
    },
    {
      title: 'Hanon Exercise No.1',
      artist: 'Charles-Louis Hanon',
      difficulty: 'intermediate',
      instrumentType: 'piano',
      format: 'alphatex',
      notationData: '\\title "Hanon Exercise No.1"\n\\tempo 60\n.\n60.16 62.16 64.16 65.16 67.16 65.16 64.16 62.16 | 62.16 64.16 65.16 67.16 69.16 67.16 65.16 64.16',
      metadata: { category: 'exercise', tags: ['hanon', 'technique', 'finger independence'] },
    },
    {
      title: 'ii-V-I Voicings',
      artist: null,
      difficulty: 'advanced',
      instrumentType: 'piano',
      format: 'alphatex',
      notationData: '\\title "ii-V-I Voicings"\n\\tempo 80\n.\n(62 65 69 72).2 (67 71 74 77).2 | (60 64 67 71).1',
      metadata: { category: 'jazz', tags: ['ii-V-I', 'voicings', 'jazz harmony'] },
    },
    // Violin songs
    {
      title: 'Open String Bowing',
      artist: null,
      difficulty: 'beginner',
      instrumentType: 'violin',
      format: 'alphatex',
      notationData: '\\title "Open String Bowing"\n\\tempo 60\n.\n0.4.2 0.3.2 | 0.2.2 0.1.2 | 0.1.2 0.2.2 | 0.3.2 0.4.2',
      metadata: { category: 'exercise', tags: ['open strings', 'bowing'] },
    },
    {
      title: 'D Major Scale (1st Position)',
      artist: null,
      difficulty: 'beginner',
      instrumentType: 'violin',
      format: 'alphatex',
      notationData: '\\title "D Major Scale"\n\\tempo 72\n.\n0.3.4 1.3.4 3.3.4 0.2.4 | 1.2.4 3.2.4 0.1.4 2.1.4',
      metadata: { category: 'scale', tags: ['D major', 'first position'] },
    },
    {
      title: 'Twinkle Twinkle',
      artist: 'Traditional',
      difficulty: 'beginner',
      instrumentType: 'violin',
      format: 'alphatex',
      notationData: '\\title "Twinkle Twinkle"\n\\tempo 80\n.\n0.2.4 0.2.4 1.1.4 1.1.4 | 3.1.4 3.1.4 1.1.2 | 0.1.4 0.1.4 3.2.4 3.2.4 | 1.2.4 1.2.4 0.2.2',
      metadata: { category: 'piece', tags: ['suzuki', 'beginner', 'traditional'] },
    },
    {
      title: 'Vibrato Exercise',
      artist: null,
      difficulty: 'intermediate',
      instrumentType: 'violin',
      format: 'alphatex',
      notationData: '\\title "Vibrato Exercise"\n\\tempo 60\n.\n3.3.1 | 1.2.1 | 3.2.1 | 0.1.1',
      metadata: { category: 'technique', tags: ['vibrato', 'long tones'] },
    },
    {
      title: 'Double Stop Thirds',
      artist: null,
      difficulty: 'advanced',
      instrumentType: 'violin',
      format: 'alphatex',
      notationData: '\\title "Double Stop Thirds"\n\\tempo 66\n.\n(0.3 1.2).4 (1.3 3.2).4 (3.3 0.1).4 (0.2 1.1).4 | (1.2 3.1).4 (0.2 1.1).4 (3.3 0.1).4 (1.3 3.2).4',
      metadata: { category: 'technique', tags: ['double stops', 'thirds', 'advanced'] },
    },
  ])

  console.log('Songs seeded: 20 songs (5 per instrument)')

  // Seed metronome presets
  await db.insert(metronomePresets).values([
    {
      userId: demoUser.id,
      name: 'Slow 4/4',
      tempoBpm: 60,
      beatsPerMeasure: 4,
      beatUnit: 4,
      accentPattern: [true, false, false, false],
      subdivision: 1,
    },
    {
      userId: demoUser.id,
      name: 'Moderate 4/4',
      tempoBpm: 80,
      beatsPerMeasure: 4,
      beatUnit: 4,
      accentPattern: [true, false, false, false],
      subdivision: 1,
    },
    {
      userId: demoUser.id,
      name: 'Medium 4/4',
      tempoBpm: 100,
      beatsPerMeasure: 4,
      beatUnit: 4,
      accentPattern: [true, false, false, false],
      subdivision: 1,
    },
    {
      userId: demoUser.id,
      name: 'Fast 4/4',
      tempoBpm: 120,
      beatsPerMeasure: 4,
      beatUnit: 4,
      accentPattern: [true, false, false, false],
      subdivision: 1,
    },
    {
      userId: demoUser.id,
      name: 'Waltz 3/4',
      tempoBpm: 90,
      beatsPerMeasure: 3,
      beatUnit: 4,
      accentPattern: [true, false, false],
      subdivision: 1,
    },
    {
      userId: demoUser.id,
      name: 'Compound 6/8',
      tempoBpm: 80,
      beatsPerMeasure: 6,
      beatUnit: 8,
      accentPattern: [true, false, false, true, false, false],
      subdivision: 1,
    },
  ])

  console.log('Metronome presets seeded: 6 presets')

  console.log('Seeding complete!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
