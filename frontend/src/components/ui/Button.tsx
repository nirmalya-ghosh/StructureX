interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
}

export function Button({ children, variant = 'primary', className = '', ...props }: ButtonProps) {
  const baseStyles = "w-full py-2.5 px-4 rounded-lg font-medium transition-all duration-300 ease-in-out transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg focus:ring-blue-500",
    secondary: "bg-slate-800 hover:bg-slate-900 text-white shadow-md hover:shadow-lg focus:ring-slate-800",
    outline: "bg-transparent border-2 border-slate-200 hover:border-slate-300 text-slate-700 focus:ring-slate-200",
    danger: "bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg focus:ring-red-500"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
