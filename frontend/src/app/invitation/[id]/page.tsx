"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
// Note: We don't use apiClient here because this is a public endpoint
// import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Mail,
  Building2,
  User,
  Clock,
  AlertCircle,
} from "lucide-react"

interface Invitation {
  id: string
  email: string
  partner_name?: string
  role: string
  status: string
  tenant_id: string
  tenant_name?: string
  created_at: string
  expires_at: string
}

export default function InvitationPage() {
  const router = useRouter()
  const params = useParams()
  const invitationId = params.id as string

  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [accepting, setAccepting] = useState(false)
  const [rejecting, setRejecting] = useState(false)

  useEffect(() => {
    fetchInvitation()
  }, [invitationId])

  const fetchInvitation = async () => {
    try {
      setLoading(true)
      // Fetch invitation details (public endpoint, no auth needed)
      // Use direct fetch instead of apiClient to avoid authentication requirement
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      const response = await fetch(`${API_URL}/api/invitations/${invitationId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || "Failed to fetch invitation")
      }

      const invitationData = await response.json()
      setInvitation(invitationData)
    } catch (err: any) {
      console.error("Failed to fetch invitation:", err)
      setError(err.message || "Invitation not found or has expired")
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async () => {
    // Redirect to registration with invitation details
    sessionStorage.setItem("invitationId", invitationId)
    sessionStorage.setItem("invitationAccepted", "true")
    if (invitation) {
      sessionStorage.setItem("invitationEmail", invitation.email)
      sessionStorage.setItem("invitationRole", invitation.role)
      sessionStorage.setItem("invitationTenantId", invitation.tenant_id)
      sessionStorage.setItem("invitationPartnerName", invitation.partner_name || "")
    }
    router.push("/auth/register")
  }

  const handleReject = async () => {
    try {
      setRejecting(true)
      // TODO: Add reject endpoint in backend
      // For now, just show a message
      alert("Invitation rejected. You can close this page.")
    } catch (err) {
      console.error("Failed to reject invitation:", err)
    } finally {
      setRejecting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <div className="text-center">
          <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <p className="text-muted-foreground">Loading invitation...</p>
        </div>
      </div>
    )
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <header className="border-b border-border bg-background/80 backdrop-blur-lg">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary via-primary to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <Sparkles className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">
                FlowShare
              </span>
            </Link>
          </div>
        </header>

        <main className="container mx-auto px-6 py-16">
          <div className="max-w-2xl mx-auto">
            <Card className="border-2 border-destructive/50">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-destructive/10 rounded-full flex items-center justify-center">
                    <XCircle className="h-6 w-6 text-destructive" />
                  </div>
                  <div>
                    <CardTitle>Invitation Not Found</CardTitle>
                    <CardDescription className="text-destructive">
                      {error || "This invitation may have expired or been cancelled"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Link href="/">
                  <Button variant="outline" className="w-full">
                    Go to Home Page
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  // Check if invitation has expired
  const isExpired = new Date(invitation.expires_at) < new Date()
  const isAccepted = invitation.status === "accepted"
  const isCancelled = invitation.status === "cancelled"

  if (isExpired || isAccepted || isCancelled) {
    let statusIcon = <XCircle className="h-6 w-6 text-destructive" />
    let statusTitle = "Invitation Expired"
    let statusDescription = "This invitation has expired"
    let statusColor = "border-destructive/50"

    if (isAccepted) {
      statusIcon = <CheckCircle2 className="h-6 w-6 text-success" />
      statusTitle = "Invitation Already Accepted"
      statusDescription = "This invitation has already been accepted"
      statusColor = "border-success/50"
    } else if (isCancelled) {
      statusTitle = "Invitation Cancelled"
      statusDescription = "This invitation has been cancelled by the sender"
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <header className="border-b border-border bg-background/80 backdrop-blur-lg">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary via-primary to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <Sparkles className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">
                FlowShare
              </span>
            </Link>
          </div>
        </header>

        <main className="container mx-auto px-6 py-16">
          <div className="max-w-2xl mx-auto">
            <Card className={`border-2 ${statusColor}`}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center">
                    {statusIcon}
                  </div>
                  <div>
                    <CardTitle>{statusTitle}</CardTitle>
                    <CardDescription>{statusDescription}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Link href="/auth/login">
                  <Button className="w-full">
                    {isAccepted ? "Go to Login" : "Go to Home Page"}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary via-primary to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">
              FlowShare
            </span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-16">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-2">You've Been Invited!</h1>
            <p className="text-muted-foreground text-lg">
              Join {invitation.tenant_name || "this joint venture"} on FlowShare
            </p>
          </div>

          <Card className="border-2 border-primary/50">
            <CardHeader>
              <CardTitle>Invitation Details</CardTitle>
              <CardDescription>
                Review the information below and decide whether to accept
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tenant Information */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Joint Venture</p>
                    <p className="font-semibold">{invitation.tenant_name || "Joint Venture"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Your Role</p>
                    <p className="font-semibold capitalize">{invitation.role.replace("_", " ")}</p>
                  </div>
                </div>

                {invitation.partner_name && (
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Partner Company</p>
                      <p className="font-semibold">{invitation.partner_name}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <div className="h-10 w-10 bg-warning/10 rounded-full flex items-center justify-center">
                    <Clock className="h-5 w-5 text-warning" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Expires On</p>
                    <p className="font-semibold">
                      {new Date(invitation.expires_at).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="p-4 border border-primary/50 bg-primary/5 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium mb-1">What happens next?</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                      <li>Click "Accept Invitation" to create your account</li>
                      <li>No payment required - you're joining as an invitee</li>
                      <li>You'll be redirected to complete your registration</li>
                      <li>After registration, you'll have access to your dashboard</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleAccept}
                  disabled={accepting}
                  className="flex-1 bg-primary hover:bg-primary/90 shadow-lg"
                  size="lg"
                >
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  {accepting ? "Accepting..." : "Accept Invitation"}
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={rejecting}
                  variant="outline"
                  size="lg"
                >
                  <XCircle className="mr-2 h-5 w-5" />
                  Decline
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
