"use client";

import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fadeIn, staggerContainer } from "./variants";
import { features } from "./landing-data";


export function FeaturesSection() {
  return (
    <section id="features" className="py-32 px-6">
      <div className="container mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="text-center mb-20"
        >
          <Badge variant="secondary" className="mb-4">
            Features
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Powerful Features for Modern Operations
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to streamline joint venture reconciliation and
            eliminate manual errors
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={staggerContainer}
          className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto"
        >
          {features.map((feature, i) => (
            <motion.div key={i} variants={fadeIn}>
              <motion.div
                whileHover={{ scale: 1.03, y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-2xl group bg-card/50 backdrop-blur h-full">
                  <CardHeader>
                    <motion.div
                      className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <feature.icon className="h-7 w-7 text-primary" />
                    </motion.div>
                    <CardTitle className="text-2xl">{feature.title}</CardTitle>
                    <CardDescription className="text-base">
                      {feature.desc}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-muted-foreground">
                    {feature.detail}
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}