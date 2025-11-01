"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/layout/Logo";
import { LayoutDashboard } from "lucide-react";
import { navLinks } from "./landing-data";


interface LandingNavigationProps {
  isAuthenticated: boolean;
}

export function LandingNavigation({ isAuthenticated }: LandingNavigationProps) {
  const router = useRouter();

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/40 shadow-sm"
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <Logo />

          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-muted-foreground hover:text-foreground transition-colors font-medium relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
              </Link>
            ))}
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            {isAuthenticated ? (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => router.push("/dashboard")}
                  className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Go to Dashboard
                </Button>
              </motion.div>
            ) : (
              <>
                <Link href="/auth/login">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button variant="ghost">Sign In</Button>
                  </motion.div>
                </Link>
                <Link href="/payment/select-plan">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                      Get Started Free
                    </Button>
                  </motion.div>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}