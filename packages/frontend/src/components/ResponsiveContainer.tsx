/**
 * Responsive Container
 *
 * Wrapper component that adapts layout based on screen size
 * Provides utilities for responsive behavior across the app
 */

import React, { useState, useEffect, createContext, useContext } from 'react';

type Breakpoint = 'mobile' | 'tablet' | 'desktop' | 'wide';

interface ResponsiveContextValue {
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWide: boolean;
  width: number;
  height: number;
}

const ResponsiveContext = createContext<ResponsiveContextValue>({
  breakpoint: 'desktop',
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  isWide: false,
  width: 1920,
  height: 1080
});

export const useResponsive = () => useContext(ResponsiveContext);

interface ResponsiveContainerProps {
  children: React.ReactNode;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({ children }) => {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Determine breakpoint
  const getBreakpoint = (width: number): Breakpoint => {
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    if (width < 1440) return 'desktop';
    return 'wide';
  };

  const breakpoint = getBreakpoint(dimensions.width);

  const contextValue: ResponsiveContextValue = {
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop' || breakpoint === 'wide',
    isWide: breakpoint === 'wide',
    width: dimensions.width,
    height: dimensions.height
  };

  return (
    <ResponsiveContext.Provider value={contextValue}>
      {children}
    </ResponsiveContext.Provider>
  );
};

// Responsive Grid Component
interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: number;
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 4,
  className = ''
}) => {
  const { isMobile, isTablet } = useResponsive();

  const gridCols = isMobile
    ? cols.mobile || 1
    : isTablet
    ? cols.tablet || 2
    : cols.desktop || 3;

  return (
    <div
      className={`grid gap-${gap} ${className}`}
      style={{
        gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`
      }}
    >
      {children}
    </div>
  );
};

// Responsive Stack Component (vertical on mobile, horizontal on desktop)
interface ResponsiveStackProps {
  children: React.ReactNode;
  direction?: 'vertical-mobile' | 'horizontal-mobile';
  gap?: number;
  className?: string;
}

export const ResponsiveStack: React.FC<ResponsiveStackProps> = ({
  children,
  direction = 'vertical-mobile',
  gap = 4,
  className = ''
}) => {
  const { isMobile } = useResponsive();

  const isVertical =
    (direction === 'vertical-mobile' && isMobile) ||
    (direction === 'horizontal-mobile' && !isMobile);

  return (
    <div
      className={`flex ${isVertical ? 'flex-col' : 'flex-row'} gap-${gap} ${className}`}
    >
      {children}
    </div>
  );
};

// Show/Hide based on breakpoint
interface ShowProps {
  on?: Breakpoint[];
  children: React.ReactNode;
}

export const Show: React.FC<ShowProps> = ({ on = ['desktop'], children }) => {
  const { breakpoint } = useResponsive();

  if (!on.includes(breakpoint)) {
    return null;
  }

  return <>{children}</>;
};

interface HideProps {
  on?: Breakpoint[];
  children: React.ReactNode;
}

export const Hide: React.FC<HideProps> = ({ on = ['mobile'], children }) => {
  const { breakpoint } = useResponsive();

  if (on.includes(breakpoint)) {
    return null;
  }

  return <>{children}</>;
};

// Responsive Card with adaptive padding
interface ResponsiveCardProps {
  children: React.ReactNode;
  className?: string;
}

export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  className = ''
}) => {
  const { isMobile } = useResponsive();

  return (
    <div
      className={`bg-white border-2 border-slate-300 rounded-lg shadow-sm ${
        isMobile ? 'p-4' : 'p-6'
      } ${className}`}
    >
      {children}
    </div>
  );
};

// Responsive Modal that becomes full-screen on mobile
interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
}

export const ResponsiveModal: React.FC<ResponsiveModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  maxWidth = '3xl'
}) => {
  const { isMobile } = useResponsive();

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl'
  }[maxWidth];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`fixed ${isMobile ? 'inset-0' : 'inset-4'} z-50 flex items-center justify-center p-4`}>
        <div
          className={`bg-white rounded-lg shadow-2xl ${
            isMobile ? 'w-full h-full' : `${maxWidthClass} w-full max-h-[90vh]`
          } flex flex-col`}
        >
          {/* Header */}
          {title && (
            <div className="border-b-2 border-slate-300 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">{title}</h2>
              <button
                onClick={onClose}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

export default ResponsiveContainer;
