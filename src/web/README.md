# Case Interview Practice Platform - Web Frontend

## Project Overview

The Case Interview Practice Platform is a sophisticated web application designed to help aspiring consultants prepare for case interviews through AI-powered practice and feedback. Built with modern web technologies, the platform offers structured drills, real-time feedback, and an innovative McKinsey-style ecosystem simulation.

### Key Features
- Interactive case interview practice drills
- AI-powered feedback and evaluation
- McKinsey ecosystem simulation game
- Real-time progress tracking
- Comprehensive performance analytics

### Technology Stack
- NextJS 13+ (App Router)
- React 18+
- TypeScript 5.0+
- TailwindCSS 3+
- Supabase for backend services

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- pnpm package manager
- Supabase account for backend services

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd case-interview-platform/src/web
```

2. Install dependencies:
```bash
pnpm install
```

3. Configure environment variables:
Create a `.env.local` file with the following variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
pnpm dev
```

## Development

### Project Structure
```
src/web/
├── app/                 # Next.js 13 App Router pages
├── components/          # Reusable React components
├── lib/                # Utility functions and helpers
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
├── styles/             # Global styles and Tailwind config
└── public/             # Static assets
```

### Coding Standards
- TypeScript strict mode enabled
- ESLint configuration with recommended rules
- Prettier for code formatting
- Component-Driven Development (CDD) approach

### Component Guidelines
- Use functional components with TypeScript
- Implement proper prop typing
- Follow React 18 best practices
- Utilize React Hooks effectively
- Maintain component documentation

### State Management
- React Context for global state
- React Query for server state
- Local state with useState/useReducer
- Proper error boundary implementation

## Testing

### Unit Testing
- Jest and React Testing Library
- Test coverage requirements: 80%
- Component isolation testing
- Hook testing with @testing-library/react-hooks

### Integration Testing
- API integration tests
- Component integration tests
- State management tests
- Route testing

### E2E Testing
- Playwright for end-to-end testing
- Cross-browser testing
- User flow validation
- Performance testing

Run tests:
```bash
# Unit and integration tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage

# E2E tests
pnpm test:e2e
```

## Development Commands

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linting
pnpm lint

# Fix linting issues
pnpm lint:fix

# Type checking
pnpm type-check
```

## Deployment

### Build Process
1. Static analysis and type checking
2. Unit and integration tests
3. Production build optimization
4. Static asset optimization
5. Deployment to Vercel

### Environment Configuration
- Development: Local environment
- Staging: Preview deployments
- Production: Production environment

### Deployment Workflow
1. Push to feature branch
2. Automated tests and preview deployment
3. Pull request review
4. Merge to main branch
5. Production deployment

### Monitoring and Analytics
- Vercel Analytics for performance monitoring
- Error tracking with Sentry
- User analytics with custom events
- Performance metrics tracking

## Contributing

1. Create a feature branch
2. Implement changes with tests
3. Submit pull request
4. Code review process
5. Merge after approval

## License

Proprietary - All rights reserved

---

For more information, contact the development team or refer to the technical documentation.