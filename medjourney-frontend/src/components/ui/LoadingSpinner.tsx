import React from 'react';
import { cn } from '../../lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: 'primary' | 'white' | 'gray';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className,
  color = 'primary'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };
  
  const colorClasses = {
    primary: 'text-blue-600',
    white: 'text-white',
    gray: 'text-gray-400'
  };
  
  return (
    <div className={cn(
      'animate-spin rounded-full border-2 border-t-transparent',
      sizeClasses[size],
      colorClasses[color],
      'border-current',
      className
    )}>
      <span className="sr-only">加载中...</span>
    </div>
  );
};

export default LoadingSpinner;
