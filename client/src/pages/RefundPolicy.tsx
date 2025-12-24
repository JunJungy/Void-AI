import { Link } from "wouter";
import { Music, ArrowLeft } from "lucide-react";

export default function RefundPolicy() {
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
        <h1 className="text-3xl font-bold mb-8">Refund Policy</h1>
        
        <div className="prose prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">Last updated: December 2024</p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">1. Subscription Refunds</h2>
            <p className="text-muted-foreground">
              We offer refunds under the following conditions:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">Within 7 days of purchase:</strong> Full refund if you have not 
                used more than 10 credits from your subscription
              </li>
              <li>
                <strong className="text-foreground">Technical issues:</strong> Pro-rated refund if our service 
                was unavailable for an extended period
              </li>
              <li>
                <strong className="text-foreground">Billing errors:</strong> Full refund for any duplicate or 
                erroneous charges
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">2. Non-Refundable Items</h2>
            <p>The following are not eligible for refunds:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Credits that have already been used for music generation</li>
              <li>Subscriptions after the 7-day refund window</li>
              <li>Accounts terminated for Terms of Service violations</li>
              <li>Partial subscription periods after cancellation</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">3. How to Request a Refund</h2>
            <p className="text-muted-foreground">
              To request a refund, please contact us with:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Your account email address</li>
              <li>Date of purchase</li>
              <li>Reason for the refund request</li>
              <li>Any relevant transaction IDs or receipts</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">4. Processing Time</h2>
            <p className="text-muted-foreground">
              Refund requests are typically processed within 5-10 business days. 
              Once approved, the refund will appear on your original payment method 
              within 5-10 additional business days, depending on your bank.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">5. Cancellation</h2>
            <p className="text-muted-foreground">
              You can cancel your subscription at any time from your account settings. 
              Upon cancellation:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Your subscription will remain active until the end of the billing period</li>
              <li>You will retain access to your generated music</li>
              <li>Unused credits will expire at the end of the billing period</li>
              <li>You will not be charged for future billing cycles</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">6. Chargebacks</h2>
            <p className="text-muted-foreground">
              If you believe there has been an error with your charge, please contact us 
              before initiating a chargeback with your bank. We are committed to resolving 
              any billing issues quickly and fairly.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">7. Contact Us</h2>
            <p className="text-muted-foreground">
              For refund requests or billing questions, please contact us through the app 
              or email our support team. We aim to respond to all inquiries within 48 hours.
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
