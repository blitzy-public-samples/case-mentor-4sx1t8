// react: ^18.0.0
// class-variance-authority: ^0.7.0
// next/image: ^13.0.0

import React from 'react';
import Image from 'next/image';
import { cn } from 'class-variance-authority';
import { UserProfile } from '../../types/user';
import { theme } from '../../config/theme';

/**
 * Human Tasks:
 * 1. Ensure proper image optimization settings are configured in next.config.js
 * 2. Verify image domains are whitelisted for Next.js Image component
 * 3. Test avatar component with various image aspect ratios
 */

// Requirement: User Interface Design - Implements consistent design system tokens
const AVATAR_SIZES = {
  sm: '32px',
  md: '40px',
  lg: '48px'
} as const;

// Requirement: User Interface Design - Theme configuration
const FALLBACK_BG_COLOR = theme.colors.secondary.base;

interface AvatarProps {
  size: 'sm' | 'md' | 'lg';
  profile: UserProfile;
  loading?: boolean;
  className?: string;
}

// Requirement: User Interface Design - Consistent profile representation
const getInitials = (firstName: string, lastName: string): string => {
  const firstInitial = firstName ? firstName.charAt(0) : '';
  const lastInitial = lastName ? lastName.charAt(0) : '';
  return (firstInitial + lastInitial).toUpperCase();
};

// Requirement: User Interface Design & Accessibility Requirements
export const Avatar: React.FC<AvatarProps> = ({
  size = 'md',
  profile,
  loading = false,
  className
}) => {
  const dimensions = AVATAR_SIZES[size];
  const initials = getInitials(profile.firstName, profile.lastName);

  // Requirement: Accessibility Requirements - Proper ARIA labeling
  const ariaLabel = `Profile picture of ${profile.firstName} ${profile.lastName}`;

  // Requirement: Accessibility Requirements - Loading state handling
  if (loading) {
    return (
      <div
        className={cn(
          'relative rounded-full animate-pulse bg-gray-200',
          className
        )}
        style={{
          width: dimensions,
          height: dimensions
        }}
        role="progressbar"
        aria-label={`Loading ${ariaLabel}`}
      />
    );
  }

  // Requirement: Accessibility Requirements - Fallback state with proper contrast
  if (!profile.avatarUrl) {
    return (
      <div
        className={cn(
          'relative rounded-full flex items-center justify-center text-white font-medium',
          className
        )}
        style={{
          width: dimensions,
          height: dimensions,
          backgroundColor: FALLBACK_BG_COLOR,
          fontSize: `${parseInt(dimensions) * 0.4}px`
        }}
        role="img"
        aria-label={ariaLabel}
      >
        {initials}
      </div>
    );
  }

  // Requirement: User Interface Design - Next.js image optimization
  return (
    <div
      className={cn('relative rounded-full overflow-hidden', className)}
      style={{
        width: dimensions,
        height: dimensions,
        boxShadow: theme.shadows.sm
      }}
    >
      <Image
        src={profile.avatarUrl}
        alt={ariaLabel}
        fill
        sizes={`${parseInt(dimensions)}px`}
        className="object-cover"
        priority={size === 'lg'}
      />
    </div>
  );
};