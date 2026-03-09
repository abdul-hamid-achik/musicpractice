# API Documentation

**Base URL:** `/api`

## Authentication

The MusicPractice API uses **JWT cookie-based authentication**.

### How to Authenticate

1. **Login** via `POST /api/auth/login` with credentials
2. The server sets an HTTP-only cookie named `auth-token`
3. Include this cookie automatically in subsequent requests (browsers handle this)
4. For programmatic access, ensure cookies are enabled in your HTTP client

### Cookie Details

| Property | Value |
|----------|-------|
| **Cookie Name** | `auth-token` |
| **Token Expiration** | 7 days |
| **HttpOnly** | `true` (not accessible via JavaScript) |
| **Secure** | `true` in production, `false` in development |
| **SameSite** | `lax` |
| **Path** | `/` |

### Authentication Flow

```bash
# 1. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier": "user@example.com", "password": "secret123"}' \
  -c cookies.txt

# 2. Access protected endpoint
curl http://localhost:3000/api/auth/me \
  -b cookies.txt
```

---

## Endpoints

### Auth

#### POST /auth/login

Authenticate a user and receive an authentication cookie.

**Authentication:** Not required

**Request Body:**
```json
{
  "identifier": "string (email or username)",
  "password": "string"
}
```

**Response:**
```json
{
  "id": "uuid",
  "email": "string",
  "username": "string",
  "name": "string",
  "avatarUrl": "string | null",
  "createdAt": "ISO 8601 datetime",
  "updatedAt": "ISO 8601 datetime"
}
```

**Errors:**
- `400`: Missing required fields
- `401`: Invalid credentials

**Example:**
```bash
curl -X POST /api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier": "user@example.com", "password": "secret123"}'
```

---

#### POST /auth/register

Create a new user account.

**Authentication:** Not required

**Request Body:**
```json
{
  "email": "string (valid email format)",
  "username": "string (3-30 characters)",
  "password": "string (min 8 characters)",
  "name": "string"
}
```

**Response:**
```json
{
  "id": "uuid",
  "email": "string",
  "username": "string",
  "name": "string",
  "avatarUrl": "string | null",
  "createdAt": "ISO 8601 datetime",
  "updatedAt": "ISO 8601 datetime"
}
```

**Errors:**
- `400`: Invalid email format, username length, or password length
- `409`: Email or username already exists

**Example:**
```bash
curl -X POST /api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "new@example.com", "username": "newuser", "password": "securepass123", "name": "New User"}'
```

---

#### POST /auth/logout

Clear the authentication cookie and log out the user.

**Authentication:** Not required (but typically called when authenticated)

**Response:**
```json
{
  "success": true
}
```

**Example:**
```bash
curl -X POST /api/auth/logout
```

---

#### GET /auth/me

Get the currently authenticated user's profile.

**Authentication:** Required

**Response:**
```json
{
  "id": "uuid",
  "email": "string",
  "username": "string",
  "name": "string",
  "avatarUrl": "string | null",
  "createdAt": "ISO 8601 datetime",
  "updatedAt": "ISO 8601 datetime"
}
```

**Errors:**
- `401`: Not authenticated or invalid token

**Example:**
```bash
curl /api/auth/me
```

---

### Practice Sessions

#### GET /sessions

List practice sessions with pagination and filtering.

**Authentication:** Required

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number |
| `limit` | number | No | 20 | Items per page (max: 100) |
| `instrumentId` | uuid | No | - | Filter by instrument |
| `startDate` | ISO date | No | - | Filter sessions from this date |
| `endDate` | ISO date | No | - | Filter sessions until this date |

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "instrumentId": "uuid",
      "instrumentName": "string",
      "songId": "uuid | null",
      "songTitle": "string | null",
      "startedAt": "ISO 8601 datetime",
      "endedAt": "ISO 8601 datetime | null",
      "durationSeconds": "number | null",
      "tempoBpm": "number | null",
      "notes": "string | null",
      "tags": ["string"],
      "createdAt": "ISO 8601 datetime"
    }
  ],
  "total": "number",
  "page": "number",
  "limit": "number"
}
```

**Errors:**
- `400`: Invalid instrumentId format
- `401`: Not authenticated

**Example:**
```bash
curl "/api/sessions?page=1&limit=10&instrumentId=abc-123"
```

---

#### POST /sessions

Create a new practice session.

**Authentication:** Required

**Request Body:**
```json
{
  "instrumentId": "uuid (required)",
  "startedAt": "ISO 8601 datetime (required)",
  "songId": "uuid (optional)",
  "endedAt": "ISO 8601 datetime (optional)",
  "durationSeconds": "number (optional, non-negative integer)",
  "tempoBpm": "number (optional, positive integer)",
  "notes": "string (optional)",
  "tags": ["string"] (optional, default: [])
}
```

**Response:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "instrumentId": "uuid",
  "songId": "uuid | null",
  "startedAt": "ISO 8601 datetime",
  "endedAt": "ISO 8601 datetime | null",
  "durationSeconds": "number | null",
  "tempoBpm": "number | null",
  "notes": "string | null",
  "tags": ["string"],
  "createdAt": "ISO 8601 datetime"
}
```

