/**
 * Human Tasks:
 * 1. Verify that react@18.x is installed in package.json
 * 2. Verify that class-variance-authority@^0.7.0 is installed in package.json
 * 3. Test keyboard navigation with screen readers to ensure ARIA compliance
 */

import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { cn } from 'class-variance-authority'; // v0.7.0
import { colors, spacing } from '../../config/theme';

// Context for managing tab state
interface TabsContextValue {
  activeTab: string;
  setActiveTab: (value: string) => void;
  orientation: 'horizontal' | 'vertical';
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

// Utility hook for accessing tabs context
const useTabsContext = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs compound components must be used within a Tabs component');
  }
  return context;
};

// Requirement: Component Library (7.1.2)
// Core UI component for tab-based navigation and content organization
interface TabsProps {
  defaultValue: string;
  orientation?: 'horizontal' | 'vertical';
  children: React.ReactNode;
  onChange?: (value: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  defaultValue,
  orientation = 'horizontal',
  children,
  onChange,
  className,
}) => {
  const [activeTab, setActiveTab] = React.useState(defaultValue);

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    onChange?.(value);
  }, [onChange]);

  const contextValue = useMemo(() => ({
    activeTab,
    setActiveTab: handleTabChange,
    orientation,
  }), [activeTab, handleTabChange, orientation]);

  return (
    <TabsContext.Provider value={contextValue}>
      <div
        className={cn(
          'flex',
          orientation === 'horizontal' ? 'flex-col' : 'flex-row',
          className
        )}
        aria-orientation={orientation}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
};

// Requirement: Accessibility Requirements (7.1.4)
// Implements WCAG 2.1 AA compliant keyboard navigation
interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export const TabsList: React.FC<TabsListProps> = ({ children, className }) => {
  const { orientation } = useTabsContext();

  return (
    <div
      role="tablist"
      aria-label="Tabs"
      className={cn(
        'flex',
        orientation === 'horizontal' ? 'flex-row' : 'flex-col',
        'border-b border-gray-200',
        className
      )}
    >
      {children}
    </div>
  );
};

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({
  value,
  children,
  className,
  disabled = false,
}) => {
  const { activeTab, setActiveTab, orientation } = useTabsContext();
  const isSelected = activeTab === value;
  const tabRef = React.useRef<HTMLButtonElement>(null);

  // Requirement: Accessibility Requirements (7.1.4)
  // Implements WAI-ARIA keyboard navigation patterns
  const handleKeyDown = (event: React.KeyboardEvent) => {
    const tabList = tabRef.current?.parentElement;
    if (!tabList) return;

    const tabs = Array.from(tabList.querySelectorAll('[role="tab"]'));
    const index = tabs.indexOf(tabRef.current!);
    
    let newIndex: number;
    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        newIndex = index - 1;
        if (newIndex < 0) newIndex = tabs.length - 1;
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        newIndex = index + 1;
        if (newIndex >= tabs.length) newIndex = 0;
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    const newTab = tabs[newIndex] as HTMLElement;
    const newValue = newTab.getAttribute('data-value');
    if (newValue) {
      setActiveTab(newValue);
      newTab.focus();
    }
  };

  return (
    <button
      ref={tabRef}
      role="tab"
      aria-selected={isSelected}
      aria-controls={`panel-${value}`}
      tabIndex={isSelected ? 0 : -1}
      data-value={value}
      disabled={disabled}
      onClick={() => !disabled && setActiveTab(value)}
      onKeyDown={handleKeyDown}
      className={cn(
        'px-4 py-2 focus:outline-none focus:ring-2 focus:ring-offset-2',
        'transition-colors duration-200',
        isSelected ? 
          `bg-${colors.primary.base} text-white` : 
          `text-${colors.primary.base} hover:bg-gray-100`,
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {children}
    </button>
  );
};

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export const TabsContent: React.FC<TabsContentProps> = ({
  value,
  children,
  className,
}) => {
  const { activeTab } = useTabsContext();
  const isSelected = activeTab === value;

  if (!isSelected) return null;

  return (
    <div
      role="tabpanel"
      id={`panel-${value}`}
      aria-labelledby={`tab-${value}`}
      tabIndex={0}
      className={cn(
        'p-4',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        className
      )}
    >
      {children}
    </div>
  );
};