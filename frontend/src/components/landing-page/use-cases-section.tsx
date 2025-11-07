"use client";

import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";
import { fadeIn, staggerContainer } from "./variants";
import { useCases } from "./landing-data";


export function UseCasesSection() {
  return (
    <section className="py-32 px-6 bg-linear-to-b from-background to-muted/20">
      <div className="container mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="text-center mb-20"
        >
          <Badge variant="secondary" className="mb-4">
            <Building2 className="w-4 h-4 mr-2 inline-block" />
            Use Cases
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Built for Every Role in Your JV
          </h2>
          <p className="text-xl text-muted-foreground">
            From operators to partners, FlowShare serves every stakeholder
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={staggerContainer}
          className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto"
        >
          {useCases.map((useCase, i) => (
            <motion.div key={i} variants={fadeIn}>
              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="border-2 hover:border-primary/50 transition-all h-full">
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                        <useCase.icon className="h-7 w-7 text-primary" />
                      </div>
                      <CardTitle className="text-2xl">{useCase.role}</CardTitle>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Badge variant="destructive" className="mb-2 text-xs">
                          Challenge
                        </Badge>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {useCase.challenge}
                        </p>
                      </div>
                      <div>
                        <Badge className="mb-2 text-xs">
                          FlowShare Solution
                        </Badge>
                        <p className="text-sm text-foreground leading-relaxed font-medium">
                          {useCase.solution}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}