**Side Effects:**
- Updates user's streak (current and longest)
- Updates song progress if `songId` is provided

**Errors:**
- `400`: Missing required fields, invalid UUID format, invalid number values
- `401`: Not authenticated

**Example:**
```bash
curl -X POST /api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "instrumentId": "abc-123-def",
    "startedAt": "2024-01-15T10:00:00Z",
    "durationSeconds": 1800,
    "tempoBpm": 120,
    "tags": ["scales", "warmup"]
  }'
```

---

#### GET /sessions/:id

Get a specific practice session by ID.

**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | uuid | Session ID |

**Response:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "instrumentId": "uuid",
  "instrumentName": "string",
  "startedAt": "ISO 8601 datetime",
  "endedAt": "ISO 8601 datetime | null",
  "durationSeconds": "number | null",
  "tempoBpm": "number | null",
  "notes": "string | null",
  "tags": ["string"],
  "createdAt": "ISO 8601 datetime"
}
```

**Errors:**
- `400`: Invalid session ID format
- `401`: Not authenticated
- `404`: Session not found

**Example:**
```bash
curl /api/sessions/abc-123-def
```

---

#### PUT /sessions/:id

Update a practice session.

**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | uuid | Session ID |

**Request Body:**
```json
{
  "endedAt": "ISO 8601 datetime | null (optional)",
  "durationSeconds": "number (optional, non-negative integer)",
  "tempoBpm": "number (optional, positive integer)",
  "notes": "string (optional)",
  "tags": ["string"] (optional)
}
```

**Response:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "instrumentId": "uuid",
  "startedAt": "ISO 8601 datetime",
  "endedAt": "ISO 8601 datetime | null",
  "durationSeconds": "number | null",
  "tempoBpm": "number | null",
  "notes": "string | null",
  "tags": ["string"],
  "createdAt": "ISO 8601 datetime"
}
```

**Errors:**
- `400`: Invalid ID format, invalid field values, no valid fields to update
- `401`: Not authenticated
- `404`: Session not found

**Example:**
```bash
curl -X PUT /api/sessions/abc-123-def \
  -H "Content-Type: application/json" \
  -d '{"endedAt": "2024-01-15T10:30:00Z", "durationSeconds": 1800}'
```

---

#### DELETE /sessions/:id

Delete a practice session.

**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | uuid | Session ID |

**Response:**
```json
{
  "message": "Session deleted",
  "id": "uuid"
}
```

**Errors:**
- `400`: Invalid session ID format
- `401`: Not authenticated
- `404`: Session not found

**Example:**
```bash
curl -X DELETE /api/sessions/abc-123-def
```

---

### Practice Goals

#### GET /goals

List practice goals with pagination and filtering.

**Authentication:** Required

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number |
| `limit` | number | No | 20 | Items per page (max: 100) |
| `isActive` | boolean | No | - | Filter by active status |

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "instrumentId": "uuid | null",
      "instrumentName": "string | null",
      "title": "string",
      "description": "string | null",
      "targetMinutesPerWeek": "number",
      "isActive": "boolean",
      "createdAt": "ISO 8601 datetime"
    }
  ],
  "total": "number",
  "page": "number",
  "limit": "number"
}
```

**Errors:**
- `401`: Not authenticated

**Example:**
```bash
curl "/api/goals?isActive=true&page=1"
```

---

#### POST /goals

Create a new practice goal.

**Authentication:** Required

**Request Body:**
```json
{
  "title": "string (required)",
  "targetMinutesPerWeek": "number (required, positive integer)",
  "instrumentId": "uuid (optional)",
  "description": "string (optional)"
}
```

**Response:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "instrumentId": "uuid | null",
  "title": "string",
  "description": "string | null",
  "targetMinutesPerWeek": "number",
  "isActive": true,
  "createdAt": "ISO 8601 datetime"
}
```

