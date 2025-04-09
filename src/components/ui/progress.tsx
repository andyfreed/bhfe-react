import React from 'react';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className = '', value = 0, max = 100, ...props }, ref) => {
    const percent = (value / max) * 100;
    
    return (
      <div 
        ref={ref}
        className={`w-full bg-gray-200 rounded-full h-2.5 ${className}`}
        {...props}
      >
        <div 
          className="bg-blue-600 h-2.5 rounded-full" 
          style={{ width: `${percent}%` }}
        />
      </div>
    );
  }
);

Progress.displayName = 'Progress';

export default Progress; 