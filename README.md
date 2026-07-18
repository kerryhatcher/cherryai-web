# cherryai-web

CherryAI web SPA — Vite + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui. iOS-installable PWA with offline support.

## What It Is

A modern, single-page web application for chatting with the CherryAI backend AI agent. Built for responsiveness and resilience:

- **Framework**: Vite + React 19 + TypeScript + Tailwind CSS v4
- **UI Components**: shadcn/ui (customizable Radix UI + Tailwind)
- **Progressive Web App**: Installable on iOS home screen via `vite-plugin-pwa`
- **Offline Mode**: Caches recent sessions and message history; displays cached data when the API is unreachable
- **Deployment**: Static bundle — deployable to any static host (S3, Vercel, Netlify, etc.)

### Features

- **Session Management**: Create, switch between, and view recent chat sessions
- **Streaming Responses**: Real-time token streaming from the backend via Server-Sent Events (SSE)
- **Tool Indicators**: Visual feedback showing when the agent is using web search, web fetch, or memory recall
- **Graceful Degradation**: When offline, view cached sessions and message history (read-only); send/receive disabled
- **Responsive Design**: Works seamlessly on desktop and mobile (iOS Safari especially)

## Setup and Running

### Prerequisites

- **Node.js 18+** (for npm)
- **CherryAI API running** on `http://localhost:8000` (or configured via `VITE_API_URL`)

### Installation

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Start the development server:**

   ```bash
   npm run dev
   ```

   Open `http://localhost:5173` in your browser. Hot-module reloading enables instant updates as you modify code.

3. **Build for production:**

   ```bash
   npm run build
   ```

   Outputs a static bundle to `dist/` (TypeScript-checked, minified, optimized).

4. **Preview the production build:**

   ```bash
   npm run preview
   ```

## Configuration

### API Endpoint

By default, the app expects the API at `http://localhost:8000`. To use a different endpoint:

1. Create a `.env.local` file in the project root:

   ```env
   VITE_API_URL=https://api.example.com
   ```

2. Restart the dev server or rebuild.

The app reads `VITE_API_URL` at build time and embeds it into the bundle.

## Code Structure

```
src/
├── api/
│   ├── client.ts        # HTTP client for all API calls
│   ├── sse.ts           # SSE (Server-Sent Events) parser for streaming responses
│   └── errors.ts        # Structured API error types
├── lib/
│   ├── config.ts        # Runtime configuration (API URL)
│   ├── offlineCache.ts  # localStorage-based session/message caching
│   └── utils.ts         # Utility functions
├── hooks/
│   ├── useApiStatus.ts  # Detects API availability (online/offline)
│   ├── useSessions.ts   # Session list fetching and creation
│   └── useMessages.ts   # Message history and sending
├── types/
│   └── index.ts         # TypeScript definitions for API data types
├── components/
│   ├── ui/              # shadcn/ui components (buttons, inputs, etc.)
│   ├── ChatWindow.tsx   # Main chat message thread display
│   ├── MessageInput.tsx # User input composer (disabled when offline)
│   ├── SessionList.tsx  # Sidebar session switcher
│   └── ...
├── App.tsx              # Root component with online/offline UI
├── main.tsx             # React entry point
└── index.css            # Global styles (Tailwind directives)
```

### Key Modules

- **`api/client.ts`**: All-in-one HTTP client wrapping the CherryAI API. Handles errors, retries, and offline detection.
- **`api/sse.ts`**: Parses Server-Sent Events from the message streaming endpoint. Yields individual tokens and a completion marker.
- **`lib/offlineCache.ts`**: Transparently caches the sessions list and last ~50 messages per session in `localStorage` on every successful API call. When offline, reads from cache.
- **`hooks/`**: Custom React hooks encapsulating data fetching and state management for sessions, messages, and API status.
- **`components/ChatWindow.tsx`**: Displays the message thread with streaming response support (tokens appear in real-time).
- **`components/MessageInput.tsx`**: Composer with send button. Disabled when offline. Shows typing indicator during streaming.

## Progressive Web App (PWA)

The app is configured as a PWA via `vite-plugin-pwa` and `public/manifest.json`.

### Install on iOS

1. Open the app in Safari on an iPhone
2. Tap the **Share** button
3. Select **Add to Home Screen**
4. Confirm the name and icon

The app will open full-screen and feel like a native app. The service worker enables offline functionality.

### Offline Behavior

When the API becomes unreachable:

1. **Offline banner appears** at the top of the UI
2. **Session list** shows cached recent sessions
3. **Message history** displays cached messages (read-only)
4. **Message composer** is disabled (users see: "Offline — unable to send messages")
5. **No new API calls** are attempted (to conserve bandwidth)

Once the API comes back online, normal functionality resumes.

## Building and Deployment

### Local Build

```bash
npm run build
```

Creates:
- `dist/index.html` — Entry point
- `dist/assets/` — JavaScript, CSS, images (with cache-busting hashes)
- `dist/manifest.json` — PWA manifest
- `dist/service-worker.js` — Service worker for offline support

### Deploy to Static Host

The `dist/` folder is completely static and can be deployed to:

- **AWS S3** + CloudFront
- **Vercel** (drag-and-drop)
- **Netlify** (drag-and-drop or git push)
- **GitHub Pages**
- Any static web server (nginx, Apache, etc.)

**Important:** Ensure your host serves all routes to `index.html` for client-side routing (SPA behavior).

## Development

### Code Quality

Lint code before committing:

```bash
npm run lint
```

Fixes most issues automatically.

### Styling

The app uses **Tailwind CSS v4** for all styling. Key files:

- `tailwind.config.ts` — Tailwind configuration
- `src/index.css` — Global styles and Tailwind directives
- Components use `className="..."` with Tailwind utility classes and shadcn/ui classes

To customize colors or spacing, edit `tailwind.config.ts`.

### TypeScript

The project is strictly typed:

```bash
npm run build  # Runs TypeScript compiler before Vite build
```

TypeScript errors will prevent the build from succeeding, ensuring type safety at build time.

## Related Documentation

- **[CherryAI Planning Repo](../README.md)** — Project requirements and architecture decisions
- **[cherryai-api README](../cherryai-api/README.md)** — FastAPI backend and API endpoints
- **[Demo Design Spec](../docs/superpowers/specs/2026-07-18-cherryai-demo-design.md)** — Detailed design and execution plan for the working demo

## License

TBD