**Errors:**
- `400`: Missing required fields, invalid instrumentId, invalid targetMinutesPerWeek
- `401`: Not authenticated

**Example:**
```bash
curl -X POST /api/goals \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Practice scales daily",
    "targetMinutesPerWeek": 300,
    "instrumentId": "abc-123-def",
    "description": "Focus on major and minor scales"
  }'
```

---

#### GET /goals/:id

Get a specific goal by ID.

**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | uuid | Goal ID |

**Response:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "instrumentId": "uuid | null",
  "instrumentName": "string | null",
  "title": "string",
  "description": "string | null",
  "targetMinutesPerWeek": "number",
  "isActive": "boolean",
  "createdAt": "ISO 8601 datetime"
}
```

**Errors:**
- `400`: Invalid goal ID format
- `401`: Not authenticated
- `404`: Goal not found

**Example:**
```bash
curl /api/goals/abc-123-def
```

---

#### PUT /goals/:id

Update a practice goal.

**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | uuid | Goal ID |

**Request Body:**
```json
{
  "title": "string (optional)",
  "description": "string (optional)",
  "instrumentId": "uuid | null (optional)",
  "targetMinutesPerWeek": "number (optional, positive integer)",
  "isActive": "boolean (optional)"
}
```

**Response:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "instrumentId": "uuid | null",
  "title": "string",
  "description": "string | null",
  "targetMinutesPerWeek": "number",
  "isActive": "boolean",
  "createdAt": "ISO 8601 datetime"
}
```

**Errors:**
- `400`: Invalid ID format, invalid field values, no valid fields to update
- `401`: Not authenticated
- `404`: Goal not found

**Example:**
```bash
curl -X PUT /api/goals/abc-123-def \
  -H "Content-Type: application/json" \
  -d '{"isActive": false}'
```

---

#### DELETE /goals/:id

Delete a practice goal.

**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | uuid | Goal ID |

**Response:**
```json
{
  "message": "Goal deleted",
  "id": "uuid"
}
```

**Errors:**
- `400`: Invalid goal ID format
- `401`: Not authenticated
- `404`: Goal not found

**Example:**
```bash
curl -X DELETE /api/goals/abc-123-def
```

---

### Songs

#### GET /songs

List songs with pagination, search, and filtering.

**Authentication:** Not required

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number |
| `limit` | number | No | 20 | Items per page (max: 100) |
| `search` | string | No | - | Search by title or artist (case-insensitive) |
| `instrumentType` | string | No | - | Filter: `guitar`, `bass`, `piano`, `violin` |
| `difficulty` | string | No | - | Filter: `beginner`, `intermediate`, `advanced`, `expert` |

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "string",
      "artist": "string | null",
      "difficulty": "beginner | intermediate | advanced | expert",
      "instrumentType": "guitar | bass | piano | violin",
      "format": "alphatex | musicxml | guitar_pro | vexflow_json",
      "notationData": "string",
      "metadata": "object | null",
      "createdAt": "ISO 8601 datetime"
    }
  ],
  "total": "number",
  "page": "number",
  "limit": "number"
}
```

**Errors:**
- `400`: Invalid instrumentType or difficulty value

**Example:**
```bash
curl "/api/songs?search=beatles&difficulty=intermediate&instrumentType=guitar"
```

---

#### POST /songs

Create a new song (admin/teacher function).

**Authentication:** Not required (consider adding auth in production)

**Request Body:**
```json
{
  "title": "string (required)",
  "artist": "string (optional)",
  "difficulty": "beginner | intermediate | advanced | expert (required)",
  "instrumentType": "guitar | bass | piano | violin (required)",
  "format": "alphatex | musicxml | guitar_pro | vexflow_json (required)",
  "notationData": "string (required)",
  "metadata": "object (optional)"
}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "string",
  "artist": "string | null",
  "difficulty": "string",
  "instrumentType": "string",
  "format": "string",
  "notationData": "string",
  "metadata": "object | null",
  "createdAt": "ISO 8601 datetime"
}
```

**Errors:**
- `400`: Missing required fields, invalid enum values

**Example:**
```bash
curl -X POST /api/songs \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Wonderwall",
    "artist": "Oasis",
    "difficulty": "intermediate",
    "instrumentType": "guitar",
    "format": "alphatex",
    "notationData": "[scale data here]"
  }'
