/**
 * Accessibility Enhancements
 *
 * Utilities and components for improved accessibility:
 * - Keyboard navigation
 * - Focus management
 * - Screen reader announcements
 * - Skip links
 * - ARIA live regions
 */

import React, { useEffect, useRef, createContext, useContext, useState } from 'react';

// Accessibility Context
interface A11yContextValue {
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  focusElement: (element: HTMLElement | null) => void;
}

const A11yContext = createContext<A11yContextValue>({
  announce: () => {},
  focusElement: () => {}
});

export const useA11y = () => useContext(A11yContext);

// Accessibility Provider
interface A11yProviderProps {
  children: React.ReactNode;
}

export const A11yProvider: React.FC<A11yProviderProps> = ({ children }) => {
  const politeRef = useRef<HTMLDivElement>(null);
  const assertiveRef = useRef<HTMLDivElement>(null);

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const ref = priority === 'assertive' ? assertiveRef : politeRef;
    if (ref.current) {
      ref.current.textContent = message;
      // Clear after a delay
      setTimeout(() => {
        if (ref.current) {
          ref.current.textContent = '';
        }
      }, 1000);
    }
  };

  const focusElement = (element: HTMLElement | null) => {
    if (element) {
      element.focus();
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <A11yContext.Provider value={{ announce, focusElement }}>
      {children}
      {/* Screen reader announcements */}
      <div
        ref={politeRef}
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      />
      <div
        ref={assertiveRef}
        className="sr-only"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      />
    </A11yContext.Provider>
  );
};

// Skip Navigation Links
export const SkipLinks: React.FC = () => {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <a
        href="#main-content"
        className="fixed top-0 left-0 z-[100] bg-indigo-600 text-white px-4 py-2 m-2 rounded focus:outline-none focus:ring-4 focus:ring-indigo-300"
      >
        Skip to main content
      </a>
      <a
        href="#navigation"
        className="fixed top-0 left-24 z-[100] bg-indigo-600 text-white px-4 py-2 m-2 rounded focus:outline-none focus:ring-4 focus:ring-indigo-300"
      >
        Skip to navigation
      </a>
    </div>
  );
};

// Keyboard Navigation Hook
export const useKeyboardNav = (
  items: any[],
  onSelect: (index: number) => void,
  enabled: boolean = true
) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
        case 'j':
          e.preventDefault();
          setSelectedIndex((prev) => {
            const next = (prev + 1) % items.length;
            return next;
          });
          break;

        case 'ArrowUp':
        case 'k':
          e.preventDefault();
          setSelectedIndex((prev) => {
            const next = prev === 0 ? items.length - 1 : prev - 1;
            return next;
          });
          break;

        case 'Enter':
        case ' ':
          e.preventDefault();
          onSelect(selectedIndex);
          break;

        case 'Home':
          e.preventDefault();
          setSelectedIndex(0);
          break;

        case 'End':
          e.preventDefault();
          setSelectedIndex(items.length - 1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, items.length, selectedIndex, onSelect]);

  return { selectedIndex, setSelectedIndex };
};

// Focus Trap (for modals)
export const useFocusTrap = (isActive: boolean) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    // Save previous focus
    previousFocusRef.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    if (!container) return;

    // Get all focusable elements
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element
    firstElement.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      // Restore previous focus
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isActive]);

  return containerRef;
};

// Visually Hidden (screen reader only)
interface VisuallyHiddenProps {
  children: React.ReactNode;
}

export const VisuallyHidden: React.FC<VisuallyHiddenProps> = ({ children }) => {
  return <span className="sr-only">{children}</span>;
};

// Keyboard Shortcut Indicator
interface KeyboardShortcutProps {
  keys: string[];
  description: string;
}

export const KeyboardShortcut: React.FC<KeyboardShortcutProps> = ({ keys, description }) => {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-slate-600">{description}:</span>
      <div className="flex gap-1">
        {keys.map((key, idx) => (
          <kbd
            key={idx}
            className="px-2 py-1 bg-slate-100 border border-slate-300 rounded text-xs font-mono"
          >
            {key}
          </kbd>
        ))}
      </div>
    </div>
  );
};

// Keyboard Shortcuts Help Panel
interface KeyboardShortcutsHelpProps {
  shortcuts: Array<{
    keys: string[];
    description: string;
    category?: string;
  }>;
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({
  shortcuts,
  isOpen,
  onClose
}) => {
  const containerRef = useFocusTrap(isOpen);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        // Toggle help
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    const category = shortcut.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(shortcut);
    return acc;
  }, {} as Record<string, typeof shortcuts>);

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose} />
      <div
        ref={containerRef}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
      >
        <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
          <div className="border-b-2 border-slate-300 p-4 flex items-center justify-between">
            <h2 id="shortcuts-title" className="text-xl font-bold text-slate-900">
              ⌨️ Keyboard Shortcuts
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
              aria-label="Close shortcuts help"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
              <div key={category} className="mb-6 last:mb-0">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">
                  {category}
                </h3>
                <div className="space-y-2">
                  {categoryShortcuts.map((shortcut, idx) => (
                    <KeyboardShortcut
                      key={idx}
                      keys={shortcut.keys}
                      description={shortcut.description}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t-2 border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-600">
            Press <kbd className="px-2 py-1 bg-slate-200 rounded">Esc</kbd> to close
          </div>
        </div>
      </div>
    </>
  );
};

// Progress Indicator (accessible)
interface AccessibleProgressProps {
  value: number;
  max?: number;
  label: string;
  showPercentage?: boolean;
}

export const AccessibleProgress: React.FC<AccessibleProgressProps> = ({
  value,
  max = 100,
  label,
  showPercentage = true
}) => {
  const percentage = Math.round((value / max) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-900">{label}</label>
        {showPercentage && <span className="text-sm text-slate-600">{percentage}%</span>}
      </div>
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`${label}: ${percentage}%`}
        className="w-full bg-slate-200 rounded-full h-3 overflow-hidden"
      >
        <div
          className="bg-indigo-600 h-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// Status Badge (accessible with ARIA)
interface StatusBadgeProps {
  status: 'success' | 'warning' | 'error' | 'info';
  children: React.ReactNode;
  ariaLabel?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, children, ariaLabel }) => {
  const styles = {
    success: 'bg-green-100 text-green-800 border-green-300',
    warning: 'bg-amber-100 text-amber-800 border-amber-300',
    error: 'bg-red-100 text-red-800 border-red-300',
    info: 'bg-blue-100 text-blue-800 border-blue-300'
  };

  const icons = {
    success: '✓',
    warning: '⚠️',
    error: '✗',
    info: 'ℹ️'
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 border rounded-full text-sm font-semibold ${styles[status]}`}
      role="status"
      aria-label={ariaLabel || `${status}: ${children}`}
    >
      <span aria-hidden="true">{icons[status]}</span>
      {children}
    </span>
  );
};

export default A11yProvider;
