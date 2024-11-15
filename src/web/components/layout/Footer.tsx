// Human Tasks:
// 1. Verify social media links are correct and active
// 2. Ensure all subscription tier information is up to date
// 3. Test footer responsiveness across all breakpoints
// 4. Validate color contrast ratios meet WCAG standards

// External dependencies
import React from 'react' // ^18.0.0
import Link from 'next/link' // ^13.0.0

// Internal dependencies
import { buttonVariants } from '../shared/Button'
import { routes } from '../../config/routes'
import { SUBSCRIPTION_TIERS } from '../../config/constants'

// Requirement: Design System Implementation (7.1.1)
// Footer navigation links organized by section
const FOOTER_LINKS = {
  product: [
    { label: 'Features', href: '/#features' },
    { label: 'Pricing', href: '/#pricing' },
    { label: 'Case Types', href: '/#cases' }
  ],
  resources: [
    { label: 'Blog', href: '/blog' },
    { label: 'Documentation', href: '/docs' },
    { label: 'FAQ', href: '/faq' }
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' }
  ],
  social: [
    { label: 'LinkedIn', href: 'https://linkedin.com' },
    { label: 'Twitter', href: 'https://twitter.com' },
    { label: 'GitHub', href: 'https://github.com' }
  ]
}

// Requirement: Component Library (7.1.2)
// Core footer component with consistent layout and styling
export const Footer = (): React.ReactElement => {
  // Requirement: Accessibility Requirements (7.1.4)
  // Semantic footer with proper ARIA roles and labels
  return (
    <footer
      role="contentinfo"
      className="w-full bg-gray-50 py-12 mt-auto"
      aria-label="Site footer"
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Product Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Product</h2>
            <ul className="space-y-3">
              {FOOTER_LINKS.product.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className={buttonVariants({
                      variant: 'link',
                      className: 'text-gray-600 hover:text-gray-900'
                    })}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Resources</h2>
            <ul className="space-y-3">
              {FOOTER_LINKS.resources.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className={buttonVariants({
                      variant: 'link',
                      className: 'text-gray-600 hover:text-gray-900'
                    })}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Subscription Tiers Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Plans</h2>
            <ul className="space-y-3">
              {Object.values(SUBSCRIPTION_TIERS).map((tier) => (
                <li key={tier.NAME}>
                  <Link
                    href={`/#${tier.NAME.toLowerCase()}`}
                    className={buttonVariants({
                      variant: 'link',
                      className: 'text-gray-600 hover:text-gray-900'
                    })}
                  >
                    {tier.NAME} - ${tier.PRICE}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social and Legal Section */}
          <div>
            {/* Social Links */}
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Connect</h2>
            <ul className="space-y-3 mb-6">
              {FOOTER_LINKS.social.map(({ label, href }) => (
                <li key={href}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({
                      variant: 'link',
                      className: 'text-gray-600 hover:text-gray-900'
                    })}
                    aria-label={`Visit our ${label} page`}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>

            {/* Legal Links */}
            <ul className="space-y-3">
              {FOOTER_LINKS.legal.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className={buttonVariants({
                      variant: 'link',
                      className: 'text-gray-600 hover:text-gray-900'
                    })}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-center text-gray-600 text-sm">
            © {new Date().getFullYear()} Case Interview Practice Platform. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}