```

---

#### GET /songs/:id

Get a specific song by ID.

**Authentication:** Not required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | uuid | Song ID |

**Response:**
```json
{
  "id": "uuid",
  "title": "string",
  "artist": "string | null",
  "difficulty": "string",
  "instrumentType": "string",
  "format": "string",
  "notationData": "string",
  "metadata": "object | null",
  "createdAt": "ISO 8601 datetime"
}
```

**Errors:**
- `400`: Invalid song ID format
- `404`: Song not found

**Example:**
```bash
curl /api/songs/abc-123-def
```

---

#### PUT /songs/:id

Update a song.

**Authentication:** Not required (consider adding auth in production)

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | uuid | Song ID |

**Request Body:**
```json
{
  "title": "string (optional)",
  "artist": "string (optional)",
  "difficulty": "beginner | intermediate | advanced | expert (optional)",
  "instrumentType": "guitar | bass | piano | violin (optional)",
  "format": "alphatex | musicxml | guitar_pro | vexflow_json (optional)",
  "notationData": "string (optional)",
  "metadata": "object (optional)"
}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "string",
  "artist": "string | null",
  "difficulty": "string",
  "instrumentType": "string",
  "format": "string",
  "notationData": "string",
  "metadata": "object | null",
  "createdAt": "ISO 8601 datetime"
}
```

**Errors:**
- `400`: Invalid ID format, invalid enum values, no valid fields to update
- `404`: Song not found

**Example:**
```bash
curl -X PUT /api/songs/abc-123-def \
  -H "Content-Type: application/json" \
  -d '{"difficulty": "advanced"}'
```

---

#### DELETE /songs/:id

Delete a song.

**Authentication:** Not required (consider adding auth in production)

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | uuid | Song ID |

**Response:**
```json
{
  "message": "Song deleted",
  "id": "uuid"
}
```

**Errors:**
- `400`: Invalid song ID format
- `404`: Song not found

**Example:**
```bash
curl -X DELETE /api/songs/abc-123-def
```

---

### Progress

#### GET /progress

List user progress for songs.

**Authentication:** Required

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number |
| `limit` | number | No | 20 | Items per page (max: 100) |
| `songId` | uuid | No | - | Filter by specific song |

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "songId": "uuid",
      "songTitle": "string",
      "completionPercent": "number (0-100)",
      "maxTempoBpm": "number | null",
      "lastPracticedAt": "ISO 8601 datetime | null",
      "practiceCount": "number"
    }
  ],
  "total": "number",
  "page": "number",
  "limit": "number"
}
```

**Errors:**
- `400`: Invalid songId format
- `401`: Not authenticated

**Example:**
```bash
curl "/api/progress?songId=abc-123"
```

---

#### POST /progress

Create a new progress entry for a song.

**Authentication:** Required

**Request Body:**
```json
{
  "songId": "uuid (required)",
  "completionPercent": "number (optional, 0-100, default: 0)",
  "maxTempoBpm": "number (optional, positive integer)",
  "lastPracticedAt": "ISO 8601 datetime (optional)",
  "practiceCount": "number (optional, non-negative integer, default: 0)"
}
```

**Response:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "songId": "uuid",
  "completionPercent": "number",
  "maxTempoBpm": "number | null",
  "lastPracticedAt": "ISO 8601 datetime | null",
  "practiceCount": "number"
}
```

**Errors:**
- `400`: Missing songId, invalid field values
- `401`: Not authenticated

**Example:**
```bash
curl -X POST /api/progress \
  -H "Content-Type: application/json" \
  -d '{
    "songId": "abc-123-def",
    "completionPercent": 25,
    "maxTempoBpm": 100
  }'
```

---

#### GET /progress/:id

Get a specific progress entry by ID.

**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | uuid | Progress ID |

**Response:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "songId": "uuid",
  "completionPercent": "number",
  "maxTempoBpm": "number | null",
  "lastPracticedAt": "ISO 8601 datetime | null",
  "practiceCount": "number"
}
```

**Errors:**
- `400`: Invalid progress ID format
- `401`: Not authenticated
- `404`: Progress not found

**Example:**
```bash
curl /api/progress/abc-123-def
```

---

#### PUT /progress/:id

