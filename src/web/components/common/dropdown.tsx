// React version: ^18.0.0
// class-variance-authority version: ^0.7.0
// lucide-react version: ^0.284.0

import React, { 
  forwardRef, 
  useState, 
  useRef, 
  useEffect, 
  KeyboardEvent, 
  ChangeEvent,
  ForwardedRef
} from 'react';
import { cn } from 'class-variance-authority';
import { ChevronDown } from 'lucide-react';
import { formatError } from '../../lib/utils';

/**
 * Human Tasks:
 * 1. Verify screen reader compatibility with organization's supported screen readers
 * 2. Test keyboard navigation patterns with accessibility team
 * 3. Validate color contrast ratios meet WCAG 2.1 AA standards
 * 4. Review focus management with UX team
 */

// Global constants
const TRANSITION_DURATION = 150;
const MAX_HEIGHT = 250;
const Z_INDEX = 50;
const ARIA_LIVE_REGION_ID = 'dropdown-live-region';

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  id: string;
  name: string;
  label: string;
  options: DropdownOption[];
  value: string | string[];
  isMulti?: boolean;
  isSearchable?: boolean;
  isDisabled?: boolean;
  placeholder?: string;
  error?: string;
  onChange: (value: string | string[]) => void;
  onBlur?: () => void;
}

