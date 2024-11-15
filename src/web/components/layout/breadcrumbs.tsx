// Human Tasks:
// 1. Verify ARIA labels are appropriate for the application context
// 2. Test keyboard navigation flow with screen readers
// 3. Validate color contrast ratios in different color modes

// @package next 13.0.0
// @package lucide-react latest

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { DRILLS, SIMULATION, PROFILE } from '../../config/routes';
import { colors, spacing } from '../../config/theme';

interface BreadcrumbsProps {
  className?: string;
}

interface BreadcrumbItem {
  label: string;
  path: string;
  isLast: boolean;
}

/**
 * @requirement User Interface Design
 * Generates breadcrumb items from the current pathname by matching against route configurations
 */
const generateBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];
  let currentPath = '';

  // Add home as first breadcrumb
  breadcrumbs.push({
    label: 'Home',
    path: '/',
    isLast: segments.length === 0
  });

  // Map route groups to their configurations
  const routeGroups = {
    drills: DRILLS,
    simulation: SIMULATION,
    profile: PROFILE
  };

  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;

    // Find matching route group
    const groupKey = segment as keyof typeof routeGroups;
    const routeGroup = routeGroups[groupKey];

    if (routeGroup) {
      // Handle root level of route group
      const route = routeGroup.routes.LIST;
      breadcrumbs.push({
        label: route.title,
        path: currentPath,
        isLast
      });
    } else {
      // Handle nested routes
      const parentGroup = routeGroups[segments[0] as keyof typeof routeGroups];
      if (parentGroup) {
        // Find matching route in parent group
        const route = Object.values(parentGroup.routes).find(r => {
          const parameterizedPath = r.path.replace(/:[^/]+/g, '[^/]+');
          const regex = new RegExp(`^${parameterizedPath}$`);
          return regex.test(currentPath.slice(parentGroup.baseUrl.length) || '/');
        });

        if (route) {
          breadcrumbs.push({
            label: route.title,
            path: currentPath,
            isLast
          });
        }
      }
    }
  });

  return breadcrumbs;
};

/**
 * @requirement User Interface Design, Accessibility Requirements
 * Breadcrumbs navigation component implementing WCAG 2.1 AA standards
 */
export default function Breadcrumbs({ className = '' }: BreadcrumbsProps): JSX.Element {
  const pathname = usePathname();
  const breadcrumbs = generateBreadcrumbs(pathname);

  return (
    <nav
      role="navigation"
      aria-label="Breadcrumb"
      className={className}
      style={{
        padding: `${spacing[2]} 0`
      }}
    >
      <ol
        role="list"
        style={{
          display: 'flex',
          alignItems: 'center',
          margin: 0,
          padding: 0,
          listStyle: 'none'
        }}
      >
        {breadcrumbs.map((item, index) => (
          <li
            key={item.path}
            style={{
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {index > 0 && (
              <ChevronRight
                size={16}
                style={{
                  color: colors.gray['400'],
                  margin: `0 ${spacing[2]}`
                }}
                aria-hidden="true"
              />
            )}
            {item.isLast ? (
              <span
                aria-current="page"
                style={{
                  color: colors.primary.DEFAULT,
                  fontWeight: 500
                }}
              >
                {item.label}
              </span>
            ) : (
              <Link
                href={item.path}
                style={{
                  color: colors.gray['500'],
                  textDecoration: 'none',
                  ':hover': {
                    color: colors.primary.DEFAULT,
                    textDecoration: 'underline'
                  },
                  ':focus': {
                    outline: `2px solid ${colors.secondary.DEFAULT}`,
                    outlineOffset: '2px',
                    borderRadius: '2px'
                  }
                }}
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}