"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fadeIn, staggerContainer } from "./variants";
import { faqs } from "./landing-data";


export function FaqSection() {
  return (
    <section className="py-32 px-6">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="text-center mb-20"
        >
          <Badge variant="secondary" className="mb-4">
            FAQ
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-muted-foreground">
            Everything you need to know about FlowShare
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={staggerContainer}
          className="space-y-6"
        >
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              variants={fadeIn}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="border-2 hover:border-primary/30 transition-colors">
                <CardHeader>
                  <CardTitle className="text-xl flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-1">
                      <span className="text-primary font-bold text-sm">
                        {i + 1}
                      </span>
                    </div>
                    <span className="leading-tight">{faq.question}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed pl-11">
                    {faq.answer}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <p className="text-muted-foreground mb-6">
            Still have questions? We're here to help.
          </p>
          <Button variant="outline" size="lg">
            Contact Sales
          </Button>
        </motion.div>
      </div>
    </section>
  );
}