# Contributing to Inventory Analytics Suite

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [Making Changes](#making-changes)
5. [Submitting Changes](#submitting-changes)
6. [Coding Standards](#coding-standards)
7. [Testing](#testing)

---

## Code of Conduct

This project follows a standard open source code of conduct. Please be respectful and constructive in all interactions.

- Be welcoming and inclusive
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what's best for the community

---

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- Git

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/inventory-analytics-suite.git
   cd inventory-analytics-suite
   ```
3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/inventory-analytics-suite.git
   ```

---

## Development Setup

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5000`.

### Build for Production

```bash
npm run build
```

### Project Structure

```
├── client/src/
│   ├── components/ui/    # shadcn/ui components
│   ├── lib/              # Utility functions and calculations
│   ├── pages/            # Page components
│   └── App.tsx           # Application root
├── docs/                 # Documentation
└── package.json
```

---

## Making Changes

### Branch Naming

Create a descriptive branch name:

```bash
git checkout -b feature/add-new-calculator
git checkout -b fix/buffer-calculation-edge-case
git checkout -b docs/update-readme
```

### Commit Messages

Write clear, concise commit messages:

```
feat: add Monte Carlo simulation option
fix: correct buffer calculation for zero demand
docs: update installation instructions
refactor: simplify Croston's method implementation
test: add unit tests for normalCDF
```

Use these prefixes:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

---

## Submitting Changes

### Pull Request Process

1. **Update your fork** with the latest upstream changes:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Push your branch**:
   ```bash
   git push origin feature/your-feature
   ```

3. **Open a Pull Request** on GitHub with:
   - Clear title describing the change
   - Description of what changed and why
   - Screenshots for UI changes
   - Reference to related issues

4. **Respond to feedback** from reviewers

### Pull Request Checklist

- [ ] Code follows the project's coding standards
- [ ] Self-review completed
- [ ] No console errors or warnings
- [ ] Documentation updated if needed
- [ ] Commits are clean and well-described

---

## Coding Standards

### TypeScript

- Use strict TypeScript (no `any` types unless absolutely necessary)
- Define interfaces for data structures
- Use proper type annotations

```typescript
// Good
interface DemandData {
  values: number[];
  period: 'monthly' | 'weekly';
}

function calculateBuffer(data: DemandData): number {
  // ...
}

// Avoid
function calculateBuffer(data: any) {
  // ...
}
```

### React Components

- Use functional components with hooks
- Destructure props
- Use meaningful component names

```typescript
// Good
interface BufferResultProps {
  value: number;
  method: string;
}

export function BufferResult({ value, method }: BufferResultProps) {
  return (
    <div>
      <span>{method}</span>
      <span>{value}</span>
    </div>
  );
}
```

### CSS/Styling

- Use Tailwind CSS utilities
- Follow the existing color scheme
- Maintain responsive design

```tsx
// Good
<div className="flex flex-col gap-4 p-4 md:flex-row">
  {/* content */}
</div>
```

### Mathematical Code

When implementing statistical methods:

1. **Document the formula** in comments
2. **Include references** to papers or textbooks
3. **Handle edge cases** explicitly
4. **Use descriptive variable names**

```typescript
/**
 * Croston's method with SBA correction
 * Reference: Syntetos & Boylan (2001)
 * 
 * @param demands - Array of historical demand values
 * @param alpha - Smoothing constant (default 0.1)
 */
export function crostonSBA(demands: number[], alpha = 0.1): number {
  // Implementation...
}
```

---

## Testing

### Running Tests

```bash
npm test
```

### Writing Tests

When adding new features or fixing bugs, include tests:

```typescript
describe('crostonSBA', () => {
  it('returns correct forecast for intermittent demand', () => {
    const demands = [0, 5, 0, 0, 3, 0, 4, 0];
    const result = crostonSBA(demands);
    expect(result).toBeCloseTo(1.5, 1);
  });

  it('handles all-zero demand', () => {
    const demands = [0, 0, 0, 0];
    const result = crostonSBA(demands);
    expect(result).toBe(0);
  });
});
```

### Test Coverage

Aim for high coverage of:
- Core calculation functions
- Edge cases and error handling
- UI component rendering

---

## Areas for Contribution

### Good First Issues

Look for issues labeled `good first issue` for beginner-friendly tasks.

### Wanted Features

- Additional forecasting methods
- Data import/export functionality
- Visualization improvements
- Accessibility enhancements
- Performance optimizations
- Documentation improvements

### Bug Reports

When reporting bugs, include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Browser and OS information
- Screenshots if applicable

---

## License

By contributing, you agree that your contributions will be licensed under the GNU AGPL v3.0 license.

---

## Questions?

- Open a [GitHub Discussion](https://github.com/ORIGINAL_OWNER/inventory-analytics-suite/discussions)
- Check existing [Issues](https://github.com/ORIGINAL_OWNER/inventory-analytics-suite/issues)

Thank you for contributing!
