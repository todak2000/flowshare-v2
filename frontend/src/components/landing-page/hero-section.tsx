"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Check, ArrowRight } from "lucide-react";
import { fadeIn, staggerContainer } from "./variants";
import { heroTrialFeatures } from "./landing-data";


export function HeroSection() {
  return (
    <section className="pt-32 pb-24 px-6 relative overflow-hidden">
      {/* Animated background gradient */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent"
      />
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl"
      />

      <div className="container mx-auto relative">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="max-w-5xl mx-auto text-center"
        >
          <motion.div variants={fadeIn}>
            <Badge
              variant="secondary"
              className="mb-6 px-4 py-2 text-sm font-medium shadow-sm hover:shadow-md transition-shadow"
            >
              <Sparkles className="w-4 h-4 mr-2 inline-block" />
              AI-Powered Reconciliation Platform
            </Badge>
          </motion.div>

          <motion.h1
            variants={fadeIn}
            className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-[1.1] tracking-tight"
          >
            <span className="bg-linear-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
              Hydrocarbon Allocation,
            </span>
            <br />
            <motion.span
              className="bg-linear-to-r from-primary via-violet-600 to-primary bg-clip-text text-transparent inline-block"
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{
                backgroundSize: "200% auto",
              }}
            >
              Automated & Precise
            </motion.span>
          </motion.h1>

          <motion.p
            variants={fadeIn}
            className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            Transform weeks of manual reconciliation into minutes with
            AI-powered automation.
            <span className="block mt-2 text-lg">
              API MPMS 11.1 compliant • Real-time anomaly detection •
              Production-grade accuracy
            </span>
          </motion.p>

          <motion.div
            variants={fadeIn}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
          >
            <Link href="/payment/select-plan">
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-lg px-10 py-7 rounded-xl shadow-xl shadow-primary/20 group"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            </Link>
            <Link href="#demo">
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-10 py-7 rounded-xl border-2"
                >
                  Watch Demo
                </Button>
              </motion.div>
            </Link>
          </motion.div>

          <motion.div
            variants={fadeIn}
            className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground"
          >
            {heroTrialFeatures.map((text, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
              >
                <Check className="h-4 w-4 text-success" />
                <span>{text}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}