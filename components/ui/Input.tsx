import React, { forwardRef } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightElement,
      id,
      className = "",
      required,
      disabled,
      ...props
    },
    ref
  ) => {
    // Generate a fallback id if none provided but label exists
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-slate-700 tracking-tight"
          >
            {label}
            {required && <span className="text-brand ml-1" title="Campo requerido">*</span>}
          </label>
        )}

        <div className="relative rounded-lg shadow-xs">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            required={required}
            disabled={disabled}
            className={`
              w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-[#18181B] placeholder:text-slate-400
              transition-all duration-150 ease-in-out
              outline-none
              ${leftIcon ? "pl-10" : ""}
              ${rightElement ? "pr-11" : ""}
              ${
                error
                  ? "border-rose-300 focus:border-rose-500 focus:ring-3 focus:ring-rose-500/15"
                  : "border-slate-300 hover:border-slate-400 focus:border-brand focus:ring-3 focus:ring-brand/15"
              }
              ${disabled ? "bg-slate-50 text-slate-500 cursor-not-allowed border-slate-200" : ""}
              ${className}
            `}
            {...props}
          />

          {rightElement && (
            <div className="absolute inset-y-0 right-0 pr-1.5 flex items-center">
              {rightElement}
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs text-rose-600 font-medium">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-xs text-slate-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
