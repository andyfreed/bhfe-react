import React from 'react';

const RadioGroupItem = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', id, ...props }, ref) => {
    return (
      <input
        type="radio"
        ref={ref}
        id={id}
        className={`h-4 w-4 text-indigo-600 ${className}`}
        {...props}
      />
    );
  }
);

RadioGroupItem.displayName = 'RadioGroupItem';

export default RadioGroupItem; 