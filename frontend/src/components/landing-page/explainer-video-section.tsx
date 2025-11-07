"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { PlayCircle } from "lucide-react";
import { fadeIn, scaleIn } from "./variants";

export function ExplainerVideoSection() {
  return (
    <section id="explainer" className="py-32 px-6 bg-background relative overflow-hidden">
      {/* Background gradient */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
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
            <PlayCircle className="w-4 h-4 mr-2 inline-block" />
            Introduction
          </Badge>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            See How FlowShare{" "}
            <span className="bg-linear-to-r from-primary via-violet-600 to-primary bg-clip-text text-transparent">
              Transforms
            </span>{" "}
            Your Workflow
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Watch our explainer video to understand how FlowShare automates
            hydrocarbon allocation and saves you countless hours of manual work.
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
            className="relative rounded-2xl overflow-hidden shadow-2xl shadow-primary/10 bg-muted/30 backdrop-blur-sm border border-border/50"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className="aspect-video">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/bhytH-z8k2Y"
                title="FlowShare Explainer Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </motion.div>

          {/* Video stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center"
          >
            <div className="p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:shadow-lg transition-shadow">
              <div className="text-3xl font-bold text-primary mb-2">3 min</div>
              <div className="text-sm text-muted-foreground">
                Quick Introduction
              </div>
            </div>
            <div className="p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:shadow-lg transition-shadow">
              <div className="text-3xl font-bold text-primary mb-2">
                AI-Powered
              </div>
              <div className="text-sm text-muted-foreground">
                Automated Reconciliation
              </div>
            </div>
            <div className="p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:shadow-lg transition-shadow">
              <div className="text-3xl font-bold text-primary mb-2">
                Real-time
              </div>
              <div className="text-sm text-muted-foreground">
                Anomaly Detection
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
