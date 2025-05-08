import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  delay = 300,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ left: 0, top: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const childRef = useRef<HTMLElement>(null);
  let showTimeout: NodeJS.Timeout;

  const handleMouseEnter = () => {
    clearTimeout(showTimeout);
    showTimeout = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    clearTimeout(showTimeout);
    setIsVisible(false);
  };

  useEffect(() => {
    if (isVisible && childRef.current && tooltipRef.current) {
      const childRect = childRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      let left = 0;
      let top = 0;

      switch (position) {
        case 'top':
          left = childRect.left + (childRect.width / 2) - (tooltipRect.width / 2);
          top = childRect.top - tooltipRect.height - 8;
          break;
        case 'bottom':
          left = childRect.left + (childRect.width / 2) - (tooltipRect.width / 2);
          top = childRect.bottom + 8;
          break;
        case 'left':
          left = childRect.left - tooltipRect.width - 8;
          top = childRect.top + (childRect.height / 2) - (tooltipRect.height / 2);
          break;
        case 'right':
          left = childRect.right + 8;
          top = childRect.top + (childRect.height / 2) - (tooltipRect.height / 2);
          break;
      }

      // Adjust if tooltip would go off screen
      if (left < 0) left = 0;
      if (top < 0) top = 0;
      if (left + tooltipRect.width > window.innerWidth) {
        left = window.innerWidth - tooltipRect.width;
      }
      if (top + tooltipRect.height > window.innerHeight) {
        top = window.innerHeight - tooltipRect.height;
      }

      setTooltipPosition({ left, top });
    }
  }, [isVisible, position]);

  // Clone child element to attach the events
  const child = React.cloneElement(children, {
    ref: childRef,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
  });

  return (
    <>
      {child}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`absolute z-50 px-2 py-1 text-sm text-white bg-gray-800 rounded shadow-lg pointer-events-none ${className}`}
          style={{
            left: `${tooltipPosition.left}px`,
            top: `${tooltipPosition.top}px`,
          }}
        >
          {content}
        </div>
      )}
    </>
  );
};

export default Tooltip;