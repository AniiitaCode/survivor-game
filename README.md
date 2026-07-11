# 🧟 Survivor: Level Run

Survivor: Level Run is a fast-paced 2D action survival game inspired by Vampire Survivors. Control your character, maneuver around waves of relentless zombies, level up, shoot/slash enemies, and rise through the ranks of the global leaderboard!

Built as a lightweight, high-performance Single Page Application (SPA), it combines the simplicity of Vanilla JavaScript with the power of Supabase for backend services (Authentication, Database, and Row-Level Security).

---

## 🕹️ Project Description

Survivor: Level Run allows players to test their survival skills across 5 distinct levels (Back Alley, Rooftop Run, Subway Crossroads, Neon District, and Final Block). The core loop involves dodging, shooting, collecting scores, and surviving long enough to reach the next wave.

### User Roles & Capabilities

| Role | Capabilities |
| :--- | :--- |
| **Standard User (Survivor)** | <ul><li>Register a new account and log in securely.</li><li>Customize user profile (change username, set avatar URL).</li><li>Play the canvas-based game client across multiple maps/levels.</li><li>Save game runs and track performance history.</li><li>View aggregate personal statistics (games played, highest level, total kills, best score).</li><li>Compare achievements on the global leaderboard.</li></ul> |
| **Administrator (Commander)** | <ul><li>Access everything a Standard User can.</li><li>Access a protected **Admin Panel** (`/admin`) to inspect all registered profiles.</li><li>Manage security by toggling roles between `user` and `admin` or deleting user accounts.</li></ul> |

---

## 🏗️ Architecture

The project is structured as a decentralized, cloud-connected web application:

```
+-----------------------------------------------------------+
|                      FRONTEND (SPA)                       |
|  [Vanilla JS Router] -> [Bootstrap 5 & Custom CSS]        |
|  [Canvas 2D Render Engine] <-> [Input/Keyboard Listeners] |
+-----------------------------------------------------------+
                             |
                   HTTPS / WebSockets API
                             v
+-----------------------------------------------------------+
|                   BACKEND (Supabase BaaS)                 |
|  [Go / Netlify Auth Gateway (JWT)]                        |
|  [PostgreSQL Engine (RLS Secured)]                        |
+-----------------------------------------------------------+
```

### Frontend Technology Stack
- **Core Logic**: Vanilla JavaScript (ES Modules).
- **Routing**: A custom client-side router (`src/router.js`) handling dynamic URL parameters and route protection.
- **Styling**: Bootstrap 5.3.3 responsive utility classes mixed with stylized, cyberpunk-themed custom CSS layouts.
- **Game Engine**: HTML5 Canvas API utilizing custom sprite loaders, particle emitters, floating damage texts, camera shaking, and custom update loops.
- **Build Tooling**: Vite 5 for hot-module replacement (HMR), fast development bundling, and assets preloading.

### Backend & Database Stack
- **Database**: PostgreSQL hosted on Supabase.
- **Authentication**: Supabase Auth (JSON Web Token authentication with local session persistence).
- **Security Policy**: Row-Level Security (RLS) configured on every table to restrict write operations only to the respective authenticated account owners or administrators.

---

## 🗄️ Database Schema Design

The backend uses a standard PostgreSQL database containing four main schema tables, which interact directly with Supabase's internal `auth.users` authentication table.

### Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    auth_users {
        uuid id PK
        string email
    }
    profiles {
        uuid id PK "FK references auth.users(id)"
        string username UNIQUE
        string avatar_url
        string role "check(role in ('user', 'admin'))"
        timestamptz created_at
        timestamptz updated_at
    }
    game_sessions {
        uuid id PK
        uuid user_id FK "references auth.users(id)"
        integer score
        integer level_reached
        integer enemies_killed
        integer duration_seconds
        timestamptz created_at
    }
    leaderboards {
        uuid id PK
        uuid user_id FK "references auth.users(id)"
        integer score
        integer level
        string mode
        timestamptz created_at
    }
    user_statistics {
        uuid id PK
        uuid user_id UNIQUE "FK references auth.users(id)"
        integer games_played
        integer total_score
        integer best_score
        integer highest_level
        integer total_enemies_killed
        timestamptz created_at
        timestamptz updated_at
    }

    auth_users ||--|| profiles : "has profile"
    auth_users ||--|| user_statistics : "accumulates"
    auth_users ||--o{ game_sessions : "plays"
    auth_users ||--o{ leaderboards : "submits score"
```

### Table Definitions & Keys

1. **`profiles`**
   - Extends the core identity of `auth.users`.
   - `id` matches `auth.users(id)` (1-to-1 relationship, cascade delete).
   - Enforces unique usernames and defaults user roles to `user`.

2. **`game_sessions`**
   - Tracks detailed metrics for every game run attempted by survivors.
   - Links to `auth.users` via `user_id` (many-to-1 relationship).

3. **`leaderboards`**
   - Keeps high scores submitted by users to rank them globally.
   - Indexed by `score DESC` for rapid ranking queries.

4. **`user_statistics`**
   - Aggregates high-level metrics (e.g. lifetime kills, best level reached, games played) for each survivor.
   - Links to `auth.users` via a unique `user_id` constraint (1-to-1 relationship) to support rapid `upsert` queries.

---

## 📂 Key Folders & Files Structure

Below is an overview of the key file structure in this repository:

```text
survivor-game/
├── supabase/               # Backend database configuration
│   └── migrations/         # PostgreSQL schema definition & policies
├── src/                    # Source code
│   ├── assets/             # Game graphics, sprites & assets
│   ├── components/         # Common UI layout frameworks
│   ├── game/               # HTML5 Canvas 2D engine implementation
│   ├── lib/                # Client configurations (Supabase connection)
│   ├── pages/              # SPA page views (HTML/CSS/JS)
│   ├── services/           # Data services connecting frontend to Supabase
│   ├── main.js             # Main entry point (loads Bootstrap & router)
│   ├── router.js           # Client-side router & path guards
│   └── styles.css          # Global custom CSS rules
├── index.html              # Main HTML markup entry
├── package.json            # Node.js dependencies and scripts
└── vite.config.js          # Vite configurations (ports, proxy servers)
```

### File Manifest

| File / Folder | Purpose |
| :--- | :--- |
| **`supabase/migrations/`** | Contains SQL migrations (`001_create_profiles.sql` through `004_create_user_statistics.sql`) to recreate the tables, indexes, and RLS policies on the database. |
| **`src/assets/`** | Stores visual media files (like `player.jpg` and `zombie.jpg` sprites) loaded by the game engine. |
| **`src/components/layout.js`** | Renders the primary layout wrapping all pages (injects Header + Child View + Footer). |
| **`src/components/header.js`** | Navigation header tracking state change events (`auth:changed`) to render login/register or profile links. |
| **`src/game/config.js`** | Configures core canvas screen size and defines details (title, zombie count, speed multiplier) for all levels. |
| **`src/game/game.js`** | The main canvas client. Directs tick loops, keyboard event listeners, player animations, damage calculation, and collisions. |
| **`src/game/rendering.js`** | Logic for rendering elements onto the 2D canvas context (glowing grids, entities, shake offset, and overlay menus). |
| **`src/lib/supabase.js`** | Instantiates the `@supabase/supabase-js` client. Safely falls back to mock endpoints if API tokens are missing. |
| **`src/pages/`** | Implements the presentation views (like `/login`, `/register`, `/dashboard`, `/leaderboard`, `/profile`, `/statistics`, and `/admin`) with distinct styling rules. |
| **`src/services/`** | Handles communication with the Supabase API: saving game sessions (`gameSessionService.js`), saving leaderboard entries (`loaderboardService.js`), and aggregating metrics (`statisticService.js`). |

---

## 🚀 Local Development Setup Guide

Follow these steps to run the game and database services locally on your machine.

### Prerequisites
- **Node.js**: Version 18.x or higher installed.
- **npm**: Standard Package Manager.
- **Supabase Project**: A database project created in the [Supabase Dashboard](https://supabase.com).

### Step 1: Clone and Install
Open your terminal in the workspace directory and install all node dependencies:
```bash
npm install
```

### Step 2: Set Up Environment Variables
Create a file named `.env` in the root of the project (if it doesn't already exist) and populate it with your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anonymous-api-key
```

### Step 3: Run Database Migrations
Deploy the database schema on your Supabase project:
1. Go to your **Supabase Dashboard** -> **SQL Editor**.
2. Open the files in `supabase/migrations/` in numerical order:
   - `001_create_profiles.sql`
   - `002_create_game_sessions.sql`
   - `003_create_leaderboards.sql`
   - `004_create_user_statistics.sql`
3. Copy-paste the content of each file into the SQL Editor and click **Run**.
4. (Optional) If you are using the Supabase CLI, you can link your project and apply the migrations using:
   ```bash
   supabase login
   supabase link --project-ref your-project-id
   supabase db push
   ```

### Step 4: Run the Development Server
Launch the local Vite server:
```bash
npm run dev
```
The application will start running on **`http://localhost:3001`**. Open this URL in your web browser.

### Build for Production
To build optimization bundles for deployment:
```bash
npm run build
```
This produces a static output inside the `dist/` directory. You can preview this production build locally using:
```bash
npm run preview
```
This local server runs on **`http://localhost:4173`**.
