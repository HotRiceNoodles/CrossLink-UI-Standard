# CrossLink Web

The admin dashboard for CrossLink — an AI API gateway management platform.

## Features

- **Dashboard** — System overview, usage trends, and model distribution statistics
- **Provider Management** — Manage AI model providers (DeepSeek, Qwen, etc.) with connectivity testing
- **Model Management** — Configure and route AI models
- **API Keys** — Manage API access keys
- **Operations** — Request log query and analysis

## Tech Stack

- [Vue 3](https://vuejs.org/) + TypeScript
- [Vite](https://vitejs.dev/)
- [Arco Design Vue](https://arco.design/vue)
- [Pinia](https://pinia.vuejs.org/)
- [ECharts](https://echarts.apache.org/)

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm

### Install Dependencies

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

The dev server runs at `http://localhost:5180`. API requests are proxied to `http://localhost:8080`.

### Build

```bash
pnpm build
```

### Type Check

```bash
pnpm type-check
```

## Project Structure

```
src/
├── api/            # API request layer
├── assets/style/   # Global styles
├── components/     # Shared components
├── hooks/          # Composables
├── layout/         # Layout components
├── logger/         # Frontend logging module
├── router/         # Route configuration
├── store/          # State management
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
└── views/          # Page components
```

## License

[Apache License 2.0](LICENSE)
