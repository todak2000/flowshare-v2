"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, Lock, Bot, Brain, Zap } from "lucide-react";
import { slideInLeft, slideInRight } from "./variants";
import { flowshareGptExamples } from "./landing-data";


export function FlowshareGptSection() {
  return (
    <section className="py-32 px-6 bg-muted/30 relative overflow-hidden">
      <motion.div
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute inset-0 bg-linear-to-r from-primary/10 via-violet-600/10 to-primary/10"
        style={{ backgroundSize: "200% 200%" }}
      />
      <div className="container mx-auto relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={slideInLeft}
          >
            <Badge variant="secondary" className="mb-6">
              <Sparkles className="w-4 h-4 mr-2 inline-block" />
              AI-Powered Insights
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold mb-8 leading-tight">
              <span className="bg-linear-to-r from-primary via-violet-600 to-primary bg-clip-text text-transparent">
                FlowshareGPT
              </span>
              <br />
              Your Production Assistant
            </h2>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Chat with your production data using natural language. Powered by
              Google Gemini AI, FlowshareGPT understands your role, knows your
              data, and delivers instant insights.
            </p>
            <div className="space-y-4 mb-10">
              {flowshareGptExamples.map((example, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="flex items-start gap-3 p-4 rounded-lg bg-background/50 border border-border/50 hover:border-primary/50 transition-colors"
                >
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold text-sm">
                      {i + 1}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground mb-1">
                      {example.question}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {example.answer}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/payment/select-plan">
                <Button size="lg" className="group">
                  Try FlowshareGPT Free
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Badge variant="outline" className="text-sm px-4 py-2">
                <Lock className="w-3 h-3 mr-2 inline-block" />
                Role-based data access - Partners see only their data
              </Badge>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={slideInRight}
            className="relative"
          >
            <motion.div
              animate={{
                y: [0, -20, 0],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative z-10"
            >
              <div className="bg-linear-to-br from-background to-muted border-2 border-border rounded-2xl shadow-2xl overflow-hidden">
                <div className="bg-linear-to-r from-primary/20 to-violet-600/20 p-4 border-b border-border flex items-center gap-3">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium">FlowshareGPT</span>
                </div>
                <div className="p-6 space-y-4 max-h-96">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shrink-0">
                      <span className="text-primary-foreground text-sm font-bold">
                        U
                      </span>
                    </div>
                    <div className="bg-muted rounded-2xl rounded-tl-none p-4 max-w-xs">
                      <p className="text-sm">
                        Why is Partner A's production down 15% this month?
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <div className="bg-primary rounded-2xl rounded-tr-none p-4 max-w-md">
                      <p className="text-sm text-primary-foreground">
                        Based on your production data, Partner A experienced a
                        15.3% decline due to:
                        <br />
                        <br />
                        • Scheduled maintenance on Well #3 (Oct 15-18)
                        <br />
                        • Lower API gravity (31.2°API vs avg 32.8°API)
                        <br />
                        • Increased BSW% from 2.1% to 3.8%
                        <br />
                        <br />
                        This aligns with the planned maintenance window.
                        Production should normalize by next week.
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-linear-to-br from-primary to-violet-600 rounded-full flex items-center justify-center shrink-0">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-muted/30 border-t border-border flex items-center gap-3">
                  <div className="flex-1 bg-background rounded-full px-4 py-2 text-sm text-muted-foreground">
                    Ask anything about your production data...
                  </div>
                  <Button size="sm" className="rounded-full">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Floating badges */}
            <motion.div
              animate={{
                y: [0, 10, 0],
                rotate: [-2, 2, -2],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute -top-6 -left-6 z-20"
            >
              <Badge className="text-sm px-4 py-2 shadow-xl">
                <Brain className="w-4 h-4 mr-2" />
                Google Gemini AI
              </Badge>
            </motion.div>

            <motion.div
              animate={{
                y: [0, -10, 0],
                rotate: [2, -2, 2],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
              className="absolute -bottom-6 -right-6 z-20"
            >
              <Badge
                variant="secondary"
                className="text-sm px-4 py-2 shadow-xl"
              >
                <Zap className="w-4 h-4 mr-2" />
                Real-time Streaming
              </Badge>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}