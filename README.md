# Inventory Analytics Suite

An open-source inventory buffer calculator that determines optimal safety stock levels and Time to Reliable Replenishment (TRR) using statistical forecasting methods. All calculations run entirely in your browser - your data never leaves your device.

## Live Demo

Try the application online:

- **Netlify**: [buffercalculator.netlify.app](https://buffercalculator.netlify.app/)
- **GitHub Pages**: [blasthappy82.github.io/Inventory_Analytics_Suite](https://blasthappy82.github.io/Inventory_Analytics_Suite/)

## Features

### Buffer Calculator
Calculate optimal safety stock levels based on:
- Historical monthly demand data (1-48 months)
- Desired service level (50-99.9%)
- Supplier lead time
- Automatic demand pattern detection (Normal vs. Intermittent)

### Reverse TRR Calculator
Determine the maximum affordable lead time given:
- Current buffer/safety stock levels
- Historical demand patterns
- Target service level

## Statistical Methods

This application employs industry-standard statistical methods:

- **Croston's Method with SBA Correction**: For intermittent demand forecasting when zero-demand periods are present
- **Anderson-Darling Test**: Normality testing to determine appropriate forecasting method
- **Monte Carlo Simulation**: For complex demand patterns that don't fit normal distributions
- **Normal Distribution Analysis**: For regular demand patterns

See [docs/CALCULATIONS.md](docs/CALCULATIONS.md) for detailed mathematical documentation.

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/blasthappy82/Inventory_Analytics_Suite.git
cd Inventory_Analytics_Suite

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5000`.

### Building for Production

```bash
npm run build
```

The static files will be output to `dist/public/`.

## Deployment

This is a static website that can be deployed for free on various platforms:

### Netlify
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)

1. Connect your GitHub repository
2. Build command: `npm run build`
3. Publish directory: `dist/public`

See [netlify.toml](netlify.toml) for configuration.

### GitHub Pages

GitHub Actions workflow is included for automatic deployment:

1. Enable GitHub Pages in repository settings
2. Set source to "GitHub Actions"
3. Push to `main` branch to trigger deployment

See [.github/workflows/deploy.yml](.github/workflows/deploy.yml) for configuration.

### Manual Deployment

Build the project and upload the `dist/public/` directory to any static hosting service:
- Vercel
- Cloudflare Pages
- AWS S3 + CloudFront
- Any web server

## Architecture

The application is built as a pure client-side static website:

- **Frontend**: React + TypeScript + Vite
- **UI Components**: shadcn/ui + Radix UI + Tailwind CSS
- **Charts**: Recharts
- **Calculations**: Custom TypeScript implementations

All statistical calculations run in the browser. No backend server is required for production deployment.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed architecture documentation.

## Contributing

We welcome contributions! Please see [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

This means:
- You can use, modify, and distribute this software
- If you modify and distribute it, you must release your changes under the same license
- If you run a modified version as a network service, you must make the source code available to users

See [LICENSE](LICENSE) for the full license text.

## Privacy

All calculations are performed entirely in your browser. Your demand data never leaves your device and is never sent to any server. This application does not use cookies, analytics, or any form of tracking.

## Support

- **Issues**: [GitHub Issues](https://github.com/blasthappy82/Inventory_Analytics_Suite/issues)
- **Discussions**: [GitHub Discussions](https://github.com/blasthappy82/Inventory_Analytics_Suite/discussions)

## Acknowledgments

- Statistical methods based on established inventory management research
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Built with [Vite](https://vitejs.dev/) and [React](https://react.dev/)
