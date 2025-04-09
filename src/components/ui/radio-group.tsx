import React from 'react';

interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  onValueChange?: (value: string) => void;
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div 
        ref={ref}
        role="radiogroup"
        className={`space-y-2 ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

RadioGroup.displayName = 'RadioGroup';

export default RadioGroup; 