import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, className = '', id, ...props }, ref) => {
    const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
    
    return (
      <div className="w-full flex flex-col gap-1.5 mb-4">
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
        <input
          id={inputId}
          ref={ref}
          className={`w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 transition-all duration-300 ease-in-out focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-slate-400 ${className}`}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = 'Input';
