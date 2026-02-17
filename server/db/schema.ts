import { pgTable, uuid, text, integer, timestamp, jsonb, real, boolean, pgEnum, date } from 'drizzle-orm/pg-core'

export const instrumentTypeEnum = pgEnum('instrument_type', ['guitar', 'bass', 'piano', 'violin'])
export const difficultyEnum = pgEnum('difficulty', ['beginner', 'intermediate', 'advanced', 'expert'])
export const notationFormatEnum = pgEnum('notation_format', ['alphatex', 'musicxml', 'guitar_pro', 'vexflow_json'])

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  avatarUrl: text('avatar_url'),
  currentStreak: integer('current_streak').notNull().default(0),
  longestStreak: integer('longest_streak').notNull().default(0),
  lastPracticeDate: date('last_practice_date'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const instruments = pgTable('instruments', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  type: instrumentTypeEnum('type').notNull(),
  tuning: jsonb('tuning').$type<string[]>(),
  stringCount: integer('string_count'),
  fretCount: integer('fret_count'),
  isDefault: boolean('is_default').notNull().default(false),
})

export const practiceSessions = pgTable('practice_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  instrumentId: uuid('instrument_id').notNull().references(() => instruments.id),
  songId: uuid('song_id').references(() => songs.id),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  durationSeconds: integer('duration_seconds'),
  tempoBpm: integer('tempo_bpm'),
  notes: text('notes'),
  tags: jsonb('tags').$type<string[]>().notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const practiceGoals = pgTable('practice_goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  instrumentId: uuid('instrument_id').references(() => instruments.id),
  title: text('title').notNull(),
  description: text('description'),
  targetMinutesPerWeek: integer('target_minutes_per_week').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const songs = pgTable('songs', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  artist: text('artist'),
  difficulty: difficultyEnum('difficulty').notNull(),
  instrumentType: instrumentTypeEnum('instrument_type').notNull(),
  format: notationFormatEnum('format').notNull(),
  notationData: text('notation_data').notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const scales = pgTable('scales', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  intervals: jsonb('intervals').$type<number[]>().notNull(),
  category: text('category').notNull(),
  description: text('description').notNull().default(''),
})

export const chords = pgTable('chords', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  symbol: text('symbol').notNull(),
  intervals: jsonb('intervals').$type<number[]>().notNull(),
  voicings: jsonb('voicings').$type<Record<string, number[][]>>(),
  instrumentType: instrumentTypeEnum('instrument_type'),
})

export const userProgress = pgTable('user_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  songId: uuid('song_id').notNull().references(() => songs.id),
  completionPercent: real('completion_percent').notNull().default(0),
  maxTempoBpm: integer('max_tempo_bpm'),
  lastPracticedAt: timestamp('last_practiced_at', { withTimezone: true }),
  practiceCount: integer('practice_count').notNull().default(0),
})

export const earTrainingScores = pgTable('ear_training_scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  exerciseType: text('exercise_type').notNull(), // 'intervals' | 'notes'
  correct: integer('correct').notNull(),
  total: integer('total').notNull(),
  settings: jsonb('settings').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const metronomePresets = pgTable('metronome_presets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  tempoBpm: integer('tempo_bpm').notNull(),
  beatsPerMeasure: integer('beats_per_measure').notNull().default(4),
  beatUnit: integer('beat_unit').notNull().default(4),
  accentPattern: jsonb('accent_pattern').$type<boolean[]>(),
  subdivision: integer('subdivision').notNull().default(1),
})
