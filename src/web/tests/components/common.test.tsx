// @package react ^18.0.0
// @package @testing-library/react ^14.0.0
// @package @jest/globals ^29.0.0

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect } from '@jest/globals';
import { Button, ButtonProps } from '../../components/common/button';
import { Card, CardProps } from '../../components/common/card';
import Input from '../../components/common/input';
import type { InputProps } from '../../components/common/input';

// Test IDs for component querying
const TEST_ID = {
  BUTTON: 'button-component',
  CARD: 'card-component',
  INPUT: 'input-component'
};

// Mock event handlers
const MOCK_HANDLERS = {
  onClick: jest.fn(),
  onChange: jest.fn(),
  onBlur: jest.fn()
};

// Requirement: Design System Specifications - Verify components adhere to design system tokens
describe('Button', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders primary variant correctly', () => {
    render(<Button variant="primary">Primary Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-primary');
    expect(button).toHaveTextContent('Primary Button');
  });

  test('renders all size variants with correct classes', () => {
    const sizes: ButtonProps['size'][] = ['sm', 'md', 'lg'];
    sizes.forEach(size => {
      const { rerender } = render(<Button size={size}>Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass(size === 'sm' ? 'h-8' : size === 'md' ? 'h-10' : 'h-12');
      rerender(<></>);
    });
  });

  test('handles disabled state correctly', () => {
    render(<Button disabled>Disabled Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });

  test('displays loading state with spinner', () => {
    render(<Button loading>Loading Button</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('button').querySelector('svg')).toBeInTheDocument();
  });

  test('handles click events when not disabled', () => {
    render(<Button onClick={MOCK_HANDLERS.onClick}>Clickable Button</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(MOCK_HANDLERS.onClick).toHaveBeenCalledTimes(1);
  });

  test('applies fullWidth class correctly', () => {
    render(<Button fullWidth>Full Width Button</Button>);
    expect(screen.getByRole('button')).toHaveClass('w-full');
  });

  // Requirement: Accessibility Requirements - Validate WCAG 2.1 AA compliance
  test('meets accessibility requirements', () => {
    render(<Button ariaLabel="Accessible Button">Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Accessible Button');
    expect(button).toHaveAttribute('role', 'button');
  });
});

describe('Card', () => {
  test('renders default variant correctly', () => {
    render(<Card>Card Content</Card>);
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  test('applies correct classes for different variants', () => {
    const variants: CardProps['variant'][] = ['default', 'bordered', 'elevated'];
    variants.forEach(variant => {
      const { rerender } = render(<Card variant={variant}>Card</Card>);
      const card = screen.getByText('Card');
      expect(card).toHaveClass('bg-white', 'rounded-lg');
      if (variant === 'bordered') {
        expect(card).toHaveClass('border');
      }
      rerender(<></>);
    });
  });

  test('applies correct padding based on size prop', () => {
    const paddings: CardProps['padding'][] = ['none', 'small', 'medium', 'large'];
    paddings.forEach(padding => {
      const { rerender } = render(<Card padding={padding}>Card</Card>);
      const expectedClass = padding === 'none' ? 'p-0' : `p-[${padding}]`;
      expect(screen.getByText('Card')).toHaveClass(expectedClass);
      rerender(<></>);
    });
  });

  test('handles click events when interactive', () => {
    render(<Card onClick={MOCK_HANDLERS.onClick}>Interactive Card</Card>);
    fireEvent.click(screen.getByText('Interactive Card'));
    expect(MOCK_HANDLERS.onClick).toHaveBeenCalledTimes(1);
  });

  // Requirement: Accessibility Requirements - Validate WCAG 2.1 AA compliance
  test('meets accessibility requirements when interactive', () => {
    render(<Card onClick={MOCK_HANDLERS.onClick}>Interactive Card</Card>);
    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('tabIndex', '0');
    
    // Test keyboard interaction
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(MOCK_HANDLERS.onClick).toHaveBeenCalled();
  });
});

describe('Input', () => {
  const defaultProps: InputProps = {
    id: 'test-input',
    name: 'test',
    type: 'text',
    value: '',
    onChange: MOCK_HANDLERS.onChange
  };

  test('renders different input types correctly', () => {
    const types = ['text', 'email', 'number'];
    types.forEach(type => {
      const { rerender } = render(<Input {...defaultProps} type={type} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', type);
      rerender(<></>);
    });
  });

  test('validates email input', () => {
    render(
      <Input
        {...defaultProps}
        type="email"
        value="invalid-email"
        onBlur={MOCK_HANDLERS.onBlur}
      />
    );
    const input = screen.getByRole('textbox');
    fireEvent.blur(input);
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  test('displays error state correctly', () => {
    render(
      <Input
        {...defaultProps}
        error="This field is required"
      />
    );
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  test('handles disabled state correctly', () => {
    render(<Input {...defaultProps} disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  test('handles required field correctly', () => {
    render(<Input {...defaultProps} required label="Required Field" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-required', 'true');
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  test('handles change events', () => {
    render(<Input {...defaultProps} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test value' } });
    expect(MOCK_HANDLERS.onChange).toHaveBeenCalled();
  });

  test('handles blur events', () => {
    render(<Input {...defaultProps} onBlur={MOCK_HANDLERS.onBlur} />);
    fireEvent.blur(screen.getByRole('textbox'));
    expect(MOCK_HANDLERS.onBlur).toHaveBeenCalled();
  });

  // Requirement: Accessibility Requirements - Validate WCAG 2.1 AA compliance
  test('meets accessibility requirements', () => {
    render(
      <Input
        {...defaultProps}
        label="Test Label"
        error="Error message"
      />
    );
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-label', 'Test Label');
    expect(input).toHaveAttribute('aria-describedby', `${defaultProps.id}-error`);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});