"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, ArrowRight, Check, Layers } from "lucide-react";
import { slideInLeft, slideInRight } from "./variants";
import { scadaFeatures } from "./landing-data";


export function ScadaIntegrationSection() {
  return (
    <section className="py-32 px-6 bg-linear-to-br from-primary/5 to-violet-600/5">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={slideInLeft}
          >
            <Badge variant="secondary" className="mb-6">
              <Database className="w-4 h-4 mr-2 inline-block" />
              SCADA Integration
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold mb-8 leading-tight">
              Eliminate Manual
              <br />
              <span className="bg-linear-to-r from-primary to-violet-600 bg-clip-text text-transparent">
                Data Entry Forever
              </span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Connect your SCADA systems directly to FlowShare V2 via secure
              REST API. Production data flows automatically - no more
              spreadsheets, no more errors.
            </p>
            <div className="space-y-6 mb-10">
              {scadaFeatures.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="flex items-start gap-4"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                    <p className="text-muted-foreground">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <Link href="/payment/select-plan">
              <Button size="lg" className="group">
                Get API Access
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={slideInRight}
          >
            <div className="relative">
              <motion.div
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="bg-card border-2 border-border rounded-2xl shadow-2xl overflow-hidden"
              >
                <div className="bg-muted/50 p-4 border-b border-border flex items-center gap-3">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <span className="text-sm font-mono">SCADA API Request</span>
                </div>
                <div className="p-6 bg-linear-to-br from-background to-muted font-mono text-sm">
                  <div className="space-y-2">
                    <p className="text-primary">
                      POST /api/v1/scada/production
                    </p>
                    <p className="text-muted-foreground">
                      Content-Type: application/json
                    </p>
                    <p className="text-muted-foreground">
                      X-API-Key: sk_prod_...
                    </p>
                    <div className="pt-4 text-foreground">
                      {`{
  "partner_id": "partner_abc123",
  "gross_volume": 1250.5,
  "bsw_percent": 2.3,
  "temperature": 72.5,
  "api_gravity": 32.8,
  "pressure": 14.7,
  "meter_factor": 1.001,
  "timestamp": "2025-01-15T08:30:00Z"
}`}
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-success/10 border-t border-border flex items-center gap-3">
                  <Check className="h-5 w-5 text-success" />
                  <span className="text-sm font-medium text-success">
                    200 OK - Entry validated by AI
                  </span>
                </div>
              </motion.div>

              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5,
                }}
                className="absolute -top-6 -right-6 z-20"
              >
                <Badge className="text-sm px-4 py-2 shadow-xl">
                  <Layers className="w-4 h-4 mr-2" />
                  REST API
                </Badge>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}