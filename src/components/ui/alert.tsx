import React from 'react';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive' | 'success';
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className = '', variant = 'default', children, ...props }, ref) => {
    const variantStyles = {
      default: 'bg-blue-50 border border-blue-400 text-blue-700',
      destructive: 'bg-red-50 border border-red-400 text-red-700',
      success: 'bg-green-50 border border-green-400 text-green-700',
    };
    
    return (
      <div
        ref={ref}
        role="alert"
        className={`px-4 py-3 rounded relative ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Alert.displayName = 'Alert';

export { Alert };
export default Alert; 