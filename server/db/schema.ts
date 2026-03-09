import { pgTable, uuid, text, integer, timestamp, jsonb, real, boolean, pgEnum, date, index, uniqueIndex } from 'drizzle-orm/pg-core'

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
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  instrumentId: uuid('instrument_id').notNull().references(() => instruments.id, { onDelete: 'cascade' }),
  songId: uuid('song_id').references(() => songs.id, { onDelete: 'set null' }),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  durationSeconds: integer('duration_seconds'),
  tempoBpm: integer('tempo_bpm'),
  notes: text('notes'),
  tags: jsonb('tags').$type<string[]>().notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('practice_sessions_user_id_idx').on(table.userId),
  index('practice_sessions_started_at_idx').on(table.startedAt),
  index('practice_sessions_instrument_id_idx').on(table.instrumentId),
  index('practice_sessions_song_id_idx').on(table.songId),
  index('practice_sessions_user_id_started_at_idx').on(table.userId, table.startedAt),
])

export const practiceGoals = pgTable('practice_goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  instrumentId: uuid('instrument_id').references(() => instruments.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  description: text('description'),
  targetMinutesPerWeek: integer('target_minutes_per_week').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('practice_goals_user_id_idx').on(table.userId),
  index('practice_goals_instrument_id_idx').on(table.instrumentId),
])

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
}, (table) => [
  index('songs_instrument_type_idx').on(table.instrumentType),
  index('songs_difficulty_idx').on(table.difficulty),
])

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
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  songId: uuid('song_id').notNull().references(() => songs.id, { onDelete: 'cascade' }),
  completionPercent: real('completion_percent').notNull().default(0),
  maxTempoBpm: integer('max_tempo_bpm'),
  lastPracticedAt: timestamp('last_practiced_at', { withTimezone: true }),
  practiceCount: integer('practice_count').notNull().default(0),
}, (table) => [
  index('user_progress_user_id_idx').on(table.userId),
  index('user_progress_song_id_idx').on(table.songId),
  uniqueIndex('user_progress_user_id_song_id_idx').on(table.userId, table.songId),
])

export const earTrainingScores = pgTable('ear_training_scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  exerciseType: text('exercise_type').notNull(), // 'intervals' | 'notes'
  correct: integer('correct').notNull(),
  total: integer('total').notNull(),
  settings: jsonb('settings').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('ear_training_scores_user_id_idx').on(table.userId),
  index('ear_training_scores_exercise_type_idx').on(table.exerciseType),
  index('ear_training_scores_created_at_idx').on(table.createdAt),
])

export const metronomePresets = pgTable('metronome_presets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  tempoBpm: integer('tempo_bpm').notNull(),
  beatsPerMeasure: integer('beats_per_measure').notNull().default(4),
  beatUnit: integer('beat_unit').notNull().default(4),
  accentPattern: jsonb('accent_pattern').$type<boolean[]>(),
  subdivision: integer('subdivision').notNull().default(1),
}, (table) => [
  index('metronome_presets_user_id_idx').on(table.userId),
])
