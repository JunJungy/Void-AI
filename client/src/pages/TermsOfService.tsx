import { Link } from "wouter";
import { Music, ArrowLeft } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
              <Music className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold">Void AI</span>
          </Link>
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to App
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
        
        <div className="prose prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">Last updated: December 2024</p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing or using Void AI, you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">2. Description of Service</h2>
            <p className="text-muted-foreground">
              Void AI is an AI-powered music generation platform that allows users to create 
              music tracks using artificial intelligence technology.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">3. User Accounts</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>You must provide accurate information when creating an account</li>
              <li>You are responsible for maintaining the security of your account</li>
              <li>You must not share your account credentials with others</li>
              <li>You must be at least 13 years old to use this service</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">4. Content Ownership</h2>
            <p className="text-muted-foreground">
              You retain ownership of the music you create using Void AI. However, you grant us 
              a non-exclusive license to store and process your content as necessary to provide our services.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">5. Acceptable Use</h2>
            <p>You agree not to use our service to:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Create content that infringes on others' intellectual property rights</li>
              <li>Generate illegal, harmful, or offensive content</li>
              <li>Attempt to bypass any usage limits or security measures</li>
              <li>Resell or redistribute our services without authorization</li>
              <li>Use automated systems to access the service without permission</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">6. Subscription and Payments</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Paid subscriptions are billed in advance on a recurring basis</li>
              <li>You can cancel your subscription at any time</li>
              <li>Refunds are subject to our Refund Policy</li>
              <li>Prices may change with notice to existing subscribers</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">7. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              Void AI is provided "as is" without warranties of any kind. We are not liable for 
              any indirect, incidental, or consequential damages arising from your use of our service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">8. Termination</h2>
            <p className="text-muted-foreground">
              We reserve the right to suspend or terminate your account if you violate these terms 
              or engage in fraudulent activity.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">9. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We may update these terms from time to time. Continued use of the service after 
              changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">10. Contact</h2>
            <p className="text-muted-foreground">
              For questions about these Terms of Service, please contact us through the app.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-white/5 py-6 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <div className="flex justify-center gap-6 mb-4">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link href="/refund" className="hover:text-foreground transition-colors">Refund Policy</Link>
          </div>
          <p>&copy; {new Date().getFullYear()} Void AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
