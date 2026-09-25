# Contributing to PartyUp

Thank you for your interest in contributing to PartyUp! This document outlines the process for contributing to the project.

## 🤝 Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- Git
- Windows 10/11 (for development/testing)
- Rust toolchain (for native modules)

### Development Setup
```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/partyup.git
cd partyup

# Install dependencies
npm install

# Start development
npm run dev
```

## 🌿 Branching Strategy

- `main` - Stable releases only
- `develop` - Integration branch for features
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates
- `chore/*` - Maintenance tasks

## 📝 Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting, no code change
- `refactor` - Code restructuring
- `perf` - Performance improvement
- `test` - Adding tests
- `chore` - Maintenance
- `build` - Build system changes
- `ci` - CI/CD changes

Examples:
```
feat(steam): add depot downloader support
fix(torrent): resolve magnet link parsing issue
docs(readme): update installation instructions
refactor(emulator): simplify ROM scanning logic
```

## 🔧 Development Workflow

### 1. Create a Branch
```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

### 2. Make Changes
- Write code with tests
- Follow existing patterns
- Update documentation

### 3. Run Checks
```bash
npm run lint        # ESLint + Prettier
npm run typecheck   # TypeScript
npm run test        # Unit tests
```

### 4. Commit & Push
```bash
git add .
git commit -m "feat(scope): description"
git push origin feature/your-feature-name
```

### 5. Create Pull Request
- Target `develop` branch
- Fill out PR template
- Link related issues

## 📋 Pull Request Requirements

- [ ] Passes all CI checks
- [ ] Includes tests for new features
- [ ] Updates documentation if needed
- [ ] Follows code style
- [ ] No breaking changes (or clearly documented)
- [ ] Small, focused changes preferred

## 🎨 Code Style

### TypeScript/React
- Use functional components with hooks
- Prefer `interface` over `type` for objects
- Use strict TypeScript (`strict: true`)
- Destructure props in component parameters

### Naming
- Components: `PascalCase` (e.g., `GameCard.tsx`)
- Hooks: `useCamelCase` (e.g., `useGameStore.ts`)
- Utilities: `camelCase` (e.g., `formatPlaytime.ts`)
- Types: `PascalCase` (e.g., `Game`, `Torrent`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_CONNECTIONS`)

### CSS/SCSS
- Use CSS custom properties for theming
- Follow BEM-like naming for components
- Mobile-first responsive design
- Use Tailwind utilities where appropriate

## 🧪 Testing

### Unit Tests (Vitest)
```bash
npm run test           # Run once
npm run test:watch     # Watch mode
```

### E2E Tests (Playwright)
```bash
npm run test:e2e       # Run E2E tests
```

### Test Guidelines
- Test behavior, not implementation
- Use descriptive test names
- Mock external dependencies
- Aim for >80% coverage on new code

## 📚 Documentation

- Update `README.md` for user-facing changes
- Update `SPEC.md` for architectural changes
- Add JSDoc comments for public APIs
- Update inline comments for complex logic

## 🐛 Bug Reports

Use the [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.yml) and include:
- PartyUp version
- Windows version
- Steps to reproduce
- Expected vs actual behavior
- Logs (from `%APPDATA%\PartyUp\logs`)

## 💡 Feature Requests

Use the [Feature Request Template](.github/ISSUE_TEMPLATE/feature_request.yml) and include:
- Clear description of the feature
- Use cases / user stories
- Mockups or examples (if UI)
- Potential implementation approach

## 🎨 Themes & Plugins

### Creating Themes
1. Use the in-app Theme Editor
2. Export as JSON
3. Submit to Marketplace via PR

### Creating Plugins
1. Create plugin directory in `plugins/your-plugin/`
2. Add `manifest.json` and `index.js`
3. Follow [Plugin API Docs](docs/plugins.md)
4. Submit to Marketplace via PR

## 🔒 Security

- Report security vulnerabilities privately to security@PartyUp.app
- Do not open public issues for security bugs
- We follow responsible disclosure

## 🏷 Versioning

We use [Semantic Versioning](https://semver.org/):
- MAJOR - Breaking changes
- MINOR - New features (backward compatible)
- PATCH - Bug fixes (backward compatible)

## 📦 Release Process

1. Maintainers create release branch from `develop`
2. Version bump + changelog
3. CI builds and tests
4. GitHub Release with artifacts
5. Auto-update notification

---

## 💬 Getting Help

- **Discord**: [Join our server](https://discord.gg/PartyUp)
- **Discussions**: [GitHub Discussions](https://github.com/PartyUp/partyup/discussions)
- **Email**: dev@PartyUp.app

---

Thank you for contributing to PartyUp! 🎮
