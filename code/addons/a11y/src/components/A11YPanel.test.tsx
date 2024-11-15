// @vitest-environment happy-dom
import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import React from 'react';

import { A11YPanel } from './A11YPanel';
import { type A11yContextStore, useA11yContext } from './A11yContext';

vi.mock('./A11yContext');
const mockedUseA11yContext = vi.mocked(useA11yContext);

describe('A11YPanel', () => {
  it('should render initializing state', () => {
    mockedUseA11yContext.mockReturnValue({
      results: { passes: [], incomplete: [], violations: [] },
      status: 'initial',
      handleManual: vi.fn(),
      error: null,
    } as Partial<A11yContextStore> as any);

    const element = render(<A11YPanel />);

    expect(element.getByText('Initializing...')).toBeInTheDocument();
  });

  it('should render manual state', () => {
    const handleManual = vi.fn();
    mockedUseA11yContext.mockReturnValue({
      results: { passes: [], incomplete: [], violations: [] },
      status: 'manual',
      handleManual,
      error: null,
    } as Partial<A11yContextStore> as any);

    render(<A11YPanel />);

    expect(screen.getByText('Manually run the accessibility scan.')).toBeInTheDocument();
    const runTestButton = screen.getByText('Run test');
    expect(runTestButton).toBeInTheDocument();

    fireEvent.click(runTestButton);
    expect(handleManual).toHaveBeenCalled();
  });

  it('should render running state', () => {
    mockedUseA11yContext.mockReturnValue({
      results: { passes: [], incomplete: [], violations: [] },
      status: 'running',
      handleManual: vi.fn(),
      error: null,
    } as Partial<A11yContextStore> as any);

    render(<A11YPanel />);

    expect(
      screen.getByText('Please wait while the accessibility scan is running ...')
    ).toBeInTheDocument();
  });

  it('should render ready state with results', () => {
    const handleManual = vi.fn();
    mockedUseA11yContext.mockReturnValue({
      results: {
        passes: [{ id: 'pass1' } as any],
        incomplete: [{ id: 'incomplete1' } as any],
        violations: [{ id: 'violation1' } as any],
      },
      status: 'ready',
      handleManual,
      error: null,
    } as Partial<A11yContextStore> as any);

    render(<A11YPanel />);

    expect(screen.getByText('1 Violations')).toBeInTheDocument();
    expect(screen.getByText('1 Passes')).toBeInTheDocument();
    expect(screen.getByText('1 Incomplete')).toBeInTheDocument();

    const rerunTestsButton = screen.getByText('Rerun tests');
    expect(rerunTestsButton).toBeInTheDocument();

    fireEvent.click(rerunTestsButton);
    expect(handleManual).toHaveBeenCalled();
  });

  it('should render error state', () => {
    mockedUseA11yContext.mockReturnValue({
      results: { passes: [], incomplete: [], violations: [] },
      status: 'error',
      handleManual: vi.fn(),
      error: 'Test error message',
    } as Partial<A11yContextStore> as any);

    render(<A11YPanel />);

    expect(screen.getByText('The accessibility scan encountered an error.')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('should render error state with object error', () => {
    mockedUseA11yContext.mockReturnValue({
      results: { passes: [], incomplete: [], violations: [] },
      status: 'error',
      handleManual: vi.fn(),
      error: { message: 'Test error object message' },
    } as Partial<A11yContextStore> as any);

    render(<A11YPanel />);

    expect(screen.getByText('The accessibility scan encountered an error.')).toBeInTheDocument();
    expect(
      screen.getByText(JSON.stringify({ message: 'Test error object message' }))
    ).toBeInTheDocument();
  });
});
