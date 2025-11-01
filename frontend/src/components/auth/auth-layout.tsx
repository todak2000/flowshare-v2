"use client";

import { motion } from "framer-motion";
import { Logo } from "@/components/layout/Logo";
import { useWindowSize } from "@/hooks/useWindowSize";

interface AuthLayoutProps {
  headerBadge?: React.ReactNode;
  subtitle: string;
  children: React.ReactNode;
}

// A memoized component for particles so they don't re-render
const AnimatedParticles = () => {
  const { width, height } = useWindowSize();
  const defaultW = 1200;
  const defaultH = 800;

  // Use default values until window size is available to prevent 0-positioning
  const w = width || defaultW;
  const h = height || defaultH;

  return (
    <>
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-4 h-4 bg-primary/90 rounded-full"
          animate={{
            y: [Math.random() * h, Math.random() * h],
            x: [Math.random() * w, Math.random() * w],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </>
  );
};

export const AuthLayout = ({
  headerBadge,
  subtitle,
  children,
}: AuthLayoutProps) => {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-linear-to-br from-background via-background to-muted/20 py-12">
      {/* Animated background gradients */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-linear-to-br from-primary/20 to-transparent rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-linear-to-tl from-violet-600/20 to-transparent rounded-full blur-3xl"
        />
      </div>

      <AnimatedParticles />

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md px-6" // Register page used max-w-lg, I standardized to max-w-md. Adjust as needed.
      >
        {/* Glass morphism card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="backdrop-blur-xl bg-card/80 shadow-2xl shadow-primary/5 rounded-3xl p-8 border-2 border-border/50"
        >
          {/* Logo and header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center mb-8 flex flex-col items-center gap-3"
          >
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Logo />
            </motion.div>
            
            {headerBadge}

            <p className="text-muted-foreground mt-2 text-lg">{subtitle}</p>
          </motion.div>

          {/* Form content goes here */}
          {children}
        </motion.div>
      </motion.div>
    </div>
  );
};