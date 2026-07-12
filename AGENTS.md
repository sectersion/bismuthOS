# GlacierOS Agent Guide

## Overview
GlacierOS is a web-based operating system that provides a desktop-like interface in the browser, featuring windowed applications, a taskbar, start menu, and various built-in tools. It consists of three main parts:
- **glacier-client**: The main Next.js-based client OS interface
- **glacier-server**: A Node.js/Express server that serves the client and provides Ultraviolet proxy for unblocked browsing
- **glacier-quadpad**: A separate Next.js app for web development preview (HTML/CSS/JS live editor)

## Directory Structure
```
.
├── glacier-client/          # Main OS client (Next.js app)
├── glacier-quadpad/         # Quadpad web dev tool (Next.js app)
├── glacier-server/          # Node.js/Express server
├── insert-snippets.js       # Script to inject required scripts into built client
└── setup.sh                 # Deployment script (clones repo and starts server)
```

## Essential Commands

### Development
- **Client (glacier-client)**: `npm run dev` (starts Next.js dev server on localhost:3000)
- **Quadpad (glacier-quadpad)**: `npm run dev` (starts Next.js dev server on localhost:3001)
- **Server (glacier-server)**: `npm run dev` (starts Express server with nodemon on localhost:8080)

### Building for Production
1. **Client**: 
   - `cd glacier-client && npm run build`
   - Output: `.next` directory (use`glacier-client/out` (exported static site)
2. **Quadpad** (if needed):
   - `cd glacier-quadpad && npm run build`
   - Output: `glacier-quadpad/out`

### Deployment
1. Build the client as above
2. Copy all contents from `glacier-client/out` to `glacier-server/client/` (overwrite existing)
3. Run `node insert-snippets.js` from the project root to inject required scripts into `glacier-server/client/index.html`
4. Start the server: `cd glacier-server && npm start`

> **Note**: The `setup.sh` automates deployment by cloning the repository and starting the server.

## Code Organization and Architecture

### Client (glacier-client)
- **app/**: Next.js app directory (using app router)
  - `layout.tsx`: Root layout (sets metadata, includes SelectedStyle component)
  - `page.tsx`: Main home page (renders the OS desktop)
  - `windows/`: Individual window applications (each as a React component)
  - `components/`: Shared UI components (Window, Taskbar, StartMenu, etc.)
  - `utils/`: Utility functions and helpers (AppListHelper, XOR, etc.)
  - `themes/`: Theme JSON files (Fluid UI themes)
  - `css/`: Global stylesheets (windows.css, live.css, etc.)

### Server (glacier-server)
- **src/index.js**: Main server entry point
  - Serves static files from `./client` (built client) and `./quadpad` (built quadpad)
  - Proxy endpoints for Ultraviolet (`/uv/`), Epoxy (`/epoxy/`), Bare module (`/bareasmodule/`), etc.
  - WebSocket upgrades for WISP (`/wisp/`) and BareServer (`/bare/`)
  - Firebase functions exports for serverless deployment
- **client/**: Directory where the built client is placed (not in repo, generated during build)
- **quadpad/**: Directory where the built quadpad is placed (not in repo, generated during build)

### Quadpad (glacier-quadpad)
Similar structure to client but focused on web development tools:
- Provides a split-screen HTML/CSS/JS editor with live preview
- Accessible via `glacier://quadpad` URL scheme handled by the client

## Naming Conventions and Style Patterns

### Components
- **PascalCase** for React components (e.g., `Window`, `Taskbar`, `StartMenu`)
- **Descriptive names** indicating purpose
- Components that wrap children often accept a `children` prop

### Hooks
- **camelCase** with `use` prefix (e.g., `useLocalStorage`, `useOnlineStatus`, `useStartMenuAnimations`)
- Custom hooks encapsulate reusable stateful logic

### Context
- **PascalCase** with `Context` suffix (e.g., `HydraContext`, `QuadpadContext`, `SyntaxpadContext`)
- Provided via React Context API for global state (theme, app state, etc.)

### Utilities
- **camelCase** (e.g., `AppListHelper`, `FavoriteAppHelper`, `XOR`, `doStuff`)
- Often export helper functions and constants

### Styling
- **CSS Modules** or **global CSS** (files in `src/app/` like `windows.css`, `live.css`)
- **Fluent UI** components for UI elements (Buttons, Dropdowns, etc.)
- **Theme switching** via context and CSS variables
- **Window styling**: Each window can have color variants (`glass`, `gray`, `black`, `white`, `onedarkbg`)

### URL Schemes
The client uses custom URL schemes handled via the Ultraviolet proxy:
- `glacier://*` routes to internal apps (e.g., `glacier://syntaxpad`, `glacier://quadpad`)
- These are intercepted by the client's routing logic

## Important Gotchas and Non-Obvious Patterns

### Build Process
1. The client is a Next.js app that must be **exported as static** (`next export`) to work when served from the Express server.
2. After building, the entire `out` directory must be copied to `glacier-server/client/`.
3. The `insert-snippets.js` script is **critical** - it injects several script tags into the built `index.html`:
   - BareMux client (`/baremux/index.js`)
   - Ultraviolet bundle (`/uv/uv.bundle.js`) and config (`/uv/uv.config.js`)
   - Enigma service worker (`/enigma/register-sw.js`)
   - Search and index scripts (`/search.js`, `/index.js`)
   Without these scripts, UV proxying and other functionality will not work.

### App Registration
- New apps/games are added by editing `glacier-client/public/applist.json`
- Each entry requires:
  - `name`: Display name in app launcher
  - `image`: Icon URL (square aspect ratio recommended)
  - `description`: 1-2 sentence description
  - `url`: Target URL (can be external or internal `glacier://` scheme)
  - `category`: Comma-separated list; must include at least one of: `"Apps"`, `"Games"`, `"VMS"`, `"VMP"`, `"Devtools"` to appear in the Store
  - `unblock`: Boolean; `false` disables UV bypass mechanisms (use for internal apps)

### Window Creation
- All windows should use the `Window` component from `src/app/components/Window.tsx`
- Key props:
  - `id`: Unique identifier (used for z-index and taskbar)
  - `title`: Window title
  - `taskbarIconID`: Should match `id` for taskbar synchronization
  - `children`: Window content
  - Optional: `color`, `defaultPosition`, `defaultSize`, `minSize`, `defaultMaximized`
- Windows automatically handle dragging, resizing, maximization, and z-index management

### State Management
- **App list**: Managed via `AppListHelper` (singleton pattern with `apps` array)
  - Loads `/applist.json` on first access
  - Provides helpers: `getApps()`, `getWithName()`, `getWithCategory()`, etc.
- **Favorites**: Managed via `FavoriteAppHelper` and `useFavorites` hook
- **Themes**: Manulated via context providers (`ThemeMakerApp` computes themes, `setTheme` updates)

### UltraViolet (UV) Integration
- The server proxies UV resources under `/uv/` (from `@titaniumnetwork-dev/ultraviolet`)
- The client must load UV's JavaScript bundle and config (injected by `insert-snippets.js`)
- Internal URLs use `glacier://` scheme which the client intercepts and proxies through UV
- The `IsUV` utility (`src/app/utils/IsUV.tsx`) provides a React hook to check UV availability

### CSS Isolation
- Each window can have its own CSS file (e.g., `terminal.css`, `calculator.css`)
- These are imported in the window component file
- Global styles (like window chrome) are in `windows.css`

## Testing Approach
No automated tests were found in the repository. Development appears to rely on manual testing via:
- `npm run dev` for each package
- Visual inspection of UI and functionality
- Testing deployed instances via the provided hosting options (Replit, CodeSandbox, etc.)

## Additional Notes
- The server uses `@titaniumnetwork-dev/ultraviolet` for proxying, requiring specific resource injection
- The client uses `next/image` for image optimization (requires proper loader configuration when exporting)
- Environment variables are used for Firebase functions and other services (see `.firebaserc`, `firebase.json`)
- The project uses TypeScript for the client and JavaScript for the server
- Polyfills are included for older browser compatibility (see `js-interpreter`, `js-yaml` dependencies)