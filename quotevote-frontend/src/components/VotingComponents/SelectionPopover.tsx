'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export interface SelectionPopoverProps {
  showPopover: boolean;
  topOffset?: number;
  onSelect: (selection: Selection) => void;
  onDeselect: () => void;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

interface PopoverBox {
  top: number;
  left?: number;
  right?: number;
}

/**
 * Check if a valid text selection exists
 */
function selectionExists(): boolean {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return false;

  try {
    const range = selection.getRangeAt(0);
    if (range.collapsed) return false;

    const rect = range.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  } catch {
    return false;
  }
}

/**
 * Clear the current text selection
 */
function clearSelection(): void {
  if (window.getSelection) {
    window.getSelection()?.removeAllRanges();
  } else if ((document as any).selection) {
    (document as any).selection.empty();
  }
}

/**
 * SelectionPopover - Popover that appears on text selection
 * 
 * Features:
 * - Automatic positioning based on selection
 * - Responsive positioning for mobile/tablet/desktop
 * - Click outside to close
 * - Selection expansion on hover
 */
export function SelectionPopover({
  showPopover,
  topOffset = 30,
  onSelect,
  onDeselect,
  children,
  style,
}: SelectionPopoverProps): JSX.Element {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverBox, setPopoverBox] = useState<PopoverBox>({
    top: 0,
    left: 0,
  });

  /**
   * Compute popover position based on selection
   */
  const computePopoverBox = useCallback((): void => {
    const selection = window.getSelection();
    if (!selectionExists() || !selection) return;

    try {
      const selectionBox = selection.getRangeAt(0).getBoundingClientRect();
      const popoverElement = popoverRef.current;
      if (!popoverElement) return;

      const popoverRect = popoverElement.getBoundingClientRect();
      const targetElement = document.querySelector('[data-selectable]');
      if (!targetElement) return;

      const targetBox = targetElement.getBoundingClientRect();
      const halfWindowWidth = window.innerWidth / 2;

      // Desktop: Center the popover above selection
      if (window.innerWidth > 960) {
        setPopoverBox({
          top: selectionBox.top - 80 - targetBox.top - topOffset,
          left:
            selectionBox.width / 2 -
            popoverRect.width / 2 +
            (selectionBox.left - targetBox.left),
        });
      }
      // Tablet: Position based on which side of screen
      else if (window.innerWidth > 500 && window.innerWidth <= 960) {
        if (selectionBox.x > halfWindowWidth) {
          setPopoverBox({
            top: selectionBox.top - 80 - targetBox.top - topOffset,
            right: window.innerWidth - selectionBox.x + 285,
          });
        } else {
          setPopoverBox({
            top: selectionBox.top - 80 - targetBox.top - topOffset,
            left: selectionBox.left - targetBox.left,
          });
        }
      }
      // Mobile: Simple top positioning
      else {
        setPopoverBox({
          top: selectionBox.top - 80 - targetBox.top - topOffset,
          left: 20, // Fixed left margin for mobile
        });
      }
    } catch (error) {
      console.error('Error computing popover position:', error);
    }
  }, [topOffset]);

  /**
   * Handle selection change
   */
  const handleSelectionChange = useCallback((): void => {
    const selection = window.getSelection();
    if (!selection) return;

    if (selectionExists()) {
      onSelect(selection);
      computePopoverBox();
    } else {
      onDeselect();
    }
  }, [onSelect, onDeselect, computePopoverBox]);

  /**
   * Handle mouse enter - expand selection to full word
   */
  const handleMouseEnter = useCallback((): void => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    try {
      const range = selection.getRangeAt(0);
      range.expand('word');
      onSelect(selection);
    } catch (error) {
      // Some browsers don't support range.expand
      console.warn('Range expand not supported:', error);
    }
  }, [onSelect]);

  /**
   * Handle click outside to close popover
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        onDeselect();
      }
    };

    if (showPopover) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPopover, onDeselect]);

  /**
   * Setup selection listeners
   */
  useEffect(() => {
    const target = document.querySelector('[data-selectable]');
    if (!target) return;

    target.addEventListener('pointerup', handleSelectionChange);
    target.addEventListener('pointermove', handleSelectionChange);

    return () => {
      target.removeEventListener('pointerup', handleSelectionChange);
      target.removeEventListener('pointermove', handleSelectionChange);
    };
  }, [handleSelectionChange]);

  /**
   * Clear selection when popover is hidden
   */
  useEffect(() => {
    if (!showPopover) {
      clearSelection();
    }
  }, [showPopover]);

  /**
   * Recompute position on window resize
   */
  useEffect(() => {
    if (!showPopover) return;

    const handleResize = (): void => {
      if (selectionExists()) {
        computePopoverBox();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showPopover, computePopoverBox]);

  const visibility = showPopover ? 'visible' : 'hidden';
  const display = showPopover ? 'inline-block' : 'none';

  return (
    <div
      id="selectionPopover"
      ref={popoverRef}
      onMouseEnter={handleMouseEnter}
      style={{
        visibility,
        display,
        position: 'absolute',
        top: `${popoverBox.top}px`,
        left: popoverBox.left !== undefined ? `${popoverBox.left}px` : undefined,
        right:
          popoverBox.right !== undefined ? `${popoverBox.right}px` : undefined,
        zIndex: 1000,
        ...style,
      }}
    >
      {showPopover && children}
    </div>
  );
}
