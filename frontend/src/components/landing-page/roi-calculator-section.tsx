"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Check, ArrowRight } from "lucide-react";
import { fadeIn, slideInLeft, slideInRight } from "./variants";
import { roiMetrics } from "./landing-data";


export function RoiCalculatorSection() {
  return (
    <section className="py-32 px-6 bg-muted/50 relative overflow-hidden">
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
      />
      <div className="container mx-auto relative">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="max-w-5xl mx-auto"
        >
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <TrendingUp className="w-4 h-4 mr-2 inline-block" />
              Return on Investment
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Calculate Your Savings
            </h2>
            <p className="text-xl text-muted-foreground">
              See how much FlowShare saves your operation annually
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={slideInLeft}
              className="space-y-8"
            >
              <div className="space-y-6">
                {roiMetrics.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15 }}
                    className="p-6 bg-background rounded-2xl border-2 border-border hover:border-primary/50 transition-colors"
                  >
                    <h4 className="font-bold text-lg mb-4">{item.metric}</h4>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Before
                        </p>
                        <p className="font-medium text-destructive">
                          {item.before}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          With FlowShare
                        </p>
                        <p className="font-medium text-success">{item.after}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="w-full justify-center">
                      <TrendingUp className="w-3 h-3 mr-2" />
                      {item.savings}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={slideInRight}
            >
              <Card className="border-2 border-primary shadow-2xl">
                <CardHeader className="text-center space-y-4 bg-linear-to-br from-primary/10 to-violet-600/10">
                  <CardTitle className="text-3xl">
                    Your Potential Savings
                  </CardTitle>
                  <div className="pt-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        delay: 0.2,
                      }}
                      className="text-6xl font-bold text-primary mb-2"
                    >
                      $190K+
                    </motion.div>
                    <p className="text-muted-foreground">
                      Per year in labor savings
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="pt-8 space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-border">
                      <span className="text-muted-foreground">
                        Manual Process Cost
                      </span>
                      <span className="font-bold">$200,000/yr</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-border">
                      <span className="text-muted-foreground">
                        FlowShare Professional
                      </span>
                      <span className="font-bold text-primary">$11,988/yr</span>
                    </div>
                    <div className="flex justify-between items-center pt-3">
                      <span className="font-bold text-lg">
                        Net Annual Savings
                      </span>
                      <span className="font-bold text-3xl text-success">
                        $188K+
                      </span>
                    </div>
                  </div>

                  <div className="pt-6 space-y-4">
                    <Badge
                      variant="secondary"
                      className="w-full justify-center text-sm py-3"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      ROI achieved in first month
                    </Badge>
                    <Link href="/payment/select-plan">
                      <Button
                        size="lg"
                        className="w-full group text-lg py-6"
                      >
                        Start Saving Today
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}