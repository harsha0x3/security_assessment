export const Card = ({ children, className = "", hover = false, ...props }) => {
  return (
    <div
      className={`
        bg-secondary border border-border rounded-xl shadow-sm
        ${
          hover
            ? "hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
            : ""
        }
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};
