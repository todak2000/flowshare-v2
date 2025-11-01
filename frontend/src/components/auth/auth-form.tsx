"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { ErrorAlert } from "@/components/ui/alert";
import { type AppError } from "@/lib/error-handler";

interface AuthFormProps {
  onSubmit: (e: React.FormEvent) => Promise<void>;
  error: AppError | null;
  onErrorClose: () => void;
  loading: boolean;
  canSubmit: boolean;
  submitText: string;
  loadingText: string;
  footerContent: React.ReactNode;
  children: React.ReactNode;
}

export const AuthForm = ({
  onSubmit,
  error,
  onErrorClose,
  loading,
  canSubmit,
  submitText,
  loadingText,
  footerContent,
  children,
}: AuthFormProps) => {
  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      onSubmit={onSubmit}
      className="space-y-5"
    >
      {children}

      {/* Error alert */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <ErrorAlert
              title={error.title}
              message={error.message}
              action={error.action}
              onClose={onErrorClose}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit button */}
      <motion.button
        type="submit"
        disabled={!canSubmit || loading}
        whileHover={{ scale: canSubmit && !loading ? 1.02 : 1 }}
        whileTap={{ scale: canSubmit && !loading ? 0.98 : 1 }}
        className="relative w-full mt-6 py-3.5 rounded-xl font-semibold text-primary-foreground overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-primary/20"
      >
        {/* Gradient background */}
        <div className="absolute inset-0 bg-linear-to-r from-primary to-violet-600 transition-all duration-200 group-hover:from-primary/90 group-hover:to-violet-600/90" />

        {/* Shine effect */}
        <motion.div
          className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent"
          animate={{
            x: loading ? ["-100%", "100%"] : "-100%",
          }}
          transition={{
            duration: 1,
            repeat: loading ? Infinity : 0,
            ease: "linear",
          }}
        />

        {/* Button content */}
        <span className="relative flex items-center justify-center gap-2">
          {loading ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              />
              {loadingText}
            </>
          ) : (
            <>
              {submitText}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </span>
      </motion.button>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-8 text-center"
      >
        {footerContent}
      </motion.div>
    </motion.form>
  );
};