"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { fadeIn, slideInLeft, slideInRight } from "./variants";
import { howItWorksSteps } from "./landing-data";


export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-32 px-6 bg-muted/30">
      <div className="container mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="text-center mb-20"
        >
          <Badge variant="secondary" className="mb-4">
            Process
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground">
            Simple, automated, accurate
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto space-y-16">
          {howItWorksSteps.map((item, i) => (
            <motion.div
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={i % 2 === 0 ? slideInLeft : slideInRight}
              className="flex flex-col md:flex-row items-start gap-8 group"
            >
              <motion.div
                className="shrink-0 w-20 h-20 bg-linear-to-br from-primary to-violet-600 text-primary-foreground rounded-2xl flex items-center justify-center text-3xl font-bold shadow-xl shadow-primary/20"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {item.step}
              </motion.div>
              <div className="flex-1 space-y-3">
                <h3 className="text-2xl md:text-3xl font-bold">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}