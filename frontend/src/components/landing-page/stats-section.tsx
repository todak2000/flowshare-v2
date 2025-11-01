"use client";

import { motion } from "framer-motion";
import { scaleIn, staggerContainer } from "./variants";
import { stats } from "./landing-data";

export function StatsSection() {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={staggerContainer}
      className="py-20 bg-linear-to-br from-primary via-violet-600 to-primary relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
      <div className="container mx-auto px-6 relative">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center text-primary-foreground">
          {stats.map((stat, i) => (
            <motion.div key={i} variants={scaleIn} className="space-y-2">
              <motion.div
                className="text-5xl md:text-6xl font-bold"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
              >
                {stat.value}
              </motion.div>
              <div className="text-primary-foreground/80 font-medium">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
