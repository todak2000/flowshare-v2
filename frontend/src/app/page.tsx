import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">F</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                FlowShare
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</Link>
              <Link href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">How It Works</Link>
              <Link href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/auth/register">
                <Button className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block mb-6 px-4 py-2 bg-blue-50 rounded-full">
              <span className="text-blue-600 font-semibold text-sm">🚀 AI-Powered Reconciliation Platform</span>
            </div>
            <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-gray-900 via-blue-900 to-cyan-900 bg-clip-text text-transparent">
                Hydrocarbon Allocation,
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                Automated & Accurate
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Transform weeks of manual reconciliation into minutes with AI-powered automation.
              API MPMS 11.1 compliant, real-time anomaly detection, and production-grade accuracy.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/auth/register">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-lg px-8 py-6">
                  Start Free Trial
                  <span className="ml-2">→</span>
                </Button>
              </Link>
              <Link href="#demo">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                  Watch Demo
                </Button>
              </Link>
            </div>
            <p className="text-sm text-gray-500 mt-6">No credit card required • 14-day free trial • Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-cyan-500">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <div className="text-5xl font-bold mb-2">95%</div>
              <div className="text-blue-100">Faster Processing</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">99.9%</div>
              <div className="text-blue-100">Accuracy Rate</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">500+</div>
              <div className="text-blue-100">JVs Managed</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">$2M+</div>
              <div className="text-blue-100">Saved Annually</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-900">Powerful Features for Modern Operations</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to streamline joint venture reconciliation and eliminate manual errors
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-blue-500 transition-all hover:shadow-xl">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">⚡</span>
                </div>
                <CardTitle className="text-2xl">Lightning Fast</CardTitle>
                <CardDescription className="text-base">
                  95% reduction in reconciliation time
                </CardDescription>
              </CardHeader>
              <CardContent className="text-gray-600">
                Automated data ingestion, validation, and calculation using industry-standard API MPMS 11.1
                allocation formulas. Process hundreds of entries in seconds.
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-cyan-500 transition-all hover:shadow-xl">
              <CardHeader>
                <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">🤖</span>
                </div>
                <CardTitle className="text-2xl">AI-Powered Intelligence</CardTitle>
                <CardDescription className="text-base">
                  Proactive anomaly detection & forecasting
                </CardDescription>
              </CardHeader>
              <CardContent className="text-gray-600">
                Machine learning validates every entry in real-time and predicts production trends using
                Google Vertex AI. Catch errors before they become costly.
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-purple-500 transition-all hover:shadow-xl">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">🔒</span>
                </div>
                <CardTitle className="text-2xl">Enterprise Security</CardTitle>
                <CardDescription className="text-base">
                  Multi-tenant, role-based, fully auditable
                </CardDescription>
              </CardHeader>
              <CardContent className="text-gray-600">
                Bank-grade encryption, secure data isolation, granular permissions, and complete audit trails.
                Export to Excel for verification and compliance.
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-green-500 transition-all hover:shadow-xl">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">📊</span>
                </div>
                <CardTitle className="text-2xl">Real-Time Analytics</CardTitle>
                <CardDescription className="text-base">
                  Interactive dashboards & insights
                </CardDescription>
              </CardHeader>
              <CardContent className="text-gray-600">
                Visualize production trends, partner allocations, and shrinkage analysis with interactive
                charts. Make data-driven decisions instantly.
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-orange-500 transition-all hover:shadow-xl">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">🔄</span>
                </div>
                <CardTitle className="text-2xl">SCADA Integration</CardTitle>
                <CardDescription className="text-base">
                  Seamless data synchronization
                </CardDescription>
              </CardHeader>
              <CardContent className="text-gray-600">
                Connect directly to your SCADA systems via secure APIs. Automatic data ingestion eliminates
                manual entry and reduces human error to zero.
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-pink-500 transition-all hover:shadow-xl">
              <CardHeader>
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">📧</span>
                </div>
                <CardTitle className="text-2xl">Smart Notifications</CardTitle>
                <CardDescription className="text-base">
                  Stay informed, automatically
                </CardDescription>
              </CardHeader>
              <CardContent className="text-gray-600">
                Customizable email alerts for anomalies, reconciliation completion, and critical events.
                Keep all stakeholders informed without lifting a finger.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-900">How It Works</h2>
            <p className="text-xl text-gray-600">Simple, automated, accurate</p>
          </div>
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0 w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2">Connect Your Data Sources</h3>
                <p className="text-gray-600 text-lg">
                  Integrate with SCADA systems or upload production data via our secure API. Support for
                  manual entry, CSV imports, and real-time feeds.
                </p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0 w-16 h-16 bg-cyan-600 text-white rounded-full flex items-center justify-center text-2xl font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2">AI Validates Every Entry</h3>
                <p className="text-gray-600 text-lg">
                  Our Auditor Agent analyzes each production entry using machine learning to detect anomalies,
                  outliers, and potential errors before they impact your reconciliation.
                </p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0 w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2">Automated Allocation Calculation</h3>
                <p className="text-gray-600 text-lg">
                  Our Accountant Agent applies API MPMS 11.1 formulas to calculate partner allocations with
                  production-grade accuracy, including BSW, temperature, and API gravity corrections.
                </p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0 w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center text-2xl font-bold">
                4
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2">Stakeholder Notifications</h3>
                <p className="text-gray-600 text-lg">
                  Automatic email notifications sent to coordinators and partners with detailed reports,
                  Excel exports, and allocation breakdowns. Full transparency for all parties.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-900">Trusted by Industry Leaders</h2>
            <p className="text-xl text-gray-600">See what operators are saying about FlowShare</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="bg-white">
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400">★</span>
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "FlowShare reduced our monthly reconciliation from 3 weeks to 2 hours. The AI catches errors
                  we used to miss, saving us thousands monthly."
                </p>
                <div className="font-semibold">Sarah Johnson</div>
                <div className="text-sm text-gray-500">Production Manager, Apex Energy</div>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400">★</span>
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "The SCADA integration is seamless. We went from manual spreadsheets to fully automated
                  reconciliation. Game changer for our operations."
                </p>
                <div className="font-semibold">Michael Chen</div>
                <div className="text-sm text-gray-500">Operations Director, Titan Oil & Gas</div>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400">★</span>
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "Finally, a reconciliation platform that understands API MPMS 11.1. Accurate, fast, and the
                  partner portal keeps everyone on the same page."
                </p>
                <div className="font-semibold">David Martinez</div>
                <div className="text-sm text-gray-500">JV Coordinator, Summit Resources</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-900">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600">Choose the plan that fits your operation</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl">Starter</CardTitle>
                <CardDescription>Perfect for small joint ventures</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$499</span>
                  <span className="text-gray-600">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Up to 100 production entries/month</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>API MPMS 11.1 calculations</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>AI anomaly detection</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Email notifications</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Excel export</span>
                  </li>
                </ul>
                <Link href="/auth/register">
                  <Button className="w-full" variant="outline">Start Free Trial</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-4 border-blue-600 shadow-xl relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
              </div>
              <CardHeader>
                <CardTitle className="text-2xl">Professional</CardTitle>
                <CardDescription>For growing operations</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$999</span>
                  <span className="text-gray-600">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Up to 500 production entries/month</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>SCADA API integration</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Advanced forecasting</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Priority support</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Custom allocation models</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Multi-tenant management</span>
                  </li>
                </ul>
                <Link href="/auth/register">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-cyan-500">Start Free Trial</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl">Enterprise</CardTitle>
                <CardDescription>For large-scale operations</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">Custom</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Unlimited entries</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Dedicated account manager</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Custom integrations</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>SLA guarantee</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>On-premise deployment</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>White-label options</span>
                  </li>
                </ul>
                <Button className="w-full" variant="outline">Contact Sales</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-5xl font-bold mb-6">
            Ready to Revolutionize Your Reconciliation?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join hundreds of operators who have eliminated manual reconciliation. Start your 14-day free trial today.
          </p>
          <Link href="/auth/register">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
              Start Free Trial - No Credit Card Required
              <span className="ml-2">→</span>
            </Button>
          </Link>
          <p className="text-sm mt-6 opacity-75">Questions? Email us at sales@flowshare.com</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-6">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">F</span>
                </div>
                <span className="text-white font-bold text-xl">FlowShare</span>
              </div>
              <p className="text-sm">AI-powered hydrocarbon allocation for the modern oil & gas industry.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#features" className="hover:text-white">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="#" className="hover:text-white">Documentation</Link></li>
                <li><Link href="#" className="hover:text-white">API Reference</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white">About Us</Link></li>
                <li><Link href="#" className="hover:text-white">Careers</Link></li>
                <li><Link href="#" className="hover:text-white">Blog</Link></li>
                <li><Link href="#" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-white">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-white">Security</Link></li>
                <li><Link href="#" className="hover:text-white">Compliance</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm">
            <p>&copy; 2025 FlowShare V2. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
