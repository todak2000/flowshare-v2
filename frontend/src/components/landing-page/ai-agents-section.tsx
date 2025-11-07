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
import { Bot, Check, Workflow } from "lucide-react";
import { fadeIn, staggerContainer } from "./variants";
import { aiAgents } from "./landing-data";

export function AIAgentsSection() {
  return (
    <section className="py-32 px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-br from-violet-500/5 via-primary/5 to-transparent"></div>
      <div className="container mx-auto relative">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="text-center mb-20"
        >
          <Badge variant="secondary" className="mb-4">
            <Bot className="w-4 h-4 mr-2 inline-block" />
            AI-Powered Automation
          </Badge>
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Meet Your{" "}
            <span className="bg-linear-to-r from-primary via-violet-600 to-primary bg-clip-text text-transparent">
              Three AI Agents
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            FlowShare uses three specialized AI agents working together to
            validate, calculate, and communicate - eliminating manual work at
            every step
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={staggerContainer}
          className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto mb-16"
        >
          {aiAgents.map((agent, i) => (
            <motion.div key={i} variants={fadeIn}>
              <motion.div
                whileHover={{ y: -10, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-2xl group bg-card/50 backdrop-blur h-full">
                  <CardHeader className="space-y-4">
                    <motion.div
                      className={`w-16 h-16 bg-linear-to-br ${agent.color} rounded-2xl flex items-center justify-center mb-2 shadow-lg`}
                      whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <agent.icon className="h-8 w-8 text-white" />
                    </motion.div>
                    <CardTitle className="text-2xl">{agent.name}</CardTitle>
                    <CardDescription className="text-base font-medium text-primary">
                      {agent.role}
                    </CardDescription>
                    <Badge variant="outline" className="w-fit text-xs">
                      {agent.trigger}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {agent.capabilities.map((capability, idx) => (
                        <motion.li
                          key={idx}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: idx * 0.1 }}
                        >
                          <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                          <span>{capability}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Badge variant="secondary" className="text-base px-6 py-3">
            <Workflow className="w-5 h-5 mr-2 inline-block" />
            Event-Driven Architecture powered by Google Cloud Pub/Sub
          </Badge>
        </motion.div>
      </div>
    </section>
  );
}
