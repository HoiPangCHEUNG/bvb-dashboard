# BVB Funding Rate Dashboard

A funding rate monitoring dashboard for BVB ([Bull vs. Bear](https://bullbear.zone/)) markets on Neutron blockchain. Features automated data collection every 15 minutes, multiple timeframes, and comprehensive risk analysis. No wallet or whatsoever needed, just install and run.

> **Disclaimer**: This is a fan-made project. The author/maintainers have no affiliation with the BvB platform itself.

## Features

- 📊 **Funding Rate Tracking**: Monitor funding rates across all BVB markets (updated every 15 minutes)
- ⏱️ **Multiple Timeframes**: 15-minute, 1-hour, and 4-hour data views
- 📈 **Interactive Charts**: Dynamic funding rate and open interest visualization
- 🚨 **Risk Analysis**: Market sentiment, squeeze potential, and concentration risk metrics
- ⚡ **Automated Data Collection**: Cron job fetches data every 15 minutes
- 💾 **Efficient Storage**: Hourly file splitting for optimal performance
- 🔄 **Auto-restart**: PM2 process management for reliability

## Architecture

### Data Collection

- **Update Frequency**: Data fetched every 15 minutes from BVB contracts
- **Data Source**: Neutron blockchain via CosmWasm queries
- **Caching**: 5-minute cache to prevent excessive API calls

### Data Storage

- **Hourly Files**: Data stored in files like `2024-01-15-14.json`
- **Small Files**: Each file contains max 4 entries (15-minute intervals)
- **Fast Reads**: No more large JSON parsing - only read what you need

### Timeframe Filtering

- **15min**: Shows all data points (every 15 minutes)
- **1hour**: Shows first entry of each hour
- **4hour**: Shows first entry every 4 hours

## Getting Started

### Prerequisites

```bash
npm install -g pm2  # For process management
```

### Installation

```bash
npm install
```

### Environment Setup

Create a `.env` file:

```env
NEUTRON_RPC_URL=https://rpc-lb.neutron.org
```

if not set, we will randomly pick one from the available public RPCs. (not recommended)

### Development

```bash
# Start the development server
npm run dev

# Start the cron scheduler (development)
npm run cron

# Start with PM2 (production)
npm run cron:pm2
```

### Production Deployment

```bash
# Build the application
npm run build

# Start the application
npm start

# Start the cron scheduler with PM2
npm run cron:pm2
```

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run cron` - Run cron scheduler once
- `npm run cron:pm2` - Start cron scheduler with PM2
- `npm run fetch-rates` - Manually fetch funding rates

## PM2 Management

```bash
# View running processes
pm2 list

# View logs
pm2 logs funding-rate-cron

# Restart process
pm2 restart funding-rate-cron

# Stop process
pm2 stop funding-rate-cron

# Delete process
pm2 delete funding-rate-cron
```

## Project Structure

```
src/
├── app/
│   ├── components/          # React components
│   │   ├── FundingRateChart.tsx
│   │   ├── OpenInterestChart.tsx
│   │   ├── TimeFrameSelector.tsx
│   │   └── DashboardClient.tsx
│   ├── dashboard/           # Main dashboard page
│   ├── utils/              # Utility functions
│   │   └── bvb.ts          # BVB API integration
│   └── constant/           # Configuration constants
└── cron/                   # Automated data collection
    ├── scheduler.ts        # Cron job scheduler
    └── fetchFundingRates.ts # Data fetching logic
```

## Data Flow

1. **Cron Scheduler** (`scheduler.ts`) runs every 15 minutes
2. **Data Fetcher** (`fetchFundingRates.ts`) queries BVB contracts on Neutron
3. **Storage** saves data to hourly JSON files in `./data/`
4. **Dashboard** reads and filters data based on selected timeframe
5. **Charts** display funding rates and open interest (15-minute intervals)

## Key Components

### TimeFrame System

- Efficient data filtering without re-fetching
- Pre-computed data for instant UI switching
- Scalable to add more timeframes

### Risk Analysis

- **Market Sentiment**: Overall market direction analysis
- **Squeeze Potential**: Identifies potential short/long squeezes
- **Concentration Risk**: Monitors open interest distribution
- **Funding Rate Alerts**: Automated threshold monitoring

## Tech Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS
- **Charts**: Chart.js with React Chart.js 2
- **Blockchain**: CosmJS for Neutron integration
- **Process Management**: PM2
- **Scheduling**: node-cron
- **TypeScript**: Full type safety

## Disclaimer

This project is created by independent developers and is not affiliated with, endorsed by, or connected to Bull vs. Bear (BvB) platform or its operators. This is a fan-made monitoring tool for educational and informational purposes.

**Data Interpretation**: All calculations, risk metrics, and analysis presented in this dashboard reflect the author's interpretation of the raw blockchain data. These calculations are subjective and you may disagree with the methodology or conclusions. Always conduct your own research and analysis before making any trading decisions.

## License

MIT License - see LICENSE file for details.
