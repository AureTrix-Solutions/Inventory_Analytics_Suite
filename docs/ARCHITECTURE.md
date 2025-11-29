# Architecture Documentation

## Overview

The Inventory Analytics Suite is a pure client-side static web application. All calculations run entirely in the browser, ensuring data privacy and enabling free hosting on static site platforms.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │  Buffer         │  │  Reverse TRR    │                   │
│  │  Calculator     │  │  Calculator     │                   │
│  └────────┬────────┘  └────────┬────────┘                   │
│           │                    │                             │
│           ▼                    ▼                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              Calculation Engine                          ││
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐              ││
│  │  │ Croston's │ │ Anderson- │ │ Monte     │              ││
│  │  │ Method    │ │ Darling   │ │ Carlo     │              ││
│  │  └───────────┘ └───────────┘ └───────────┘              ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              UI Components (shadcn/ui)                   ││
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐           ││
│  │  │ Forms  │ │ Charts │ │ Tabs   │ │ Cards  │           ││
│  │  └────────┘ └────────┘ └────────┘ └────────┘           ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
inventory-analytics-suite/
├── client/                    # Frontend application
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   └── ui/           # shadcn/ui components
│   │   ├── lib/
│   │   │   ├── inventory-math.ts  # Core calculation engine
│   │   │   └── utils.ts      # Utility functions
│   │   ├── pages/
│   │   │   └── home.tsx      # Main calculator page
│   │   ├── App.tsx           # Application root
│   │   └── main.tsx          # Entry point
│   └── index.html            # HTML template
├── docs/                      # Documentation
│   ├── ARCHITECTURE.md       # This file
│   ├── CALCULATIONS.md       # Mathematical documentation
│   └── CONTRIBUTING.md       # Contribution guidelines
├── .github/
│   └── workflows/
│       └── deploy.yml        # GitHub Pages deployment
├── netlify.toml              # Netlify configuration
├── package.json              # Dependencies
├── vite.config.ts            # Build configuration
└── README.md                 # Project overview
```

## Technology Stack

### Frontend Framework
- **React 19** - Component-based UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server

### UI Components
- **shadcn/ui** - High-quality component library
- **Radix UI** - Accessible primitive components
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - Charting library for visualizations

### Routing
- **wouter** - Lightweight client-side routing

## Core Modules

### Calculation Engine (`client/src/lib/inventory-math.ts`)

The calculation engine contains all statistical algorithms:

| Function | Purpose |
|----------|---------|
| `crostonSBA()` | Croston's method with SBA bias correction |
| `andersonDarling()` | Normality test for demand distribution |
| `normalCDF()` / `normalInverseCDF()` | Normal distribution functions |
| `calculateBuffer()` | Main buffer calculation orchestrator |
| `calculateReverseTRR()` | Reverse TRR calculation |
| `monteCarloSimulation()` | Monte Carlo for non-normal demand |

### UI Components

The application uses a tabbed interface with two main calculators:

1. **Buffer Calculator Tab**
   - Demand data input (1-48 months)
   - Service level slider (50-99.99%)
   - Lead time input
   - Results display with charts

2. **Reverse TRR Tab**
   - Current buffer input
   - Demand data input
   - Service level slider
   - Maximum lead time calculation

## Data Flow

```
User Input
    │
    ▼
┌──────────────────┐
│  Form Validation │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐     ┌──────────────────┐
│  Check Data Size │────▶│  < 5 months?     │
└────────┬─────────┘     │  Use Normal      │
         │               └──────────────────┘
         ▼
┌──────────────────┐
│  Anderson-Darling│
│  Normality Test  │
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐  ┌────────────┐
│ Normal │  │ Intermittent│
│ Method │  │ (Croston)   │
└───┬────┘  └──────┬─────┘
    │              │
    ▼              ▼
┌──────────────────────┐
│  Calculate Buffer    │
│  or Reverse TRR      │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Display Results     │
│  + Visualization     │
└──────────────────────┘
```

## Build & Deployment

### Development
```bash
npm run dev    # Start dev server on port 5000
```

### Production Build
```bash
npm run build  # Output to dist/public/
```

### Deployment Options

| Platform | Configuration |
|----------|---------------|
| Netlify | `netlify.toml` |
| GitHub Pages | `.github/workflows/deploy.yml` |
| Vercel | Auto-detected |
| Any static host | Upload `dist/public/` |

## Design Decisions

### Why Client-Side Only?

1. **Privacy**: User demand data never leaves their browser
2. **Cost**: Free hosting on static platforms
3. **Performance**: No network latency for calculations
4. **Simplicity**: No backend infrastructure to maintain
5. **Offline Capable**: Works without internet after initial load

### Why These Statistical Methods?

1. **Croston's Method**: Industry standard for intermittent demand
2. **SBA Correction**: Reduces bias in Croston's estimates
3. **Anderson-Darling**: More sensitive than Shapiro-Wilk for tail detection
4. **Monte Carlo**: Handles any distribution when parametric methods fail

### Component Library Choice

shadcn/ui was chosen because:
- Fully accessible (WCAG compliant)
- Customizable (not a black box)
- TypeScript-first
- No runtime dependencies (copy-paste components)

## Performance Considerations

- Calculations are synchronous but fast (< 100ms for typical inputs)
- Charts render efficiently with Recharts
- CSS is tree-shaken by Tailwind
- Vite provides optimal code splitting

## Browser Support

Modern browsers with ES2020+ support:
- Chrome 80+
- Firefox 75+
- Safari 14+
- Edge 80+
