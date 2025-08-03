import React, { useState, useEffect } from 'react';

interface AnimatedCounterProps {
  from?: number;
  to: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  formatter?: 'currency' | 'percentage' | 'number';
  color?: 'green' | 'red' | 'blue' | 'gray';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  decimals?: number;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  from = 0,
  to,
  duration = 1000,
  prefix = '',
  suffix = '',
  formatter = 'number',
  color = 'gray',
  size = 'md',
  decimals = 2
}) => {
  const [currentValue, setCurrentValue] = useState(from);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(true);
    const startTime = Date.now();
    const difference = to - from;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      
      const newValue = from + (difference * easeOutCubic);
      setCurrentValue(newValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCurrentValue(to);
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(animate);
  }, [from, to, duration]);

  const formatValue = (value: number) => {
    let formatted: string;
    
    switch (formatter) {
      case 'currency':
        formatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(value);
        break;
      case 'percentage':
        formatted = `${value.toFixed(decimals)}%`;
        break;
      case 'number':
      default:
        if (Math.abs(value) >= 1000000) {
          formatted = `${(value / 1000000).toFixed(1)}M`;
        } else if (Math.abs(value) >= 1000) {
          formatted = `${(value / 1000).toFixed(1)}K`;
        } else {
          formatted = value.toFixed(decimals);
        }
        break;
    }
    
    return `${prefix}${formatted}${suffix}`;
  };

  const getColorClass = () => {
    const baseClasses = {
      sm: 'text-sm',
      md: 'text-lg',
      lg: 'text-2xl',
      xl: 'text-4xl'
    };

    const colorClasses = {
      green: 'text-green-600',
      red: 'text-red-600',
      blue: 'text-blue-600',
      gray: 'text-gray-900'
    };

    return `${baseClasses[size]} ${colorClasses[color]} font-bold transition-all duration-300 ${
      isAnimating ? 'scale-110' : 'scale-100'
    }`;
  };

  return (
    <div className="flex items-center space-x-2">
      <span className={getColorClass()}>
        {formatValue(currentValue)}
      </span>
      {isAnimating && (
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
      )}
    </div>
  );
};

export default AnimatedCounter;