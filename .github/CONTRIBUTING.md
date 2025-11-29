# Contributing to Inventory Analytics Suite

Thank you for your interest in contributing to the Inventory Analytics Suite! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## How to Contribute

### Reporting Bugs

Before submitting a bug report:
1. Check the [existing issues](https://github.com/blasthappy82/Inventory_Analytics_Suite/issues) to avoid duplicates
2. Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md)

Include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Browser and OS information
- Sample data (if applicable)

### Suggesting Features

We welcome feature suggestions! Please:
1. Check existing issues and discussions first
2. Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.md)
3. Explain the use case and expected benefit

### Pull Requests

1. Fork the repository
2. Create a feature branch from `main`
3. Make your changes
4. Test thoroughly
5. Submit a pull request

#### Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/Inventory_Analytics_Suite.git
cd Inventory_Analytics_Suite

# Install dependencies
npm install

# Start development server
npm run dev
```

The app runs at `http://localhost:5000`.

#### Code Style

- Use TypeScript for all new code
- Follow existing code patterns and conventions
- Use meaningful variable and function names
- Add comments for complex calculations
- Keep functions focused and small

#### Testing Changes

Before submitting:
1. Test both calculators (Buffer and Reverse TRR)
2. Verify calculations with known test cases
3. Check responsive design on different screen sizes
4. Ensure no console errors

#### Commit Messages

Use clear, descriptive commit messages:
- `feat: add CSV import functionality`
- `fix: correct MASE calculation for edge cases`
- `docs: update calculation methodology`
- `refactor: simplify Monte Carlo simulation`

### Documentation

Improvements to documentation are always welcome:
- Fix typos or unclear explanations
- Add examples
- Update outdated information
- Improve mathematical explanations

## Project Structure

```
client/src/
├── components/     # UI components
├── lib/
│   ├── inventory-math.ts  # Core calculations
│   └── utils.ts           # Utilities
└── pages/
    └── home.tsx    # Main application
```

## Mathematical Contributions

When modifying statistical calculations:
1. Document the mathematical basis
2. Update [CALCULATIONS.md](../docs/CALCULATIONS.md)
3. Cite sources for formulas
4. Include test cases with expected results

## Questions?

- Open a [Discussion](https://github.com/blasthappy82/Inventory_Analytics_Suite/discussions)
- Check existing documentation in the `docs/` folder

## License

By contributing, you agree that your contributions will be licensed under the AGPL-3.0 License.
