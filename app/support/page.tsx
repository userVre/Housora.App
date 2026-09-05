import Link from "next/link";
import { getLegalConfig } from "../../lib/legal-config";

export default function SupportPage() {
  const legal = getLegalConfig();
  return <main className="legal-page support-page">
    <header><Link href="/">Housora</Link><span>Support</span></header>
    <article>
      <span className="eyebrow">Help</span>
      <h1>How can we help?</h1>
      <p className="legal-lead">For account, billing, privacy, or product questions, contact the Housora team.</p>
      {legal.supportEmail ? <a className="support-email" href={`mailto:${legal.supportEmail}`}>Email {legal.supportEmail}</a> : <div className="legal-config-warning" role="alert"><strong>Support contact is not configured.</strong><p>The site owner must add HOUSORA_SUPPORT_EMAIL before public launch.</p></div>}
      {!legal.ready ? <p className="legal-operator-note">Operator details are incomplete. Public launch remains blocked until the required legal configuration is supplied.</p> : null}
    </article>
    <footer><Link href="/privacy">Privacy Policy</Link><Link href="/terms">Terms of Service</Link><Link href="/">Back to Housora</Link></footer>
  </main>;
}
