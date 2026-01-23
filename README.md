# React Web App Template

A modern React template with TypeScript, Tailwind CSS, and comprehensive tooling.

## Features

- **React 18** with TypeScript
- **Vite** for fast development and builds
- **Tailwind CSS** with CSS variable theming
- **Radix UI** + **CVA** component library
- **TanStack Query** for data fetching
- **React Router** for navigation
- **Vitest** for unit testing
- **Playwright** for E2E testing
- **Firebase Hosting** deployment
- **GitHub Actions** CI/CD

## Quick Start

1. **Clone and install**
   ```bash
   cp -r templates/react-web-app my-app
   cd my-app
   npm install
   ```

   Note: The `prepare` script will automatically set up Husky git hooks during installation.

2. **Start development server**
   ```bash
   npm run dev
   ```

3. **Run tests**
   ```bash
   npm test              # Unit tests
   npm run test:e2e      # E2E tests
   ```

## Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)

2. Install Firebase CLI
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

3. Update `.firebaserc` with your project ID

4. Deploy
   ```bash
   npm run deploy
   ```

## GitHub Actions Setup

Add these secrets to your repository:
- `FIREBASE_SERVICE_ACCOUNT`: Firebase service account JSON
- `FIREBASE_PROJECT_ID`: Your Firebase project ID

## Project Structure

```
src/
├── components/
│   ├── ui/           # UI primitives (Button, Input, etc.)
│   └── layout/       # Layout components
├── hooks/            # React Query hooks
├── lib/              # Utilities and API client
├── pages/            # Route components
├── App.tsx           # Router and providers
├── main.tsx          # Entry point
└── index.css         # Tailwind and theme
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview build |
| `npm test` | Run unit tests |
| `npm run test:e2e` | Run E2E tests |
| `npm run lint` | Lint code |
| `npm run typecheck` | Type check without emitting |
| `npm run deploy` | Deploy to Firebase |

## Development Workflow

### Pre-commit Hooks

This project uses [Husky](https://typicode.github.io/husky/) and [lint-staged](https://github.com/lint-staged/lint-staged) to automatically run checks before commits:

- **Type checking**: Runs `tsc --noEmit` on staged TypeScript files to catch type errors
- **Linting**: Runs ESLint with auto-fix on staged files

These checks help prevent type mismatches and style issues from reaching CI. If you need to bypass the hooks (not recommended), you can use:

```bash
git commit --no-verify
```

### Running Checks Manually

```bash
npm run typecheck  # Type check the entire codebase
npm run lint       # Lint the entire codebase
npm test           # Run all unit tests
```

## License

MIT