Update a progress entry.

**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | uuid | Progress ID |

**Request Body:**
```json
{
  "completionPercent": "number (optional, 0-100)",
  "maxTempoBpm": "number (optional, positive integer)",
  "lastPracticedAt": "ISO 8601 datetime (optional)",
  "practiceCount": "number (optional, non-negative integer)"
}
```

**Response:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "songId": "uuid",
  "completionPercent": "number",
  "maxTempoBpm": "number | null",
  "lastPracticedAt": "ISO 8601 datetime | null",
  "practiceCount": "number"
}
```

**Errors:**
- `400`: Invalid ID format, invalid field values, no valid fields to update
- `401`: Not authenticated
- `404`: Progress not found

**Example:**
```bash
curl -X PUT /api/progress/abc-123-def \
  -H "Content-Type: application/json" \
  -d '{"completionPercent": 50, "maxTempoBpm": 120}'
```

---

#### DELETE /progress/:id

Delete a progress entry.

**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | uuid | Progress ID |

**Response:**
```json
{
  "message": "Progress deleted",
  "id": "uuid"
}
```

**Errors:**
- `400`: Invalid progress ID format
- `401`: Not authenticated
- `404`: Progress not found

**Example:**
```bash
curl -X DELETE /api/progress/abc-123-def
```

---

#### PUT /progress/:songId

Upsert (create or update) progress for a specific song.

**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `songId` | uuid | Song ID |

**Request Body:**
```json
{
  "completionPercent": "number (optional, 0-100)",
  "maxTempoBpm": "number (optional, positive integer)",
  "lastPracticedAt": "ISO 8601 datetime (optional)",
  "practiceCount": "number (optional, non-negative integer)"
}
```

**Response:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "songId": "uuid",
  "completionPercent": "number",
  "maxTempoBpm": "number | null",
  "lastPracticedAt": "ISO 8601 datetime | null",
  "practiceCount": "number"
}
```

**Errors:**
- `400`: Invalid songId format, invalid field values
- `401`: Not authenticated

**Example:**
```bash
curl -X PUT /api/progress/abc-123-def \
  -H "Content-Type: application/json" \
  -d '{"completionPercent": 75}'
```

---

### Instruments

#### GET /instruments

List available instruments.

**Authentication:** Not required

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number |
| `limit` | number | No | 20 | Items per page (max: 100) |
| `type` | string | No | - | Filter: `guitar`, `bass`, `piano`, `violin` |

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "type": "guitar | bass | piano | violin",
      "tuning": ["string"] | null,
      "stringCount": "number | null",
      "fretCount": "number | null",
      "isDefault": "boolean"
    }
  ],
  "total": "number",
  "page": "number",
  "limit": "number"
}
```

**Errors:**
- `400`: Invalid type value

**Example:**
```bash
curl "/api/instruments?type=guitar"
```

---

#### GET /instruments/:id

Get a specific instrument by ID.

**Authentication:** Not required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | uuid | Instrument ID |

**Response:**
```json
{
  "id": "uuid",
  "name": "string",
  "type": "string",
  "tuning": ["string"] | null,
  "stringCount": "number | null",
  "fretCount": "number | null",
  "isDefault": "boolean"
}
```

**Errors:**
- `400`: Invalid instrument ID format
- `404`: Instrument not found

**Example:**
```bash
curl /api/instruments/abc-123-def
```

---

#### DELETE /instruments/:id

Delete an instrument.

**Authentication:** Not required (consider adding auth in production)

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | uuid | Instrument ID |

**Response:**
```json
{
  "message": "Instrument deleted",
  "id": "uuid"
}
```

**Errors:**
- `400`: Invalid instrument ID format
- `404`: Instrument not found
- `409`: Cannot delete (referenced by sessions or goals)

**Example:**
```bash
curl -X DELETE /api/instruments/abc-123-def
```

---

### Music Theory

#### GET /scales

List music scales.

**Authentication:** Not required

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number |
| `limit` | number | No | 20 | Items per page (max: 100) |
| `category` | string | No | - | Filter by category |

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "intervals": [0, 2, 4, 5, 7, 9, 11],
      "category": "string",
      "description": "string"
    }
  ],
  "total": "number",
  "page": "number",
  "limit": "number"
}
```

**Errors:**
- `400`: Invalid page/limit values

**Example:**
```bash
curl "/api/scales?category=major"
```

---

#### GET /scales/:id

