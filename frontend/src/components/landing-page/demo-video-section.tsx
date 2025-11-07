"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Video, ArrowRight, Zap, Shield, TrendingUp } from "lucide-react";
import Link from "next/link";
import { fadeIn, scaleIn } from "./variants";

export function DemoVideoSection() {
  return (
    <section id="demo" className="py-32 px-6 bg-muted/30 relative overflow-hidden">
      {/* Background gradient */}
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl"
      />

      <div className="container mx-auto relative">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="text-center mb-16"
        >
          <Badge variant="secondary" className="mb-4 px-4 py-2">
            <Video className="w-4 h-4 mr-2 inline-block" />
            Product Demo
          </Badge>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Experience FlowShare{" "}
            <span className="bg-linear-to-r from-primary via-violet-600 to-primary bg-clip-text text-transparent">
              In Action
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            See a comprehensive walkthrough of FlowShare's powerful features,
            from data ingestion to automated reconciliation and reporting.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={scaleIn}
          className="max-w-5xl mx-auto"
        >
          <motion.div
            className="relative rounded-2xl overflow-hidden shadow-2xl shadow-violet-500/10 bg-gradient-to-br from-card/80 to-muted/50 backdrop-blur-sm border border-border/50"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className="aspect-video">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/yjV5SEOnyAU"
                title="FlowShare Product Demo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </motion.div>

          {/* Key features highlighted in demo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:shadow-lg hover:border-primary/50 transition-all"
            >
              <Zap className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-lg font-bold mb-2">Lightning Fast</h3>
              <p className="text-sm text-muted-foreground">
                Process thousands of records in seconds with our optimized
                reconciliation engine
              </p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:shadow-lg hover:border-primary/50 transition-all"
            >
              <Shield className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-lg font-bold mb-2">100% Accurate</h3>
              <p className="text-sm text-muted-foreground">
                API MPMS 11.1 compliant calculations with built-in validation
                and error checking
              </p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:shadow-lg hover:border-primary/50 transition-all"
            >
              <TrendingUp className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-lg font-bold mb-2">Real-time Insights</h3>
              <p className="text-sm text-muted-foreground">
                Get instant alerts on anomalies and trends with AI-powered
                analytics
              </p>
            </motion.div>
          </motion.div>

          {/* CTA after demo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="mt-12 text-center"
          >
            <p className="text-lg text-muted-foreground mb-6">
              Ready to transform your reconciliation process?
            </p>
            <Link href="/payment/select-plan">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-block"
              >
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-lg px-10 py-6 rounded-xl shadow-xl shadow-primary/20 group"
                >
                  Start Your Free Trial
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
