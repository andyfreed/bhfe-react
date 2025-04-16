import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <textarea
        className={`mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-800 px-3 py-2.5 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:ring-opacity-50 focus:bg-indigo-50 focus:bg-opacity-30 transition-all duration-200 sm:text-sm ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea; 