Get a specific scale by ID.

**Authentication:** Not required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | uuid | Scale ID |

**Response:**
```json
{
  "id": "uuid",
  "name": "string",
  "intervals": [0, 2, 4, 5, 7, 9, 11],
  "category": "string",
  "description": "string"
}
```

**Errors:**
- `400`: Invalid scale ID format
- `404`: Scale not found

**Example:**
```bash
curl /api/scales/abc-123-def
```

---

#### GET /chords

List music chords.

**Authentication:** Not required

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number |
| `limit` | number | No | 20 | Items per page (max: 100) |
| `instrumentType` | string | No | - | Filter: `guitar`, `bass`, `piano`, `violin` |

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "symbol": "string",
      "intervals": [0, 4, 7],
      "voicings": {"position": [[fret, string], ...]} | null,
      "instrumentType": "guitar | bass | piano | violin | null"
    }
  ],
  "total": "number",
  "page": "number",
  "limit": "number"
}
```

**Errors:**
- `400`: Invalid instrumentType value

**Example:**
```bash
curl "/api/chords?instrumentType=guitar"
```

---

#### GET /chords/:id

Get a specific chord by ID.

**Authentication:** Not required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | uuid | Chord ID |

**Response:**
```json
{
  "id": "uuid",
  "name": "string",
  "symbol": "string",
  "intervals": [0, 4, 7],
  "voicings": {"position": [[fret, string], ...]} | null,
  "instrumentType": "string | null"
}
```

**Errors:**
- `400`: Invalid chord ID format
- `404`: Chord not found

**Example:**
```bash
curl /api/chords/abc-123-def
```

---

### Ear Training

#### GET /ear-training

List user's ear training scores.

**Authentication:** Required

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `type` | string | No | - | Filter: `intervals`, `notes` |
| `limit` | number | No | 20 | Max results (max: 50) |

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "exerciseType": "intervals | notes",
      "correct": "number",
      "total": "number",
      "settings": "object | null",
      "createdAt": "ISO 8601 datetime"
    }
  ]
}
```

**Errors:**
- `400`: Invalid type value
- `401`: Not authenticated

**Example:**
```bash
curl "/api/ear-training?type=intervals&limit=10"
```

---

#### POST /ear-training

Save an ear training exercise score.

**Authentication:** Required

**Request Body:**
```json
{
  "exerciseType": "intervals | notes (required)",
  "correct": "number (required, non-negative integer)",
  "total": "number (required, positive integer)",
  "settings": "object (optional)"
}
```

**Response:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "exerciseType": "string",
  "correct": "number",
  "total": "number",
  "settings": "object | null",
  "createdAt": "ISO 8601 datetime"
}
```

**Errors:**
- `400`: Invalid exerciseType, invalid correct/total values
- `401`: Not authenticated

**Example:**
```bash
curl -X POST /api/ear-training \
  -H "Content-Type: application/json" \
  -d '{
    "exerciseType": "intervals",
    "correct": 8,
    "total": 10,
    "settings": {"difficulty": "hard"}
  }'
```

---

### Stats

#### GET /stats/weekly

Get weekly practice statistics (last 14 days).

**Authentication:** Required

**Response:**
```json
[
  {
    "date": "2024-01-01",
    "totalMinutes": 45,
    "sessionCount": 2
  },
  {
    "date": "2024-01-02",
    "totalMinutes": 0,
    "sessionCount": 0
  }
]
```

**Notes:**
- Returns exactly 14 days of data
- Missing days are filled with zero values
- Dates are in `YYYY-MM-DD` format

**Errors:**
- `401`: Not authenticated

**Example:**
```bash
curl /api/stats/weekly
```

---

#### GET /stats/heatmap

Get practice heatmap data (last 90 days).

**Authentication:** Required

**Response:**
```json
[
  {
    "date": "2024-01-01",
    "totalMinutes": 45,
    "sessionCount": 2
  },
  {
    "date": "2024-01-05",
    "totalMinutes": 30,
    "sessionCount": 1
  }
]
```

**Notes:**
- Returns only days with practice sessions (no zero-filling)
- Covers the last 90 days
- Dates are in `YYYY-MM-DD` format

**Errors:**
- `401`: Not authenticated

**Example:**
```bash
curl /api/stats/heatmap
```

---

### Streaks

#### GET /streaks

Get user's practice streak information.

**Authentication:** Required

**Response:**
```json
{
  "currentStreak": "number (days)",
  "longestStreak": "number (days)",
  "lastPracticeDate": "YYYY-MM-DD | null",
  "practicedToday": "boolean"
}
```

**Errors:**
- `401`: Not authenticated
- `404`: User not found

**Example:**
```bash
curl /api/streaks
```

---

### Metronome Presets

#### GET /metronome-presets

List user's metronome presets.

**Authentication:** Required

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number |
| `limit` | number | No | 20 | Items per page (max: 100) |

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "name": "string",
      "tempoBpm": "number",
      "beatsPerMeasure": "number",
      "beatUnit": "number",
      "accentPattern": [true, false, false, false] | null,
      "subdivision": "number"
    }
  ],
  "total": "number",
  "page": "number",
  "limit": "number"
}
```

