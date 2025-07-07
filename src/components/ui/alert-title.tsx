import React from 'react';

const AlertTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`font-bold ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

AlertTitle.displayName = 'AlertTitle';

export default AlertTitle; 