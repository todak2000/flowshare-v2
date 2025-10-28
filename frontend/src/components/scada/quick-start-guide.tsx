"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Book, Code, Zap } from "lucide-react"

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
          <div className="flex items-start gap-3">
            <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
              1
            </div>
            <div>
              <h4 className="font-semibold mb-1">Create Test API Key</h4>
              <p className="text-sm text-muted-foreground">
                Start with a test key to safely experiment without affecting live data
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
              2
            </div>
            <div>
              <h4 className="font-semibold mb-1">Test Your Integration</h4>
              <p className="text-sm text-muted-foreground">
                Use our interactive documentation to test API calls and verify your setup
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
              3
            </div>
            <div>
              <h4 className="font-semibold mb-1">Go Live</h4>
              <p className="text-sm text-muted-foreground">
                Create a production key and deploy to your SCADA system
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 pt-2">
          <Link href="/dashboard/scada-docs">
            <Button>
              <Book className="mr-2 h-4 w-4" />
              View Documentation
            </Button>
          </Link>
          <Link href="/dashboard/scada-docs#test">
            <Button variant="outline">
              <Code className="mr-2 h-4 w-4" />
              Try Interactive Testing
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
