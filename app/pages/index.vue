<script setup lang="ts">
definePageMeta({ layout: false });

useHead({
  title: 'MusicPractice — the practice board for music teachers',
  meta: [
    {
      name: 'description',
      content:
        'Assign practice, give students real tools, and see who actually practiced — before they walk into the lesson.',
    },
  ],
});

// Demo roster for the hero board. Minutes are against a 90-minute weekly
// target; the bar scale tops out at 150 so overachievers still fit.
const WEEKLY_TARGET = 90;
const BAR_MAX = 150;
const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const roster = [
  { name: 'Sofia R.', instrument: 'VIOLIN', minutes: 142, status: 'on', days: [1, 1, 0, 1, 1, 1, 1] },
  { name: 'Marcus T.', instrument: 'GUITAR', minutes: 96, status: 'on', days: [1, 0, 1, 1, 0, 1, 1] },
  { name: 'Priya S.', instrument: 'PIANO', minutes: 74, status: 'near', days: [0, 1, 1, 0, 1, 1, 0] },
  { name: 'Yuki A.', instrument: 'BASS', minutes: 51, status: 'near', days: [1, 0, 0, 1, 0, 1, 0] },
  { name: 'Leo M.', instrument: 'GUITAR', minutes: 12, status: 'off', days: [0, 0, 1, 0, 0, 0, 0] },
] as const;

const ledClass = {
  on: 'bg-led shadow-[0_0_6px_var(--color-led)]',
  near: 'bg-vu shadow-[0_0_6px_var(--color-vu)]',
  off: 'bg-peak shadow-[0_0_6px_var(--color-peak)]',
} as const;

const barWidth = (minutes: number) => `${Math.min(minutes / BAR_MAX, 1) * 100}%`;

const steps = [
  {
    number: '1',
    title: 'Assign the week',
    description:
      'Pick pieces, exercises, and a minute target for each student. Takes a minute after the lesson.',
  },
  {
    number: '2',
    title: 'Students practice in the app',
    description:
      'Fretboards, ear training, metronome, notation — every session logs itself while they play.',
  },
  {
    number: '3',
    title: 'Open the board before the lesson',
    description:
      'Minutes, streaks, and finished assignments per student. You plan the lesson around what actually happened.',
  },
];

const toolkit = [
  {
    tag: 'FRETBOARD',
    title: 'Fretboards & keys',
    description: 'Interactive guitar, bass, violin, and piano diagrams students can actually poke.',
  },
  {
    tag: 'EAR',
    title: 'Ear training',
    description: 'Interval and note recognition drills — scores land on your board automatically.',
  },
  {
    tag: 'TEMPO',
    title: 'Metronome',
    description: 'Practice tempos are logged with every session, so you can hear progress in numbers.',
  },
  {
    tag: 'REPERTOIRE',
    title: 'Song library',
    description: 'Guitar Pro, MusicXML, and AlphaTex notation rendered right in the browser.',
  },
  {
    tag: 'THEORY',
    title: 'Theory tools',
    description: 'Scales, chords, and the circle of fifths — interactive, not flashcards.',
  },
];

const plans = [
  {
    tag: 'SOLO',
    price: 'Free',
    per: '',
    includes: ['Up to 3 students', 'All practice tools', 'The weekly board'],
    cta: 'Start free',
    featured: false,
  },
  {
    tag: 'STUDIO',
    price: '$15',
    per: '/month',
    includes: [
      'Unlimited students',
      'Assignment templates',
      'Weekly email digest',
      'Practice insights over time',
    ],
    cta: 'Join as a founding studio',
    featured: true,
  },
];
</script>