**Errors:**
- `401`: Not authenticated

**Example:**
```bash
curl "/api/metronome-presets?page=1"
```

---

#### POST /metronome-presets

Create a new metronome preset.

**Authentication:** Required

**Request Body:**
```json
{
  "name": "string (required)",
  "tempoBpm": "number (required, positive integer)",
  "beatsPerMeasure": "number (optional, positive integer, default: 4)",
  "beatUnit": "number (optional, positive integer, default: 4)",
  "accentPattern": [boolean] (optional),
  "subdivision": "number (optional, positive integer, default: 1)"
}
```

**Response:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "name": "string",
  "tempoBpm": "number",
  "beatsPerMeasure": "number",
  "beatUnit": "number",
  "accentPattern": [boolean] | null,
  "subdivision": "number"
}
```

**Errors:**
- `400`: Missing required fields, invalid number values
- `401`: Not authenticated

**Example:**
```bash
curl -X POST /api/metronome-presets \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Waltz Practice",
    "tempoBpm": 90,
    "beatsPerMeasure": 3,
    "beatUnit": 4,
    "accentPattern": [true, false, false],
    "subdivision": 2
  }'
```

---

#### PUT /metronome-presets/:id

Update a metronome preset.

**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | uuid | Preset ID |

**Request Body:**
```json
{
  "name": "string (optional)",
  "tempoBpm": "number (optional, positive integer)",
  "beatsPerMeasure": "number (optional, positive integer)",
  "beatUnit": "number (optional, positive integer)",
  "accentPattern": [boolean] (optional),
  "subdivision": "number (optional, positive integer)"
}
```

**Response:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "name": "string",
  "tempoBpm": "number",
  "beatsPerMeasure": "number",
  "beatUnit": "number",
  "accentPattern": [boolean] | null,
  "subdivision": "number"
}
```

**Errors:**
- `400`: Invalid ID format, invalid field values, no valid fields to update
- `401`: Not authenticated
- `404`: Preset not found

**Example:**
```bash
curl -X PUT /api/metronome-presets/abc-123-def \
  -H "Content-Type: application/json" \
  -d '{"tempoBpm": 120}'
```

---

#### DELETE /metronome-presets/:id

Delete a metronome preset.

**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | uuid | Preset ID |

**Response:**
```json
{
  "message": "Metronome preset deleted",
  "id": "uuid"
}
```

**Errors:**
- `400`: Invalid preset ID format
- `401`: Not authenticated
- `404`: Preset not found

**Example:**
```bash
curl -X DELETE /api/metronome-presets/abc-123-def
```

---

### Account

#### GET /account

Get the current user's account information.

**Authentication:** Required

**Response:**
```json
{
  "id": "uuid",
  "email": "string",
  "username": "string",
  "name": "string",
  "avatarUrl": "string | null",
  "currentStreak": "number",
  "longestStreak": "number",
  "lastPracticeDate": "YYYY-MM-DD | null",
  "createdAt": "ISO 8601 datetime",
  "updatedAt": "ISO 8601 datetime"
}
```

**Errors:**
- `401`: Not authenticated

**Example:**
```bash
curl /api/account
```

---

#### PUT /account/profile

Update user profile information.

**Authentication:** Required

**Request Body:**
```json
{
  "email": "string (optional, valid email format)",
  "username": "string (optional, 3-30 chars, alphanumeric + underscore)",
  "name": "string (optional, 1-50 chars)"
}
```

**Notes:**
- At least one field is required
- Email and username must be unique

