// src/components/ui/Button.jsx
import { Loader } from "lucide-react";

const Button = ({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = "left",
  className = "",
  onClick,
  ...props
}) => {
  const baseClasses = `
    inline-flex items-center justify-center font-medium rounded-xl
    transition-all duration-300 ease-in-out active:scale-95
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
  `;

  const variants = {
    primary:
      "bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg focus:ring-primary/30",
    accent:
      "bg-accent hover:bg-accent/90 text-white shadow-md hover:shadow-lg focus:ring-accent/30",
    secondary:
      "bg-secondary hover:bg-accent text-text border border-border hover:border-borderHover focus:ring-accent/30",
    ghost:
      "bg-transparent hover:bg-secondary text-textSecondary hover:text-text focus:ring-accent/30",
    outline:
      "bg-transparent border-2 border-accent text-accent hover:bg-accent hover:text-white focus:ring-accent/30",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
    xl: "px-8 py-4 text-lg",
  };

  const isDisabled = disabled || loading;

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isDisabled}
      onClick={onClick}
      {...props}
    >
      {loading && <Loader className="w-4 h-4 animate-spin mr-2" />}

      {Icon && iconPosition === "left" && !loading && (
        <Icon className="w-4 h-4 mr-2" />
      )}

      {children}

      {Icon && iconPosition === "right" && !loading && (
        <Icon className="w-4 h-4 ml-2" />
      )}
    </button>
  );
};
export default Button;