export const Dropdown = forwardRef<HTMLDivElement, DropdownProps>(
  (props, ref: ForwardedRef<HTMLDivElement>) => {
    const {
      id,
      name,
      label,
      options,
      value,
      isMulti = false,
      isSearchable = false,
      isDisabled = false,
      placeholder = 'Select...',
      error,
      onChange,
      onBlur
    } = props;

    const [isOpen, setIsOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [activeIndex, setActiveIndex] = useState(-1);
    
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const optionsRef = useRef<HTMLDivElement>(null);

    // Filter options based on search value
    const filteredOptions = options.filter(option =>
      option.label.toLowerCase().includes(searchValue.toLowerCase())
    );

    // Get selected option labels for display
    const selectedLabels = Array.isArray(value)
      ? options.filter(opt => value.includes(opt.value)).map(opt => opt.label)
      : options.find(opt => opt.value === value)?.label;

    /**
     * @requirement Accessibility Requirements
     * Handle dropdown toggle with ARIA announcements
     */
    const handleToggle = () => {
      if (isDisabled) return;

      setIsOpen(prev => !prev);
      setActiveIndex(-1);
      setSearchValue('');

      if (!isOpen && isSearchable) {
        setTimeout(() => searchInputRef.current?.focus(), TRANSITION_DURATION);
      }

      // Announce state change to screen readers
      const liveRegion = document.getElementById(ARIA_LIVE_REGION_ID);
      if (liveRegion) {
        liveRegion.textContent = `Dropdown ${!isOpen ? 'expanded' : 'collapsed'}`;
      }

      if (isOpen && onBlur) {
        onBlur();
      }
    };

    /**
     * @requirement Accessibility Requirements
     * Handle option selection with screen reader feedback
     */
    const handleOptionSelect = (selectedValue: string) => {
      let newValue: string | string[];
      
      if (isMulti) {
        newValue = Array.isArray(value) 
          ? value.includes(selectedValue)
            ? value.filter(v => v !== selectedValue)
            : [...value, selectedValue]
          : [selectedValue];
      } else {
        newValue = selectedValue;
        setIsOpen(false);
      }

      onChange(newValue);
      setSearchValue('');

      // Announce selection to screen readers
      const selectedOption = options.find(opt => opt.value === selectedValue);
      const liveRegion = document.getElementById(ARIA_LIVE_REGION_ID);
      if (liveRegion && selectedOption) {
        liveRegion.textContent = `${selectedOption.label} ${
          isMulti 
            ? Array.isArray(newValue) && newValue.includes(selectedValue)
              ? 'selected'
              : 'deselected'
            : 'selected'
        }`;
      }
    };

    /**
     * @requirement Component Library
     * Handle search input changes with accessibility feedback
     */
    const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
      const newSearchValue = event.target.value;
      setSearchValue(newSearchValue);
      setActiveIndex(-1);

      // Announce number of matching results
      const matchCount = filteredOptions.length;
      const liveRegion = document.getElementById(ARIA_LIVE_REGION_ID);
      if (liveRegion) {
        liveRegion.textContent = `${matchCount} ${
          matchCount === 1 ? 'result' : 'results'
        } available`;
      }
    };

    /**
     * @requirement Accessibility Requirements
     * Handle keyboard navigation with WCAG compliance
     */
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isDisabled) return;

      switch (event.key) {
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (!isOpen) {
            handleToggle();
          } else if (activeIndex >= 0) {
            handleOptionSelect(filteredOptions[activeIndex].value);
          }
          break;

        case 'Escape':
          if (isOpen) {
            event.preventDefault();
            handleToggle();
          }
          break;

        case 'ArrowDown':
          event.preventDefault();
          if (!isOpen) {
            handleToggle();
          } else {
            setActiveIndex(prev => 
              prev < filteredOptions.length - 1 ? prev + 1 : 0
            );
          }
          break;

        case 'ArrowUp':
          event.preventDefault();
          if (!isOpen) {
            handleToggle();
          } else {
            setActiveIndex(prev => 
              prev > 0 ? prev - 1 : filteredOptions.length - 1
            );
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
            setActiveIndex(filteredOptions.length - 1);
          }
          break;
      }
    };

    // Handle click outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
          if (onBlur) onBlur();
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onBlur]);

    return (
      <div
        ref={ref}
        className={cn(
          'relative w-full',
          isDisabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {/* ARIA live region for announcements */}
        <div
          id={ARIA_LIVE_REGION_ID}
          className="sr-only"
          role="status"
          aria-live="polite"
        />

        {/* Label */}
        <label
          htmlFor={id}
          className={cn(
            'block text-sm font-medium mb-1',
            error ? 'text-red-600' : 'text-gray-700'
          )}
        >
          {label}
        </label>

        {/* Dropdown trigger */}
        <div
          ref={dropdownRef}
          id={id}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={`${id}-options`}
          aria-labelledby={`${id}-label`}
          aria-disabled={isDisabled}
          aria-invalid={!!error}
          tabIndex={isDisabled ? -1 : 0}
          className={cn(
            'relative w-full border rounded-md shadow-sm px-3 py-2',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            error
              ? 'border-red-300 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500',
            isDisabled ? 'bg-gray-100' : 'bg-white',
            'cursor-default'
          )}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
        >
          <div className="flex items-center justify-between">
            {isSearchable && isOpen ? (
              <input
                ref={searchInputRef}
                type="text"
                className="w-full border-none p-0 focus:ring-0 bg-transparent"
                value={searchValue}
                onChange={handleSearch}
                placeholder={placeholder}
                aria-autocomplete="list"
              />
            ) : (
              <span className={cn(!selectedLabels && 'text-gray-400')}>
                {selectedLabels || placeholder}
              </span>
            )}
            <ChevronDown
              className={cn(
                'w-5 h-5 text-gray-400 transition-transform duration-150',
                isOpen && 'transform rotate-180'
              )}
            />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {formatError(new Error(error))}
          </p>
        )}

        {/* Options dropdown */}
        {isOpen && (
          <div
            ref={optionsRef}
            id={`${id}-options`}
            role="listbox"
            aria-multiselectable={isMulti}
            className={cn(
              'absolute w-full mt-1 bg-white border border-gray-300 rounded-md',
              'shadow-lg overflow-auto z-50'
            )}
            style={{ maxHeight: MAX_HEIGHT, zIndex: Z_INDEX }}
          >
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-gray-500">No options available</div>
            ) : (
              filteredOptions.map((option, index) => {
                const isSelected = Array.isArray(value)
                  ? value.includes(option.value)
                  : value === option.value;

                return (
                  <div
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    className={cn(
                      'px-3 py-2 cursor-pointer',
                      'transition-colors duration-150',
                      index === activeIndex && 'bg-blue-50',
                      isSelected
                        ? 'bg-blue-100 text-blue-900'
                        : 'hover:bg-gray-100'
                    )}
                    onClick={() => handleOptionSelect(option.value)}
                  >
                    {isMulti && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        className="mr-2"
                        readOnly
                      />
                    )}
                    {option.label}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    );
  }
);

Dropdown.displayName = 'Dropdown';