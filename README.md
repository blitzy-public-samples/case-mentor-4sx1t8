# Case Interview Practice Platform

![Build Status](https://img.shields.io/github/workflow/status/case-interview-platform/main/CI)
![Test Coverage](https://img.shields.io/codecov/c/github/case-interview-platform/main)
![License](https://img.shields.io/github/license/case-interview-platform)

<!-- Addresses requirement: Project Overview from 1. EXECUTIVE SUMMARY -->
A web-based platform designed to democratize access to high-quality consulting interview preparation through AI-powered feedback and gamification principles. The platform enables aspiring consultants to systematically practice and improve their case interview skills through structured drills and simulations.

## Features

- 🎯 **Structured Practice Drills**
  - Case Prompt Analysis
  - Market Sizing Exercises
  - Calculation Drills
  - Brainstorming Scenarios
  - Framework Application
  - Synthesis Practice

- 🎮 **McKinsey-Style Simulation**
  - Ecosystem Game Replication
  - Time-Pressured Scenarios
  - Complex Data Analysis
  - Real-Time Feedback

- 🤖 **AI-Powered Feedback**
  - Real-Time Response Evaluation
  - Structured Improvement Suggestions
  - Performance Analytics
  - Progress Tracking

- 📊 **Progress Tracking**
  - Skill Development Analytics
  - Performance Metrics
  - Improvement Trends
  - Personalized Recommendations

<!-- Addresses requirement: Technology Stack from 4. TECHNOLOGY STACK -->
## Technology Stack

### Frontend
- Next.js 13+ (App Router)
- React 18+
- TypeScript 5+
- TailwindCSS 3+
- shadcn/ui components
- Framer Motion
- React Query
- Recharts

### Backend
- Supabase (PostgreSQL)
- NextJS Edge Functions
- OpenAI GPT-4
- Stripe Payments
- Redis Caching

### Development & Testing
- Jest
- React Testing Library
- Playwright
- ESLint
- Prettier

### Infrastructure
- Vercel Platform
- Supabase Cloud
- Vercel Edge Functions
- Vercel Analytics

<!-- Addresses requirement: Development Environment from 4. TECHNOLOGY STACK/4.5 DEVELOPMENT & DEPLOYMENT -->
## Getting Started

### Prerequisites

- Node.js 18+ LTS
- pnpm (recommended) or npm
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/case-interview-platform/main.git
cd case-interview-platform
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure environment variables in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
STRIPE_SECRET_KEY=your_stripe_key
OPENAI_API_KEY=your_openai_key
RESEND_API_KEY=your_resend_key
```

5. Start the development server:
```bash
pnpm dev
```

## Development

### Project Structure
```
├── src/
│   ├── app/            # Next.js 13 app directory
│   ├── components/     # Reusable React components
│   ├── lib/           # Utility functions and hooks
│   ├── styles/        # Global styles and Tailwind config
│   └── types/         # TypeScript type definitions
├── public/            # Static assets
└── tests/            # Test files
```

### Code Style

- Follow TypeScript best practices
- Use ESLint for code linting
- Format with Prettier
- Follow React hooks guidelines
- Write comprehensive tests

### Available Scripts

```bash
pnpm dev           # Start development server
pnpm build         # Build for production
pnpm start         # Start production server
pnpm test          # Run tests
pnpm lint          # Lint code
pnpm type-check    # Check TypeScript
```

## Testing

### Unit Tests
```bash
pnpm test          # Run all tests
pnpm test:watch    # Watch mode
pnpm test:coverage # Coverage report
```

### E2E Tests
```bash
pnpm test:e2e     # Run Playwright tests
```

### Component Tests
```bash
pnpm test:components # Test React components
```

## Deployment

### Production Deployment

1. Push to main branch
2. Vercel automatically deploys
3. Run post-deployment checks

### Environment Variables

Required for production:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `STRIPE_SECRET_KEY`
- `OPENAI_API_KEY`
- `RESEND_API_KEY`

### Infrastructure

- Hosted on Vercel
- Database on Supabase
- Edge Functions for API
- Global CDN distribution

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

### Commit Guidelines

- Use conventional commits
- Include tests
- Update documentation
- Follow code style

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ by the Case Interview Practice Platform Team