'use client'

// External dependencies
import Image from 'next/image' // ^13.0.0
import Link from 'next/link' // ^13.0.0

// Internal dependencies
import { Button } from '../components/shared/Button'
import { Card } from '../components/shared/Card'
import { Header } from '../components/layout/Header'

// Requirement: Landing Page Design (6.2 Core Layouts)
// Feature cards showcasing platform capabilities
const FEATURES = [
  {
    title: 'Case Prompt Drills',
    description: 'Practice with real consulting case scenarios',
    icon: '/images/case-icon.svg'
  },
  {
    title: 'Calculation Drills',
    description: 'Master case math and quick calculations',
    icon: '/images/math-icon.svg'
  },
  {
    title: 'Market Sizing',
    description: 'Learn structured estimation techniques',
    icon: '/images/market-icon.svg'
  },
  {
    title: 'McKinsey Simulation',
    description: 'Experience the digital assessment game',
    icon: '/images/simulation-icon.svg'
  }
]

// Platform success metrics
const METRICS = [
  {
    value: '80%',
    label: 'Completion Rate',
    description: 'Users completing practice drills'
  },
  {
    value: '4.8/5',
    label: 'User Satisfaction',
    description: 'Average platform rating'
  },
  {
    value: '200ms',
    label: 'Response Time',
    description: 'Average API response time'
  }
]

// Requirement: Landing Page Design (6.2 Core Layouts)
// Main landing page component implementing modern, accessible design
export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Requirement: Design System Implementation (7.1.1) */}
      {/* Main navigation header */}
      <Header className="bg-white shadow-sm" />

      {/* Hero section */}
      <section className="relative px-6 lg:px-8 pt-24 pb-12 md:pt-32 md:pb-20">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Master Case Interviews with AI-Powered Practice
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
              Prepare for consulting interviews with structured drills, real-time feedback,
              and McKinsey simulation practice. Join thousands of successful candidates.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button
                variant="primary"
                size="lg"
                asChild
              >
                <Link href="/auth/register">Start Free Trial</Link>
              </Button>
              <Button
                variant="ghost"
                size="lg"
                asChild
              >
                <Link href="/auth/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature showcase */}
      <section className="py-16 px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Comprehensive Practice Tools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {FEATURES.map((feature) => (
              <Card
                key={feature.title}
                className="p-6"
                hoverable
              >
                <div className="flex flex-col items-center text-center">
                  <div className="relative w-16 h-16 mb-4">
                    <Image
                      src={feature.icon}
                      alt={feature.title}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* McKinsey simulation preview */}
      <section className="bg-gray-900 text-white py-20 px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">
                Experience the McKinsey Digital Assessment
              </h2>
              <p className="text-gray-300 mb-8">
                Practice with our accurate simulation of the McKinsey ecosystem game.
                Learn to balance species populations and optimize environmental parameters
                under time pressure.
              </p>
              <Button
                variant="secondary"
                size="lg"
                asChild
              >
                <Link href="/simulation">Try Demo</Link>
              </Button>
            </div>
            <div className="relative aspect-video">
              <Image
                src="/images/simulation-preview.jpg"
                alt="McKinsey Digital Assessment Simulation"
                fill
                className="rounded-lg object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Success metrics */}
      <section className="py-16 px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {METRICS.map((metric) => (
              <Card
                key={metric.label}
                className="p-8 text-center"
              >
                <div className="text-4xl font-bold text-primary mb-2">
                  {metric.value}
                </div>
                <div className="text-xl font-semibold text-gray-900 mb-2">
                  {metric.label}
                </div>
                <p className="text-gray-600">
                  {metric.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="bg-primary-50 py-20 px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Ready to Excel in Your Case Interviews?
          </h2>
          <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
            Join thousands of candidates who have improved their case interview
            performance with our structured practice platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              variant="primary"
              size="lg"
              asChild
            >
              <Link href="/auth/register">Start Free Trial</Link>
            </Button>
            <Button
              variant="ghost"
              size="lg"
              asChild
            >
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Requirement: Accessibility Requirements (7.1.4) */}
      {/* Skip to main content link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-white p-4 z-50"
      >
        Skip to main content
      </a>
    </main>
  )
}