<template>
  <div class="landing min-h-screen bg-booth text-tape">
    <!-- ═══════ NAV ═══════ -->
    <nav class="sticky top-0 z-50 border-b border-line bg-booth/85 backdrop-blur-md">
      <div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <NuxtLink to="/" class="font-display text-lg font-extrabold tracking-tight">
          Music<span class="text-vu">Practice</span>
        </NuxtLink>
        <div class="flex items-center gap-3 sm:gap-5">
          <NuxtLink
            to="/auth/login"
            class="text-sm font-medium text-tape-dim transition-colors hover:text-tape"
          >
            Sign in
          </NuxtLink>
          <NuxtLink
            to="/auth/register"
            class="rounded-md bg-vu px-4 py-2 text-sm font-semibold text-booth transition-all hover:brightness-110"
          >
            Set up your studio
          </NuxtLink>
        </div>
      </div>
    </nav>

    <!-- ═══════ HERO: full-width type, no columns, no box ═══════ -->
    <header class="mx-auto max-w-6xl px-5 pb-14 pt-16 sm:px-8 sm:pb-20 sm:pt-24">
      <p class="mb-6 font-mono text-xs tracking-[0.3em] text-vu">FOR MUSIC TEACHERS</p>
      <h1
        class="font-display max-w-5xl text-[2.75rem] font-extrabold leading-[0.98] tracking-tight sm:text-7xl lg:text-8xl"
      >
        Know who practiced<br />
        <span class="text-vu">before they walk in.</span>
      </h1>
      <div
        class="mt-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-10"
      >
        <p class="max-w-md text-base leading-relaxed text-tape-dim sm:text-lg">
          Your students practice with real tools. Every session logs itself. You get the board.
        </p>
        <div class="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
          <NuxtLink
            to="/auth/register"
            class="rounded-md bg-vu px-6 py-3 text-center text-base font-semibold text-booth shadow-lg shadow-vu/20 transition-all hover:brightness-110"
          >
            Set up your studio — free
          </NuxtLink>
          <a
            href="#how"
            class="rounded-md border border-line px-6 py-3 text-center text-base font-medium text-tape-dim transition-colors hover:border-tape-dim hover:text-tape"
          >
            See how it works
          </a>
        </div>
      </div>
    </header>

    <!-- ═══════ THE BOARD: full-bleed console, the page's furniture ═══════ -->
    <section aria-label="Example weekly practice board" class="border-y border-line bg-panel">
      <div class="mx-auto max-w-6xl px-5 sm:px-8">
        <div
          class="flex items-center justify-between gap-4 border-b border-line py-3 font-mono text-[11px] tracking-[0.2em] text-tape-dim"
        >
          <span>THIS WEEK</span>
          <span class="hidden sm:inline">{{ roster.length }} STUDENTS</span>
          <span>TARGET {{ WEEKLY_TARGET }} MIN</span>
        </div>
        <ul>
          <li
            v-for="(student, i) in roster"
            :key="student.name"
            class="grid grid-cols-[auto_minmax(6rem,10rem)_1fr_auto] items-center gap-x-3 border-b border-line/60 py-4 last:border-b-0 sm:grid-cols-[auto_11rem_auto_1fr_auto] sm:gap-x-6"
          >
            <span class="h-2 w-2 rounded-full" :class="ledClass[student.status]" />
            <div class="min-w-0">
              <p class="truncate text-sm font-medium sm:text-base">{{ student.name }}</p>
              <p class="font-mono text-[10px] tracking-[0.15em] text-tape-dim">
                {{ student.instrument }}
              </p>
            </div>
            <div class="hidden gap-1 sm:flex" aria-hidden="true">
              <span
                v-for="(practiced, d) in student.days"
                :key="d"
                class="h-2 w-2 rounded-[2px]"
                :class="practiced ? 'bg-vu' : 'bg-raised'"
                :title="DAYS[d]"
              />
            </div>
            <div class="h-2 overflow-hidden rounded-full bg-booth">
              <div
                class="meter h-full rounded-full bg-gradient-to-r from-vu-deep to-vu"
                :style="{ width: barWidth(student.minutes), animationDelay: `${i * 120}ms` }"
              />
            </div>
            <span class="w-16 text-right font-mono text-xs text-tape-dim sm:text-sm"
              >{{ student.minutes }}<span class="text-[10px]"> min</span></span
            >
          </li>
        </ul>
        <p class="py-3 text-right font-mono text-[10px] tracking-[0.2em] text-tape-dim/70">
          LIVE FROM YOUR STUDENTS' SESSIONS — NO SELF-REPORTING
        </p>
      </div>
    </section>

    <!-- ═══════ HOW IT WORKS ═══════ -->
    <section id="how" class="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
      <p class="mb-3 font-mono text-xs tracking-[0.25em] text-vu">HOW IT WORKS</p>
      <h2 class="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
        The loop between lessons
      </h2>
      <div class="mt-12 grid gap-10 sm:grid-cols-3 sm:gap-8">
        <div v-for="step in steps" :key="step.number">
          <span class="font-mono text-sm text-vu">{{ step.number }} —</span>
          <h3 class="mt-2 font-display text-xl font-bold">{{ step.title }}</h3>
          <p class="mt-2 text-sm leading-relaxed text-tape-dim">{{ step.description }}</p>
        </div>
      </div>
    </section>

    <!-- ═══════ STUDENT TOOLKIT ═══════ -->
    <section class="border-y border-line bg-panel">
      <div class="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
        <p class="mb-3 font-mono text-xs tracking-[0.25em] text-vu">THE STUDENT SIDE</p>
        <h2 class="max-w-2xl font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Practice they'll actually do, in one place
        </h2>
        <p class="mt-4 max-w-xl text-tape-dim">
          No PDFs, no separate metronome app, no honor system. Everything they need is where the
          logging happens.
        </p>
        <ul class="mt-10 divide-y divide-line border-y border-line">
          <li
            v-for="unit in toolkit"
            :key="unit.tag"
            class="grid gap-1 py-5 lg:grid-cols-[10rem_14rem_1fr] lg:items-baseline lg:gap-6"
          >
            <span class="font-mono text-[11px] tracking-[0.2em] text-vu">{{ unit.tag }}</span>
            <h3 class="font-display text-lg font-bold">{{ unit.title }}</h3>
            <p class="text-sm leading-relaxed text-tape-dim">{{ unit.description }}</p>
          </li>
        </ul>
      </div>
    </section>

    <!-- ═══════ PRICING: a studio rate card, not cards ═══════ -->
    <section class="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
      <p class="mb-3 font-mono text-xs tracking-[0.25em] text-vu">RATE CARD</p>
      <h2 class="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
        Free to start. Pay when it pays for itself.
      </h2>
      <ul class="mt-12 border-y border-line">
        <li
          v-for="plan in plans"
          :key="plan.tag"
          class="grid items-center gap-x-8 gap-y-3 border-b border-line py-8 last:border-b-0 lg:grid-cols-[7rem_11rem_1fr_auto]"
        >
          <span
            class="font-mono text-[11px] tracking-[0.2em]"
            :class="plan.featured ? 'text-vu' : 'text-tape-dim'"
            >{{ plan.tag }}</span
          >
          <p class="font-display text-4xl font-extrabold">
            {{ plan.price
            }}<span v-if="plan.per" class="text-lg font-semibold text-tape-dim">{{ plan.per }}</span>
          </p>
          <p class="text-sm leading-relaxed text-tape-dim">
            {{ plan.includes.join(' · ') }}
          </p>
          <NuxtLink
            to="/auth/register"
            class="rounded-md px-5 py-2.5 text-center text-sm font-semibold transition-all"
            :class="
              plan.featured
                ? 'bg-vu text-booth hover:brightness-110'
                : 'border border-line hover:border-tape-dim'
            "
          >
            {{ plan.cta }}
          </NuxtLink>
        </li>
      </ul>
      <p class="mt-3 text-sm text-tape-dim">
        Founding studios practice free while billing is being built.
      </p>
    </section>

    <!-- ═══════ FINAL CTA + FOOTER ═══════ -->
    <section class="border-t border-line bg-panel">
      <div class="mx-auto max-w-6xl px-5 py-20 text-center sm:px-8 sm:py-24">
        <h2
          class="mx-auto max-w-2xl font-display text-3xl font-extrabold tracking-tight sm:text-4xl"
        >
          Stop asking <span class="text-vu">"did you practice?"</span>
        </h2>
        <p class="mx-auto mt-4 max-w-md text-tape-dim">
          Set up your studio, invite your students, and open the board next week.
        </p>
        <NuxtLink
          to="/auth/register"
          class="mt-8 inline-block rounded-md bg-vu px-8 py-3 text-base font-semibold text-booth shadow-lg shadow-vu/20 transition-all hover:brightness-110"
        >
          Set up your studio — free
        </NuxtLink>
      </div>
    </section>

    <footer class="border-t border-line">
      <div
        class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row sm:px-8"
      >
        <p class="font-display text-sm font-bold">
          Music<span class="text-vu">Practice</span>
          <span class="ml-2 font-sans font-normal text-tape-dim"
            >— the practice board for music teachers.</span
          >
        </p>
        <div class="flex gap-5 text-sm text-tape-dim">
          <NuxtLink to="/auth/login" class="transition-colors hover:text-tape">Sign in</NuxtLink>
          <NuxtLink to="/auth/register" class="transition-colors hover:text-tape"
            >Create account</NuxtLink
          >
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Landing commits to the studio look regardless of app theme toggle. */
.landing :where(a, button):focus-visible {
  outline: 2px solid var(--color-vu);
}

/* Meter bars sweep in like a console coming online. */
@keyframes meter-in {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

.meter {
  transform-origin: left;
  animation: meter-in 900ms cubic-bezier(0.22, 1, 0.36, 1) backwards;
}

@media (prefers-reduced-motion: reduce) {
  .meter {
    animation: none;
  }
}
</style>
