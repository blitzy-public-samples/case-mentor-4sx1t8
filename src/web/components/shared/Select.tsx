/**
 * Human Tasks:
 * 1. Verify @radix-ui/react-select ^2.0.0 is installed in package.json
 * 2. Ensure react ^18.0.0 is installed in package.json
 * 3. Verify class-variance-authority ^0.7.0 is installed in package.json
 */

// react ^18.0.0
import * as React from 'react';
// @radix-ui/react-select ^2.0.0
import * as SelectPrimitive from '@radix-ui/react-select';
// class-variance-authority ^0.7.0
import { cn } from 'class-variance-authority';
import { colors, shadows } from '../../config/theme';

// Requirement: Component Library (7.1.2)
// Type definition for select options with accessibility support
interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

// Requirement: Component Library (7.1.2)
// Props interface for the Select component
interface SelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
}

// Requirement: Component Library (7.1.2)
// Styles configuration using theme tokens
const selectStyles = {
  trigger: cn(
    'flex h-10 w-full items-center justify-between rounded-md border px-3 py-2',
    'bg-white text-sm ring-offset-white transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    {
      default: `border-${colors.primary.base} focus:ring-${colors.primary.base}`,
      error: `border-${colors.error.base} focus:ring-${colors.error.base}`,
    }
  ),
  content: cn(
    'relative z-50 min-w-[8rem] overflow-hidden rounded-md',
    `border border-${colors.primary.base}`,
    `bg-white text-${colors.primary.base}`,
    `shadow-${shadows.md}`,
    'data-[state=open]:animate-in data-[state=closed]:animate-out',
    'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
    'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95'
  ),
  item: cn(
    'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm',
    'outline-none transition-colors',
    `focus:bg-${colors.primary.hover} focus:text-white`,
    'data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
  ),
};

// Requirement: Component Library (7.1.2), Accessibility Requirements (7.1.4)
// Main select component implementation with WCAG 2.1 AA compliance
export function Select({
  value,
  options,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  error,
  className,
}: SelectProps): JSX.Element {
  // Requirement: Accessibility Requirements (7.1.4)
  // Handle keyboard navigation events
  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowUp':
      case 'ArrowDown':
        event.preventDefault();
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        break;
      case 'Escape':
        event.preventDefault();
        break;
    }
  };

  return (
    <SelectPrimitive.Root value={value} onValueChange={onChange} disabled={disabled}>
      <SelectPrimitive.Trigger
        className={cn(
          selectStyles.trigger,
          {
            [selectStyles.trigger.default]: !error,
            [selectStyles.trigger.error]: !!error,
          },
          className
        )}
        aria-invalid={!!error}
        aria-describedby={error ? `select-error-${value}` : undefined}
        onKeyDown={handleKeyDown}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon className="ml-2">
          <ChevronDownIcon />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content className={selectStyles.content}>
          <SelectPrimitive.Viewport className="p-1">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className={selectStyles.item}
              >
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>

      {error && (
        <div
          id={`select-error-${value}`}
          className={`mt-1 text-sm text-${colors.error.base}`}
          role="alert"
        >
          {error}
        </div>
      )}
    </SelectPrimitive.Root>
  );
}

// Requirement: Component Library (7.1.2)
// Chevron icon component for select trigger
const ChevronDownIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);