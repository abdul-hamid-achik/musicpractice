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

// Demo roster for the hero board. Minutes are against a 90-minute weekly target;
// the bar scale tops out at 150 so overachievers still fit.
const WEEKLY_TARGET = 90;
const BAR_MAX = 150;

const roster = [
  { name: 'Sofia R.', instrument: 'VIOLIN', minutes: 142, status: 'on' },
  { name: 'Marcus T.', instrument: 'GUITAR', minutes: 96, status: 'on' },
  { name: 'Priya S.', instrument: 'PIANO', minutes: 74, status: 'near' },
  { name: 'Yuki A.', instrument: 'BASS', minutes: 51, status: 'near' },
  { name: 'Leo M.', instrument: 'GUITAR', minutes: 12, status: 'off' },
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

    <!-- ═══════ HERO ═══════ -->
    <section class="relative overflow-hidden">
      <div
        class="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-16 sm:px-8 sm:pt-24 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:pb-28"
      >
        <div>
          <p class="mb-5 font-mono text-xs tracking-[0.25em] text-vu">FOR MUSIC TEACHERS</p>
          <h1
            class="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl"
          >
            Know who practiced<br />
            <span class="text-vu">before they walk in.</span>
          </h1>
          <p class="mt-6 max-w-xl text-base leading-relaxed text-tape-dim sm:text-lg">
            Give your students real practice tools — fretboards, ear training, a metronome, their
            repertoire. Every session logs itself. You get the board: minutes, streaks, and
            assignments, per student, before the lesson starts.
          </p>
          <div class="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
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

        <!-- Signature: the practice board, styled as a console -->
        <div class="board rounded-xl border border-line bg-panel p-1.5 shadow-2xl shadow-black/40">
          <div
            class="flex items-center justify-between rounded-t-lg border-b border-line bg-raised px-4 py-3"
          >
            <span class="font-mono text-[11px] tracking-[0.2em] text-tape-dim">THIS WEEK</span>
            <span class="font-mono text-[11px] tracking-[0.2em] text-tape-dim"
              >TARGET {{ WEEKLY_TARGET }} MIN</span
            >
          </div>
          <ul class="divide-y divide-line/60">
            <li
              v-for="(student, i) in roster"
              :key="student.name"
              class="flex items-center gap-3 px-4 py-3.5"
            >
              <span
                class="h-2 w-2 shrink-0 rounded-full"
                :class="ledClass[student.status]"
                :title="student.status === 'on' ? 'On track' : student.status === 'near' ? 'Getting there' : 'Behind'"
              />
              <div class="w-24 shrink-0 sm:w-28">
                <p class="truncate text-sm font-medium">{{ student.name }}</p>
                <p class="font-mono text-[10px] tracking-[0.15em] text-tape-dim">
                  {{ student.instrument }}
                </p>
              </div>
              <div class="h-2 flex-1 overflow-hidden rounded-full bg-booth">
                <div
                  class="meter h-full rounded-full bg-gradient-to-r from-vu-deep to-vu"
                  :style="{ width: barWidth(student.minutes), animationDelay: `${i * 120}ms` }"
                />
              </div>
              <span class="w-14 shrink-0 text-right font-mono text-xs text-tape-dim"
                >{{ student.minutes }}<span class="text-[10px]"> min</span></span
              >
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- ═══════ HOW IT WORKS ═══════ -->
    <section id="how" class="border-y border-line bg-panel">
      <div class="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
        <p class="mb-3 font-mono text-xs tracking-[0.25em] text-vu">HOW IT WORKS</p>
        <h2 class="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          The loop between lessons
        </h2>
        <div class="mt-12 grid gap-10 sm:grid-cols-3 sm:gap-8">
          <div v-for="step in steps" :key="step.number" class="relative">
            <span class="font-mono text-sm text-vu">{{ step.number }} —</span>
            <h3 class="mt-2 font-display text-xl font-bold">{{ step.title }}</h3>
            <p class="mt-2 text-sm leading-relaxed text-tape-dim">{{ step.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════ STUDENT TOOLKIT ═══════ -->
    <section class="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
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
          class="grid gap-1 py-5 sm:grid-cols-[10rem_14rem_1fr] sm:items-baseline sm:gap-6"
        >
          <span class="font-mono text-[11px] tracking-[0.2em] text-vu">{{ unit.tag }}</span>
          <h3 class="font-display text-lg font-bold">{{ unit.title }}</h3>
          <p class="text-sm leading-relaxed text-tape-dim">{{ unit.description }}</p>
        </li>
      </ul>
    </section>

    <!-- ═══════ PRICING ═══════ -->
    <section class="border-y border-line bg-panel">
      <div class="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
        <p class="mb-3 font-mono text-xs tracking-[0.25em] text-vu">PRICING</p>
        <h2 class="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Free to start. Pay when it pays for itself.
        </h2>
        <div class="mt-12 grid gap-6 sm:grid-cols-2 lg:max-w-4xl">
          <div class="flex flex-col rounded-xl border border-line bg-raised p-7">
            <p class="font-mono text-[11px] tracking-[0.2em] text-tape-dim">SOLO</p>
            <p class="mt-3 font-display text-4xl font-extrabold">Free</p>
            <ul class="mb-8 mt-6 space-y-2.5 text-sm text-tape-dim">
              <li>Up to 3 students</li>
              <li>All practice tools</li>
              <li>The weekly board</li>
            </ul>
            <NuxtLink
              to="/auth/register"
              class="mt-auto block rounded-md border border-line py-2.5 text-center text-sm font-semibold transition-colors hover:border-tape-dim"
            >
              Start free
            </NuxtLink>
          </div>
          <div class="rounded-xl border border-vu/40 bg-raised p-7">
            <p class="font-mono text-[11px] tracking-[0.2em] text-vu">STUDIO</p>
            <p class="mt-3 font-display text-4xl font-extrabold">
              $15<span class="text-lg font-semibold text-tape-dim"> /month</span>
            </p>
            <ul class="mt-6 space-y-2.5 text-sm text-tape-dim">
              <li>Unlimited students</li>
              <li>Assignment templates</li>
              <li>Weekly email digest</li>
              <li>Practice insights over time</li>
            </ul>
            <NuxtLink
              to="/auth/register"
              class="mt-8 block rounded-md bg-vu py-2.5 text-center text-sm font-semibold text-booth transition-all hover:brightness-110"
            >
              Join as a founding studio
            </NuxtLink>
            <p class="mt-3 text-center text-xs text-tape-dim">
              Founding studios practice free while billing is being built.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════ FINAL CTA + FOOTER ═══════ -->
    <section class="mx-auto max-w-6xl px-5 py-20 text-center sm:px-8 sm:py-24">
      <h2 class="mx-auto max-w-2xl font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
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
