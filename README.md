# MusicPractice

[![Nuxt](https://img.shields.io/badge/Nuxt-4.3.0-00DC82?logo=nuxt.js&logoColor=white)](https://nuxt.com/)
[![Vue](https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vue.js&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A comprehensive music practice tracking and theory learning application built with modern web technologies. Track your practice sessions, master music theory concepts, learn songs, and improve your ear training skills with interactive tools for guitar, bass, piano, and violin.

## Features

### Interactive Instruments
- **Guitar** - Interactive fretboard with note visualization
- **Bass** - 4-string and 5-string bass fretboard support
- **Piano** - Full keyboard with octave navigation
- **Violin** - Interactive fingerboard for string positions

### Practice Tracking
- Log practice sessions with duration, tempo, and notes
- Track daily practice streaks (current and longest)
- Set and monitor weekly practice goals
- View practice history and statistics
- Tag sessions for better organization

### Ear Training
- Interval recognition exercises
- Note identification training
- Score tracking and progress monitoring
- Customizable difficulty settings

### Music Theory
- **Scales** - Explore scales with interval patterns and categories
- **Chords** - Chord library with voicings for different instruments
- **Circle of Fifths** - Interactive visual reference
- **Interval Trainer** - Learn and practice musical intervals

### Song Library
- Browse and search song collection
- Difficulty levels: Beginner, Intermediate, Advanced, Expert
- Multiple notation formats: AlphaTex, MusicXML, Guitar Pro, VexFlow JSON
- Track progress on individual songs
- AlphaTab integration for interactive notation display

### Metronome
- Customizable tempo (BPM)
- Time signature support
- Accent patterns
- Subdivision options
- Save presets for quick access

### Progress & Statistics
- Dashboard with practice analytics
- Song completion tracking
- Tempo progression over time
- Practice frequency insights
- Visual charts and reports

## Tech Stack

### Frontend
- **Framework**: [Nuxt 4](https://nuxt.com/) with Vue 3
- **Language**: TypeScript
- **State Management**: Pinia
- **Styling**: Tailwind CSS v4
- **Audio**: Tone.js for audio synthesis and playback
- **Notation**: AlphaTab for interactive music notation
- **Music Theory**: VexFlow for music notation rendering

### Backend
- **Server**: Nuxt Server Routes (Nitro)
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: JWT with HTTP-only cookies
- **Password Hashing**: bcrypt

### Development Tools
- **Package Manager**: Bun or npm
- **Testing**: Vitest with Vue Test Utils
- **Linting**: Oxlint
- **Database Tools**: Drizzle Kit (migrations, studio)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** v18+ ([download](https://nodejs.org/))
- **Bun** (recommended) or **npm** ([Bun installation](https://bun.sh/))
- **PostgreSQL** v16+ ([download](https://www.postgresql.org/download/))

## Installation

Follow these steps to set up the project locally:

### 1. Clone the Repository

```bash
git clone <repository-url>
cd musicpractice
```

### 2. Install Dependencies

Using Bun (recommended):
```bash
bun install
```

Or using npm:
```bash
npm install
```

### 3. Set Up Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your configuration (see [Environment Variables](#environment-variables) section).

### 4. Set Up Database

Create a PostgreSQL database:

```bash
createdb musicpractice
```

Or using psql:
```sql
CREATE DATABASE musicpractice;
```

Update the `DATABASE_URL` in your `.env` file to match your database credentials.

### 5. Run Database Migrations

Generate and apply migrations:

```bash
# Generate migrations from schema
bun run db:generate

# Apply migrations to database
bun run db:migrate
```

Alternatively, use push mode for development:
```bash
bun run db:push
```

### 6. Seed Database (Optional)

Populate the database with initial data (scales, chords, demo songs):

```bash
bun run db:seed
```

### 7. Start Development Server

```bash
bun run dev
```

The application will be available at `http://localhost:3000`

## Development

### Available Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server with hot reload |
| `bun run build` | Build for production |
| `bun run preview` | Preview production build locally |
| `bun run test` | Run tests in watch mode |
| `bun run test:unit` | Run unit tests once |
| `bun run test:watch` | Run tests in watch mode |
| `bun run lint` | Run linter (Oxlint) |
| `bun run lint:fix` | Run linter and auto-fix issues |
| `bun run typecheck` | Run TypeScript type checking |

### Database Commands

| Command | Description |
|---------|-------------|
| `bun run db:generate` | Generate migrations from schema changes |
| `bun run db:migrate` | Apply pending migrations |
| `bun run db:push` | Push schema changes directly (development only) |
| `bun run db:studio` | Open Drizzle Studio for database browsing |
| `bun run db:seed` | Seed database with initial data |

## Database Setup

### Creating the Database

```bash
# Using createdb utility
createdb musicpractice

# Or using psql
psql -U postgres
CREATE DATABASE musicpractice;
\q
```

### Running Migrations

```bash
# Generate migrations after schema changes
bun run db:generate

# Apply migrations
bun run db:migrate
```

### Seeding Demo Data

The seed script populates:
- Default instruments (guitar, bass, piano, violin)
- Common scales (major, minor, pentatonic, etc.)
- Common chords (major, minor, 7th, etc.)
- Sample songs for testing

```bash
bun run db:seed
```

### Database Studio

Open Drizzle Studio to browse and edit data visually:

```bash
bun run db:studio
```

## Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/musicpractice

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars

# Environment
NODE_ENV=development
```

### Variable Descriptions

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret key for JWT token signing (min 32 characters) |
| `NODE_ENV` | No | Environment mode (`development`, `production`, `test`) |

### Production Recommendations

- Use a strong, randomly generated `JWT_SECRET` (at least 32 characters)
- Set `NODE_ENV=production`
- Use environment-specific database credentials
- Consider using a secrets manager for sensitive values

## Project Structure

```
musicpractice/
├── app/                    # Frontend application code
│   ├── assets/            # Static assets (CSS, images, fonts)
│   ├── components/        # Vue components
│   │   ├── dashboard/     # Dashboard widgets
│   │   ├── instruments/   # Instrument-specific components
│   │   ├── practice/      # Practice session components
│   │   ├── theory/        # Music theory components
│   │   └── ui/            # Reusable UI components
│   ├── composables/       # Vue composables (hooks)
│   ├── layouts/           # Page layouts
│   ├── middleware/        # Route middleware
│   ├── pages/             # Application pages/routes
│   │   ├── auth/          # Authentication pages
│   │   ├── instruments/   # Instrument pages
│   │   ├── practice/      # Practice pages
│   │   ├── songs/         # Song library pages
│   │   └── theory/        # Theory pages
│   ├── plugins/           # Vue plugins
│   ├── stores/            # Pinia state stores
│   └── utils/             # Utility functions
├── server/                # Backend server code
│   ├── api/               # API route handlers
│   │   ├── auth/          # Authentication endpoints
│   │   ├── account/       # Account management
│   │   ├── instruments/   # Instrument CRUD
│   │   ├── sessions/      # Practice sessions
│   │   ├── songs/         # Song management
│   │   ├── scales/        # Scale data
│   │   ├── chords/        # Chord data
│   │   ├── ear-training/  # Ear training exercises
│   │   ├── progress/      # User progress tracking
│   │   ├── stats/         # Statistics endpoints
│   │   ├── streaks/       # Streak tracking
│   │   └── goals/         # Practice goals
│   └── db/                # Database configuration
│       ├── migrations/    # SQL migrations
│       ├── schema.ts      # Drizzle ORM schema
│       ├── seed.ts        # Database seeding
│       └── index.ts       # Database connection
├── shared/                # Shared code between client and server
│   ├── constants/         # Shared constants
│   └── types/             # TypeScript type definitions
├── tests/                 # Test files
├── public/                # Static public assets
├── .env.example           # Environment variables template
├── drizzle.config.ts      # Drizzle ORM configuration
├── nuxt.config.ts         # Nuxt configuration
├── package.json           # Project dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── vitest.config.ts       # Vitest testing configuration
```

## API Documentation

For detailed API documentation, see [API.md](./API.md).

### API Endpoints Overview

| Category | Endpoints |
|----------|-----------|
| Authentication | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout` |
| Account | `GET /api/account`, `PUT /api/account` |
| Instruments | `GET /api/instruments`, `POST /api/instruments`, `PUT /api/instruments/:id` |
| Practice Sessions | `GET /api/sessions`, `POST /api/sessions`, `PUT /api/sessions/:id` |
| Songs | `GET /api/songs`, `POST /api/songs`, `GET /api/songs/:id` |
| Theory | `GET /api/scales`, `GET /api/chords` |
| Ear Training | `POST /api/ear-training/submit` |
| Progress | `GET /api/progress`, `PUT /api/progress/:songId` |
| Statistics | `GET /api/stats/overview`, `GET /api/stats/weekly` |
| Streaks | `GET /api/streaks`, `POST /api/streaks/update` |
| Goals | `GET /api/goals`, `POST /api/goals`, `PUT /api/goals/:id` |

## Contributing

We welcome contributions! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure linting and type checking pass

### Code Quality

Before submitting a PR, run:

```bash
# Run all checks
bun run lint
bun run typecheck
bun run test:unit
```

## Testing

The project uses Vitest for testing with Vue Test Utils.

```bash
# Run tests once
bun run test:unit

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test --coverage
```

Test files are located in the `tests/` directory and follow the pattern `*.test.ts`.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Nuxt](https://nuxt.com/) - The Vue.js framework
- [Vue](https://vuejs.org/) - The progressive JavaScript framework
- [Pinia](https://pinia.vuejs.org/) - Vue state management
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM
- [Tone.js](https://tonejs.github.io/) - Web audio framework
- [AlphaTab](https://alphatab.net/) - Music notation library
- [VexFlow](https://vexflow.com/) - Music notation rendering
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

---

Built with ❤️ for musicians and music students
