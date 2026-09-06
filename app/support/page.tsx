import Link from "next/link";
import { getLegalConfig } from "../../lib/legal-config";
import "../legal.css";
export default function SupportPage() {
  const legal = getLegalConfig();
  return (
    <div className="legal-page">
      <a className="legal-skip" href="#legal-content">Skip to content</a>
      <div className="legal-shell"><header className="legal-header"><Link href="/" className="legal-brand" aria-label="Housora home">Housora</Link><nav aria-label="Policy navigation"><Link href="/privacy" className="legal-nav-link">Privacy</Link><Link href="/terms" className="legal-nav-link">Terms</Link><Link href="/support" className="legal-nav-link" aria-current="page">Support</Link></nav></header></div>
      <main id="legal-content" className="legal-article" tabIndex={-1}>
        <span className="legal-eyebrow">Help</span><h1>How can we help?</h1><p className="legal-lead">For account, billing, privacy, or product questions, contact the Housora team.</p>
        {legal.supportEmail ? (<p style={{ marginTop: 18 }}><a className="legal-back" href={`mailto:${legal.supportEmail}`}>Email {legal.supportEmail}</a></p>) : (<section className="legal-banner legal-banner--pending" role="alert"><strong>Support contact is not configured</strong><p>The support contact has not been published yet. The operator will add it before public launch.</p></section>)}
        {!legal.ready ? (<section className="legal-banner legal-banner--draft" role="note" style={{ marginTop: 16 }}><strong>Operator details are incomplete</strong><p>Public launch remains blocked until the required operator information is complete. Diagnostic details for administrators remain available via the health endpoint.</p></section>) : null}
        <section className="legal-section" id="support-contact"><h2>Other ways to reach us</h2><p>Use the in-app help where available, or return to your workspace. All policy pages remain reachable without signing in.</p></section>
        <div style={{ marginTop: 22 }}><Link href="/" className="legal-back">Back to Housora</Link></div>
      </main>
      <footer className="legal-footer"><nav aria-label="Footer policies"><Link href="/privacy">Privacy Policy</Link><Link href="/terms">Terms of Service</Link><Link href="/cookies">Cookies</Link><Link href="/refunds">Refunds</Link><Link href="/">Housora</Link></nav><p>© {new Date().getFullYear()} Housora — AI-assisted space design.</p></footer>
    </div>
  );
}
