import React, { ButtonHTMLAttributes } from 'react';
import classNames from 'classnames';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className,
  isLoading = false,
  icon,
  fullWidth = false,
  disabled,
  ...rest
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded focus:outline-none transition';
  
  const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50',
    outline: 'bg-transparent border border-blue-500 text-blue-500 hover:bg-blue-50 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-2 focus:ring-red-500 focus:ring-opacity-50',
  };
  
  const sizeStyles = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };
  
  const disabledStyles = 'opacity-50 cursor-not-allowed pointer-events-none';
  
  const buttonClasses = classNames(
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    fullWidth ? 'w-full' : '',
    (disabled || isLoading) ? disabledStyles : '',
    className
  );

  return (
    <button
      className={buttonClasses}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {icon && !isLoading && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;