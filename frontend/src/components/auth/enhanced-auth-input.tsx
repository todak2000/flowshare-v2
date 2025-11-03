"use client";

import { InputHTMLAttributes, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Check, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ValidationRule {
  test: (value: string) => boolean;
  message: string;
}

interface EnhancedAuthInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  icon?: React.ReactNode;
  error?: string;
  hint?: string;
  showValidation?: boolean;
  validationRules?: ValidationRule[];
  onChange?: (value: string, isValid: boolean) => void;
  onBlur?: () => void;
}

export function EnhancedAuthInput({
  label,
  icon,
  type = "text",
  error,
  hint,
  showValidation = false,
  validationRules = [],
  className,
  onChange,
  onBlur,
  value = "",
  ...props
}: EnhancedAuthInputProps) {
  const [internalValue, setInternalValue] = useState(value as string);
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);

    // Validate and call onChange immediately on user input
    if (validationRules.length > 0) {
      const errors = validationRules
        .filter(rule => !rule.test(newValue))
        .map(rule => rule.message);
      setValidationErrors(errors);

      if (onChange) {
        onChange(newValue, errors.length === 0);
      }
    } else if (onChange) {
      onChange(newValue, true);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    setTouched(true);
    onBlur?.();
  };

  const hasError = error || (touched && validationErrors.length > 0);
  const isValid = touched && internalValue.length > 0 && validationErrors.length === 0;

  return (
    <div className="space-y-2">
      <label htmlFor={props.id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>

      <div className="relative">
        {/* Icon */}
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200">
            {icon}
          </div>
        )}

        {/* Input */}
        <input
          {...props}
          type={inputType}
          value={internalValue}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          className={cn(
            "w-full rounded-lg border bg-white text-black/80 placeholder:text-black/50 px-4 py-3 text-sm transition-all duration-200",
            "focus:outline-none focus:ring-2",
            icon && "pl-10",
            isPassword && "pr-20",
            !isPassword && (isValid || hasError) && "pr-10",
            hasError
              ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
              : isValid
              ? "border-green-300 focus:border-green-500 focus:ring-green-500/20"
              : isFocused
              ? "border-blue-500 ring-2 ring-blue-500/20"
              : "border-gray-300 hover:border-gray-400",
            className
          )}
        />

        {/* Right side icons */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {/* Validation status icon */}
          <AnimatePresence mode="wait">
            {!isPassword && isValid && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <Check className="h-4 w-4 text-green-500" />
              </motion.div>
            )}
            {!isPassword && hasError && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <X className="h-4 w-4 text-red-500" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Password toggle */}
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}
        </div>

        {/* Focus border animation */}
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          initial={false}
          animate={{
            boxShadow: isFocused
              ? hasError
                ? "0 0 0 3px rgba(239, 68, 68, 0.1)"
                : "0 0 0 3px rgba(59, 130, 246, 0.1)"
              : "0 0 0 0px rgba(59, 130, 246, 0)",
          }}
          transition={{ duration: 0.2 }}
        />
      </div>

      {/* Hint text */}
      {hint && !hasError && !showValidation && (
        <p className="text-xs text-gray-500">{hint}</p>
      )}

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-start gap-1.5 text-sm text-red-600"
          >
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Validation rules (for password strength, etc.) */}
      {showValidation && touched && validationRules.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-1.5 pt-2"
        >
          {validationRules.map((rule, index) => {
            const isPassing = rule.test(internalValue);
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-2 text-xs"
              >
                <motion.div
                  initial={false}
                  animate={{
                    scale: isPassing ? 1 : 0.8,
                    rotate: isPassing ? 0 : -180,
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  {isPassing ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <X className="h-3.5 w-3.5 text-gray-400" />
                  )}
                </motion.div>
                <span
                  className={cn(
                    "transition-colors",
                    isPassing ? "text-green-600" : "text-gray-500"
                  )}
                >
                  {rule.message}
                </span>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
