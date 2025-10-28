import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Lock, TrendingUp, Sparkles } from 'lucide-react'

interface PlanUpgradePromptProps {
  feature: string
  description: string
  requiredPlans: string[]
  className?: string
}

export const PlanUpgradePrompt: React.FC<PlanUpgradePromptProps> = ({
  feature,
  description,
  requiredPlans,
  className = ''
}) => {
  return (
    <Card className={`border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 via-background to-background ${className}`}>
      <CardHeader className="text-center pb-4">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Lock className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">{feature}</CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        <div className="flex flex-wrap gap-2 justify-center">
          {requiredPlans.map((plan) => (
            <Badge key={plan} variant="secondary" className="px-3 py-1">
              <Sparkles className="w-3 h-3 mr-1" />
              {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
            </Badge>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Upgrade your plan to unlock this powerful feature
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link href="/dashboard/upgrade">
            <Button className="w-full sm:w-auto">
              <TrendingUp className="mr-2 h-4 w-4" />
              Upgrade Plan
            </Button>
          </Link>
          <Link href="/dashboard/upgrade">
            <Button variant="outline" className="w-full sm:w-auto">
              Compare Plans
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

interface FeatureLockedOverlayProps {
  message?: string
  requiredPlans: string[]
  className?: string
}

export const FeatureLockedOverlay: React.FC<FeatureLockedOverlayProps> = ({
  message = 'This feature is locked',
  requiredPlans,
  className = ''
}) => {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg border-2 border-dashed border-primary/30">
        <div className="text-center space-y-4 p-6">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-lg mb-1">{message}</p>
            <div className="flex flex-wrap gap-2 justify-center mb-3">
              {requiredPlans.map((plan) => (
                <Badge key={plan} variant="secondary" className="px-2 py-1 text-xs">
                  {plan.charAt(0).toUpperCase() + plan.slice(1)}
                </Badge>
              ))}
            </div>
            <Link href="/dashboard/upgrade">
              <Button size="sm">
                <TrendingUp className="mr-2 h-3 w-3" />
                Upgrade Plan
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
