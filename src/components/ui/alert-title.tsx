import React from 'react';

interface AlertTitleProps extends React.HTMLAttributes<HTMLDivElement> {}

const AlertTitle = React.forwardRef<HTMLDivElement, AlertTitleProps>(
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