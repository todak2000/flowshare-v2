"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { fadeIn, staggerContainer } from "./variants";
import { pricingPlans } from "./landing-data";
import { PricingCard } from "./pricing-card";

export function PricingSection() {
  return (
    <section id="pricing" className="py-32 px-6 bg-muted/30">
      <div className="container mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="text-center mb-20"
        >
          <Badge variant="secondary" className="mb-4">
            Pricing
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-muted-foreground">
            Choose the plan that fits your operation
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={staggerContainer}
          className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto items-stretch" // Use items-stretch
        >
          {pricingPlans.map((plan) => (
            <PricingCard key={plan.name} plan={plan} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
