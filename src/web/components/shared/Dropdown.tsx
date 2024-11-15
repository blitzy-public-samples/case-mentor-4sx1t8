/**
 * Human Tasks:
 * 1. Verify that react@18.x is installed in package.json
 * 2. Verify that class-variance-authority@^0.7.0 is installed in package.json
 * 3. Verify that lucide-react@^0.284.0 is installed in package.json
 */

// react@18.x
import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useRef, 
  useCallback 
} from 'react';
// class-variance-authority@^0.7.0
import { cn } from 'class-variance-authority';
// lucide-react@^0.284.0
import { ChevronDown } from 'lucide-react';

import { colors, shadows } from '../../config/theme';

// Types for dropdown options and props
interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  label: string;
  disabled?: boolean;
  placeholder?: string;
  options: DropdownOption[];
  value: string | null;
  className?: string;
  onChange: (value: string) => void;
}

// Requirement: Component Library (7.1.2)
// Create strongly typed context for dropdown state management
interface DropdownContextType {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  selectedValue: string | null;
  containerRef: React.RefObject<HTMLDivElement>;
  handleSelect: (value: string) => void;
}

const DropdownContext = createContext<DropdownContextType | undefined>(undefined);

// Requirement: Component Library (7.1.2)
// Core UI component for dropdown menus and selection interfaces
const Dropdown = React.forwardRef<HTMLDivElement, DropdownProps>(
  ({ label, disabled = false, placeholder = 'Select an option', options, value, className = '', onChange }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const optionsRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(-1);

    // Requirement: Accessibility Requirements (7.1.4)
    // Handle click outside to close dropdown
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
          setActiveIndex(-1);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleToggle = useCallback(() => {
      if (!disabled) {
        setIsOpen(!isOpen);
        setActiveIndex(-1);
      }
    }, [disabled]);

    const handleSelect = useCallback((selectedValue: string) => {
      onChange(selectedValue);
      setIsOpen(false);
      triggerRef.current?.focus();
    }, [onChange]);

    // Requirement: Accessibility Requirements (7.1.4)
    // Implements WCAG 2.1 AA compliant keyboard navigation
    const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
      if (disabled) return;

      switch (event.key) {
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else if (activeIndex >= 0) {
            handleSelect(options[activeIndex].value);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          triggerRef.current?.focus();
          break;
        case 'ArrowDown':
          event.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            setActiveIndex(prev => (prev < options.length - 1 ? prev + 1 : prev));
          }
          break;
        case 'ArrowUp':
          event.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            setActiveIndex(prev => (prev > 0 ? prev - 1 : prev));
          }
          break;
        case 'Home':
          if (isOpen) {
            event.preventDefault();
            setActiveIndex(0);
          }
          break;
        case 'End':
          if (isOpen) {
            event.preventDefault();
            setActiveIndex(options.length - 1);
          }
          break;
      }
    }, [disabled, isOpen, activeIndex, options, handleSelect]);

    const dropdownStyles = cn(
      'relative w-full',
      {
        'opacity-50 cursor-not-allowed': disabled,
        'cursor-pointer': !disabled
      },
      className
    );

    const selectedOption = options.find(opt => opt.value === value);

    return (
      <DropdownContext.Provider value={{ isOpen, setIsOpen, selectedValue: value, containerRef, handleSelect }}>
        <div
          ref={ref}
          className={dropdownStyles}
          onKeyDown={handleKeyDown}
        >
          {/* Requirement: Accessibility Requirements (7.1.4) - ARIA labels */}
          <label
            id={`${label}-label`}
            className="block text-sm font-medium mb-1 text-gray-700"
          >
            {label}
          </label>
          <button
            ref={triggerRef}
            type="button"
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-labelledby={`${label}-label`}
            aria-controls={`${label}-options`}
            disabled={disabled}
            className={cn(
              'w-full px-4 py-2 text-left flex items-center justify-between',
              'border rounded-md bg-white',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              'focus:ring-primary-500 transition-colors',
              {
                'border-gray-300 hover:border-gray-400': !disabled,
                'border-gray-200 bg-gray-50': disabled,
                'shadow-sm': !isOpen,
                [shadows.md]: isOpen
              }
            )}
            onClick={handleToggle}
          >
            <span className={cn({ 'text-gray-500': !selectedOption })}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <ChevronDown
              className={cn('w-4 h-4 transition-transform', {
                'rotate-180': isOpen
              })}
            />
          </button>

          {isOpen && (
            <div
              ref={optionsRef}
              id={`${label}-options`}
              role="listbox"
              aria-labelledby={`${label}-label`}
              className={cn(
                'absolute z-10 w-full mt-1 bg-white',
                'border border-gray-200 rounded-md',
                'max-h-60 overflow-auto',
                shadows.lg
              )}
            >
              {options.map((option, index) => (
                <div
                  key={option.value}
                  role="option"
                  aria-selected={option.value === value}
                  tabIndex={-1}
                  className={cn(
                    'px-4 py-2 cursor-pointer',
                    'hover:bg-gray-100 transition-colors',
                    {
                      'bg-gray-100': activeIndex === index,
                      'font-medium': option.value === value
                    }
                  )}
                  onClick={() => handleSelect(option.value)}
                >
                  {option.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </DropdownContext.Provider>
    );
  }
);

Dropdown.displayName = 'Dropdown';

export { Dropdown, type DropdownProps, type DropdownOption };