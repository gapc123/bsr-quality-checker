/**
 * Mobile Navigation Bar
 *
 * Touch-friendly bottom navigation for mobile devices
 * Provides quick access to key dashboard sections
 * Includes gesture support and smooth transitions
 */

import React, { useState } from 'react';
import { useResponsive } from './ResponsiveContainer';

interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  badge?: number;
  onClick: () => void;
}

interface MobileNavigationBarProps {
  items: NavigationItem[];
  activeItem?: string;
}

export const MobileNavigationBar: React.FC<MobileNavigationBarProps> = ({
  items,
  activeItem
}) => {
  const { isMobile } = useResponsive();

  if (!isMobile) {
    return null;
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-slate-300 shadow-lg z-30"
      role="navigation"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around p-2">
        {items.map((item) => {
          const isActive = activeItem === item.id;

          return (
            <button
              key={item.id}
              onClick={item.onClick}
              className={`flex flex-col items-center justify-center flex-1 py-2 px-1 rounded-lg transition-all ${
                isActive
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                <span className="text-2xl" role="img">
                  {item.icon}
                </span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-xs font-semibold mt-1 ${isActive ? 'text-indigo-600' : 'text-slate-600'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

// Mobile Action Menu (Slide-up drawer)
interface MobileActionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  actions: Array<{
    id: string;
    label: string;
    icon: string;
    description?: string;
    onClick: () => void;
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  }>;
}

export const MobileActionMenu: React.FC<MobileActionMenuProps> = ({
  isOpen,
  onClose,
  title,
  actions
}) => {
  const { isMobile } = useResponsive();

  if (!isMobile || !isOpen) {
    return null;
  }

  const getVariantStyles = (variant: string = 'default') => {
    switch (variant) {
      case 'primary':
        return 'bg-indigo-50 border-indigo-300 text-indigo-900';
      case 'success':
        return 'bg-green-50 border-green-300 text-green-900';
      case 'warning':
        return 'bg-amber-50 border-amber-300 text-amber-900';
      case 'danger':
        return 'bg-red-50 border-red-300 text-red-900';
      default:
        return 'bg-slate-50 border-slate-300 text-slate-900';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Slide-up Menu */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 animate-slide-up max-h-[80vh] overflow-hidden flex flex-col">
        {/* Handle */}
        <div className="flex justify-center py-2">
          <div className="w-12 h-1 bg-slate-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="border-b-2 border-slate-300 px-4 py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={() => {
                action.onClick();
                onClose();
              }}
              className={`w-full flex items-start gap-3 p-4 border-2 rounded-lg transition-colors ${getVariantStyles(
                action.variant
              )} hover:bg-opacity-70`}
            >
              <span className="text-2xl" role="img">
                {action.icon}
              </span>
              <div className="flex-1 text-left">
                <div className="font-semibold">{action.label}</div>
                {action.description && (
                  <div className="text-sm opacity-80 mt-1">{action.description}</div>
                )}
              </div>
              <span className="text-slate-400">→</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

// Mobile Filter Pills (Horizontal scrolling)
interface MobileFilterPillsProps {
  filters: Array<{
    id: string;
    label: string;
    count?: number;
  }>;
  activeFilter: string;
  onFilterChange: (filterId: string) => void;
}

export const MobileFilterPills: React.FC<MobileFilterPillsProps> = ({
  filters,
  activeFilter,
  onFilterChange
}) => {
  const { isMobile } = useResponsive();

  if (!isMobile) {
    return null;
  }

  return (
    <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
      <div className="flex gap-2 pb-2">
        {filters.map((filter) => {
          const isActive = activeFilter === filter.id;

          return (
            <button
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full font-semibold text-sm transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {filter.label}
              {filter.count !== undefined && (
                <span className={`ml-2 ${isActive ? 'text-indigo-200' : 'text-slate-500'}`}>
                  ({filter.count})
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Touch-friendly Card with tap gestures
interface TouchableCardProps {
  children: React.ReactNode;
  onTap?: () => void;
  onLongPress?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  className?: string;
}

export const TouchableCard: React.FC<TouchableCardProps> = ({
  children,
  onTap,
  onLongPress,
  onSwipeLeft,
  onSwipeRight,
  className = ''
}) => {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; time: number } | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    });

    // Start long press timer
    if (onLongPress) {
      const timer = setTimeout(() => {
        onLongPress();
      }, 500);
      setLongPressTimer(timer);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    if (!touchStart) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    const deltaTime = Date.now() - touchStart.time;

    // Check if it's a swipe
    const isSwipe = Math.abs(deltaX) > 50 && Math.abs(deltaY) < 50 && deltaTime < 300;

    if (isSwipe) {
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    } else if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && deltaTime < 300) {
      // It's a tap
      if (onTap) {
        onTap();
      }
    }

    setTouchStart(null);
  };

  const handleTouchMove = () => {
    // Cancel long press if finger moves
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      className={`touch-manipulation select-none ${className}`}
    >
      {children}
    </div>
  );
};

export default MobileNavigationBar;
