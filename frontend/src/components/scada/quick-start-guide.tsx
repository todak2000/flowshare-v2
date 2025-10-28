"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Book, Code, Zap } from "lucide-react";

export function QuickStartGuide() {
  return (
    <Card className="border-primary/50 bg-linear-to-br from-primary/5 to-background">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Quick Start Guide
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              id: 1,
              header: "Create Test API Key",
              description:
                "Start with a test key to safely experiment without affecting live data",
            },
            {
              id: 2,
              header: "Test Your Integration",
              description:
                "Use our interactive documentation to test API calls and verify your setup",
            },
            {
              id: 3,
              header: "Go Live",
              description:
                "Create a production key and deploy to your SCADA system",
            },
          ].map((step) => (
            <div key={step.id} className="flex items-start gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                {step.id}
              </div>
              <div>
                <h4 className="font-semibold mb-1">{step.header}</h4>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-3 pt-2">
          {[
            {
              href: "/dashboard/scada-docs",
              label: "View Documentation",
              icon: Book,
              variant: "default",
            },
            {
              href: "/dashboard/scada-docs#test",
              label: "Try Interactive Testing",
              icon: Code,
              variant: "outline",
            },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="w-full md:w-auto"
            >
              <Button
                variant={action.variant as "default" | "outline"}
                className="w-full"
              >
                <action.icon className="mr-2 h-4 w-4" />
                {action.label}
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
