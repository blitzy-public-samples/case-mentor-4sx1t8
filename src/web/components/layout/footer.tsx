// @package react ^18.0.0
// @package next/link ^13.0.0

// Human Tasks:
// 1. Verify color contrast ratios meet WCAG 2.1 AA standards using a color contrast checker
// 2. Test keyboard navigation flow with screen readers
// 3. Validate responsive layout on all supported breakpoints

import React from 'react';
import Link from 'next/link';
import { colors, spacing } from '../../config/theme';
import { NAVIGATION_CONFIG } from '../../config/navigation';
import { Button } from '../common/button';

// Footer link configuration
const FOOTER_LINKS = [
  { label: 'About', href: '/about' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Contact', href: '/contact' }
] as const;

interface FooterProps {
  className?: string;
}

// Get current year for copyright notice
const getCurrentYear = (): number => {
  return new Date().getFullYear();
};

// Requirement: Accessibility Requirements - WCAG 2.1 AA compliant footer
export const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  const currentYear = getCurrentYear();

  return (
    <footer
      role="contentinfo"
      aria-label="Site footer"
      className={`w-full bg-primary px-4 py-8 md:px-6 lg:px-8 ${className}`}
      // Requirement: Design System Specifications - Consistent spacing
      style={{
        backgroundColor: colors.primary.DEFAULT,
        paddingTop: spacing['8'],
        paddingBottom: spacing['8']
      }}
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Platform Information */}
          <div className="flex flex-col space-y-4">
            <h2 className="text-xl font-semibold text-white">
              Case Interview Practice
            </h2>
            <p className="text-gray-300">
              Master case interviews with AI-powered practice and real-time feedback.
            </p>
            <Button
              variant="secondary"
              size="sm"
              aria-label="Start practicing case interviews"
            >
              Start Practice
            </Button>
          </div>

          {/* Main Navigation Links */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-lg font-semibold text-white">Practice</h3>
            <nav aria-label="Footer practice navigation">
              <ul className="space-y-2">
                {NAVIGATION_CONFIG.MAIN_NAV.map((item) => (
                  <li key={item.path}>
                    <Link
                      href={item.path}
                      className="text-gray-300 hover:text-white transition-colors"
                      aria-label={`Go to ${item.label}`}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Legal Links */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-lg font-semibold text-white">Legal</h3>
            <nav aria-label="Footer legal navigation">
              <ul className="space-y-2">
                {FOOTER_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-gray-300 hover:text-white transition-colors"
                      aria-label={`Read our ${link.label}`}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Contact Information */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-lg font-semibold text-white">Contact</h3>
            <address className="text-gray-300 not-italic">
              <p>Email: support@caseprep.com</p>
              <p>Hours: Mon-Fri 9AM-5PM EST</p>
            </address>
            <div className="flex space-x-4">
              <Button
                variant="ghost"
                size="sm"
                aria-label="Contact support"
                className="text-gray-300 hover:text-white"
              >
                Get Help
              </Button>
            </div>
          </div>
        </div>

        {/* Copyright Notice */}
        <div className="mt-8 border-t border-gray-700 pt-8">
          <p className="text-center text-gray-300">
            © {currentYear} Case Interview Practice Platform. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};