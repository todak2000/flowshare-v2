"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";
import { fadeIn, staggerContainer } from "./variants";
import { securityFeatures, techBadges } from "./landing-data";

export function TrustSecuritySection() {
  return (
    <section className="py-32 px-6">
      <div className="container mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="text-center mb-20"
        >
          <Badge variant="secondary" className="mb-4">
            <Shield className="w-4 h-4 mr-2 inline-block" />
            Enterprise Security
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Bank-Grade Security & Compliance
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Your data is protected with enterprise-grade security and industry
            compliance
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={staggerContainer}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto mb-16"
        >
          {securityFeatures.map((feature, i) => (
            <motion.div
              key={i}
              variants={fadeIn}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <motion.div
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <feature.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-3">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="flex flex-wrap justify-center items-center gap-12 pt-12 border-t border-border"
        >
          {techBadges.map((badge, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.1 }}
              className="flex flex-col items-center gap-3 grayscale hover:grayscale-0 transition-all"
            >
              <badge.icon className="h-12 w-12 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                {badge.name}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