**Response:**
```json
{
  "id": "uuid",
  "email": "string",
  "username": "string",
  "name": "string",
  "avatarUrl": "string | null",
  "createdAt": "ISO 8601 datetime",
  "updatedAt": "ISO 8601 datetime"
}
```

**Errors:**
- `400`: No fields provided, invalid email format, invalid username format/name length
- `401`: Not authenticated
- `409`: Email or username already in use

**Example:**
```bash
curl -X PUT /api/account/profile \
  -H "Content-Type: application/json" \
  -d '{"email": "newemail@example.com"}'
```

---

#### POST /account/change-password

Change the user's password.

**Authentication:** Required

**Request Body:**
```json
{
  "currentPassword": "string (required)",
  "newPassword": "string (required, min 8 characters)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Errors:**
- `400`: Missing required fields, new password too short
- `401`: Current password incorrect
- `404`: User not found

**Example:**
```bash
curl -X POST /api/account/change-password \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "oldpass123",
    "newPassword": "newsecurepass456"
  }'
```

---

#### DELETE /account

Delete the user's account.

**Authentication:** Required

**Request Body:**
```json
{
  "confirmation": "DELETE (required, must be exactly this string)"
}
```

**Notes:**
- Account deletion cascades to related records (sessions, goals, progress, etc.)
- Authentication cookie is cleared after deletion

**Response:**
```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

**Errors:**
- `400`: Missing or incorrect confirmation
- `401`: Not authenticated
- `500`: Failed to delete account

**Example:**
```bash
curl -X DELETE /api/account \
  -H "Content-Type: application/json" \
  -d '{"confirmation": "DELETE"}'
```

---

## Error Response Format

All API errors follow a standardized format:

```json
{
  "statusCode": 400,
  "message": "Error message describing what went wrong",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "details": {
    "field": ["error message for this field"]
  }
}
```

### Common HTTP Status Codes

| Code | Description |
|------|-------------|
| `200` | Success |
| `400` | Bad Request - Invalid input or missing required fields |
| `401` | Unauthorized - Authentication required or invalid token |
| `403` | Forbidden - Access denied |
| `404` | Not Found - Resource does not exist |
| `409` | Conflict - Resource already exists or foreign key constraint |
| `500` | Internal Server Error |

### Validation Error Details

For validation errors (400), the response may include a `details` object with field-specific errors:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "details": {
    "email": ["Invalid email format"],
    "username": ["Username must be between 3 and 30 characters"]
  }
}
```

---

## Pagination

All list endpoints support pagination with consistent parameters:

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `page` | number | 1 | - | Page number (1-indexed) |
| `limit` | number | 20 | 100 | Items per page |

### Pagination Response

```json
{
  "data": [...],
  "total": 150,
  "page": 1,
  "limit": 20
}
```

---

## Filtering and Search

### Common Filter Patterns

1. **Exact Match Filters**: `instrumentId`, `songId`, `type`, `isActive`
2. **Date Range Filters**: `startDate`, `endDate`
3. **Enum Filters**: `difficulty`, `instrumentType`
4. **Text Search**: `search` (case-insensitive, searches multiple fields)

### Example Filter Combinations

```bash
# Sessions by instrument in date range
curl "/api/sessions?instrumentId=abc-123&startDate=2024-01-01&endDate=2024-01-31"

# Songs with search and filters
curl "/api/songs?search=beatles&difficulty=intermediate&instrumentType=guitar"

# Active goals only
curl "/api/goals?isActive=true"
```

---

## Rate Limiting

Currently, the API does not implement rate limiting. In production environments, consider adding rate limiting to prevent abuse.

---

## UUID Format

All resource IDs use UUID format:
```
xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

Example: `550e8400-e29b-41d4-a716-446655440000`

Invalid UUID formats will result in `400 Bad Request` errors.

---

## Date/Time Format

All dates and times use ISO 8601 format:
- Full datetime: `2024-01-15T10:30:00.000Z`
- Date only: `2024-01-15`

---

## Notes

1. **Authentication**: Most endpoints require authentication. Always check the "Authentication" field for each endpoint.

2. **Cascade Deletes**: Deleting a user cascades to all related records. Deleting instruments may fail if referenced by sessions or goals.

3. **Automatic Updates**: Creating practice sessions automatically updates:
   - User streaks
   - Song progress (if songId provided)

4. **Unique Constraints**: Email and username must be unique across all users.

5. **Default Values**: Many fields have sensible defaults. Check the schema for each endpoint.
