"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { PricingPlan } from "./landing-data";
import { scaleIn } from "./variants";


interface PricingCardProps {
  plan: PricingPlan;
}

export function PricingCard({ plan }: PricingCardProps) {
  const isPopular = plan.isPopular;

  return (
    <motion.div variants={scaleIn} className="h-full">
      <motion.div
        whileHover={{ scale: isPopular ? 1.05 : 1.03, y: isPopular ? -8 : -5 }}
        transition={{ type: "spring", stiffness: 300 }}
        className="h-full"
      >
        <Card
          className={`h-full border-2 hover:shadow-xl transition-all relative ${
            isPopular ? "border-4 border-primary shadow-2xl scale-105" : ""
          }`}
        >
          {isPopular && (
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="absolute -top-5 left-1/2 transform -translate-x-1/2"
            >
              <Badge className="px-6 py-2 text-sm shadow-lg">
                Most Popular
              </Badge>
            </motion.div>
          )}
          <CardHeader className={`space-y-4 ${isPopular ? "pt-8" : ""}`}>
            <CardTitle className="text-2xl">{plan.name}</CardTitle>
            <CardDescription className="text-base">
              {plan.description}
            </CardDescription>
            <div className="pt-4">
              <span className="text-5xl font-bold">
                {plan.price.startsWith("$") ? plan.price : `$${plan.price}`}
              </span>
              {plan.pricePeriod && (
                <span className="text-muted-foreground text-lg">
                  {plan.pricePeriod}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4 mb-8">
              {plan.features.map((feature, i) => (
                <motion.li
                  key={i}
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Check className="h-5 w-5 text-success shrink-0" />
                  <span className="text-muted-foreground">{feature}</span>
                </motion.li>
              ))}
            </ul>
            <Link href={plan.href}>
              <Button
                className={`w-full ${
                  isPopular ? "bg-primary hover:bg-primary/90 shadow-lg" : ""
                }`}
                variant={plan.buttonVariant}
                size="lg"
              >
                {plan.buttonText}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}