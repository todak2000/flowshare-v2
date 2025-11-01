"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { fadeIn } from "./variants";

export function FinalCtaSection() {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeIn}
      className="py-32 px-6 bg-linear-to-br from-primary via-violet-600 to-primary text-primary-foreground relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.3, 0.2],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute inset-0 bg-linear-to-br from-white/10 to-transparent blur-3xl"
      />
      <div className="container mx-auto text-center relative">
        <motion.h2
          initial={{ scale: 0.9, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-6xl font-bold mb-8"
        >
          Ready to Revolutionize Your Reconciliation?
        </motion.h2>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-xl md:text-2xl mb-12 opacity-90 max-w-3xl mx-auto leading-relaxed"
        >
          Join hundreds of operators who have eliminated manual reconciliation.
          Start your 14-day free trial today.
        </motion.p>
        <Link href="/payment/select-plan">
          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-12 py-7 rounded-xl shadow-2xl group"
            >
              Start Free Trial - No Credit Card Required
              <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </Link>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.75 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-sm mt-8"
        >
          Questions? Email us at sales@flowshare.com
        </motion.p>
      </div>
    </motion.section>
  );
}