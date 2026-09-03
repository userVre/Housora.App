"use client";

import Link from "next/link";
import { useClerk, useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useMemo, useState } from "react";
import { Check, CreditCard, GearSix, ShieldCheck, Sparkle, UserCircle } from "@phosphor-icons/react";
import { api } from "../convex/_generated/api";
import type { WhopOfferKey } from "../lib/whop";
import { AI_COSTS } from "../lib/ai-costs";

const plans = [
  { name: "Free", monthly: "$0", yearly: "$0", credits: "12 credits once", description: "Try the complete room-design workflow.", features: ["Image editing", "Object detection", "3D and AR previews"] },
  { name: "Creator", monthly: "$19/mo", yearly: "$190/yr", credits: "120 credits every month", description: "For homeowners and independent designers.", features: ["Everything in Free", "Credits refresh monthly", "Buy extra credits anytime"], popular: true },
  { name: "Studio", monthly: "$49/mo", yearly: "$490/yr", credits: "400 credits every month", description: "For professionals with a steady project pipeline.", features: ["Everything in Creator", "Higher monthly allowance", "Priority generation queue"] },
];

const packs = [
  { key: "credits_50", credits: 50, price: "$10", best: false },
  { key: "credits_150", credits: 150, price: "$25", best: true },
  { key: "credits_400", credits: 400, price: "$55", best: false },
] as const;

export function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [selectedPack, setSelectedPack] = useState<(typeof packs)[number]["key"]>("credits_150");
  const [checkoutReturned, setCheckoutReturned] = useState(false);
  const balance = useQuery(api.credits.getMyBalance, {});
  const initialize = useMutation(api.credits.initialize);
  useEffect(() => { void initialize(); }, [initialize]);
  useEffect(() => {
    setCheckoutReturned(new URLSearchParams(window.location.search).get("checkout") === "success");
  }, []);

  async function checkout(offer: WhopOfferKey) {
    setPending(offer); setError("");
    try {
      const response = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ offer }) });
      const result = await response.json().catch(() => null) as { url?: string; error?: string } | null;
      if (!response.ok || !result?.url) throw new Error(result?.error || "Checkout could not start. Please try again.");
      window.location.assign(result.url);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Checkout could not start.");
      setPending(null);
    }
  }

  return <div className="commerce-page pricing-page">
    <h1 className="visually-hidden">Pricing</h1>
    <header className="pricing-toolbar">
      <div className="balance-pill"><Sparkle /> <b>{balance?.total ?? "—"}</b> credits available</div>
      <div className="billing-toggle" role="group" aria-label="Billing period">
        <button aria-pressed={!annual} className={!annual ? "active" : ""} onClick={() => setAnnual(false)}>Monthly</button>
        <button aria-pressed={annual} className={annual ? "active" : ""} onClick={() => setAnnual(true)}>Yearly <small>Save 2 months</small></button>
      </div>
    </header>
    {checkoutReturned ? <p className="checkout-success" role="status"><Check /> Checkout complete. We’re confirming your purchase with Whop; your balance updates automatically.</p> : null}
    <section className="plan-grid" aria-label="Plans">
      {plans.map((plan, index) => <article key={plan.name} className={plan.popular ? "plan-card popular" : "plan-card"}>
        {plan.popular ? <span className="popular-label">Best for most people</span> : null}
        <h2>{plan.name}</h2><p>{plan.description}</p><strong>{annual ? plan.yearly : plan.monthly}</strong><b>{plan.credits}</b>
        <ul>{plan.features.map(feature => <li key={feature}><Check />{feature}</li>)}</ul>
        {index === 0 ? <button disabled>{balance?.plan === "free" ? "Current starter plan" : "Starter plan"}</button> : (() => { const offer = `${plan.name.toLowerCase()}_${annual ? "yearly" : "monthly"}` as WhopOfferKey; const current = balance?.plan === offer; return <button className={plan.popular ? "primary-action" : ""} disabled={Boolean(pending) || current} onClick={() => checkout(offer)}>{current ? "Current plan" : pending?.startsWith(plan.name.toLowerCase()) ? "Opening secure checkout…" : `Choose ${plan.name}`}</button>; })()}
      </article>)}
    </section>
    <section className="topup-section"><div><span className="eyebrow">Extra credits</span><h2>Add credits, keep your plan.</h2><p>Choose a pack, then continue to Whop’s secure checkout. Purchased credits remain available for 12 months.</p></div><div className="pack-purchase"><div className="pack-grid" role="radiogroup" aria-label="Extra credit pack">{packs.map(pack => <button key={pack.key} role="radio" aria-checked={selectedPack === pack.key} className={`${pack.best ? "best " : ""}${selectedPack === pack.key ? "selected" : ""}`} disabled={Boolean(pending)} onClick={() => { setSelectedPack(pack.key); setError(""); }}><span><b>{pack.credits} credits</b>{pack.best ? <small>Best value</small> : null}</span><strong>{pack.price}</strong></button>)}</div><button className="primary-action pack-checkout" disabled={Boolean(pending)} onClick={() => checkout(selectedPack)}>{pending?.startsWith("credits_") ? "Opening secure checkout…" : `Buy ${packs.find(pack => pack.key === selectedPack)?.credits} credits`}</button></div></section>
    {error ? <p className="checkout-error" role="alert">{error}</p> : null}
    <section className="credit-cost-section" aria-labelledby="credit-cost-title">
      <header><h2 id="credit-cost-title">Credit costs</h2><p>One balance for every AI tool. Here’s what each action uses.</p></header>
      <table className="credit-cost-table">
        <caption className="visually-hidden">Housora credit cost per action</caption>
        <thead><tr><th scope="col">Action</th><th scope="col">What’s included</th><th scope="col">Credits</th></tr></thead>
        <tbody>
          <tr><th scope="row">Auto-detect objects</th><td>Scan one photo for objects and surfaces, with masks and cropped previews.</td><td>{AI_COSTS.detection}</td></tr>
          <tr><th scope="row">Generate an image</th><td>Create a new design with one image-generation request.</td><td>{AI_COSTS.imageEdit}</td></tr>
          <tr><th scope="row">Edit an image or object</th><td>Apply one AI edit. Reuse detected objects without paying for another scan.</td><td>{AI_COSTS.imageEdit}</td></tr>
          <tr><th scope="row">First scan + one edit</th><td>{AI_COSTS.detection} credit to detect objects + {AI_COSTS.imageEdit} credits for one edit.</td><td>{AI_COSTS.detection + AI_COSTS.imageEdit} total</td></tr>
          <tr><th scope="row">Create a 3D model</th><td>Generate one textured 3D model from a furniture image.</td><td>{AI_COSTS.model3d}</td></tr>
          <tr><th scope="row">Select a detected object</th><td>Choose or switch between objects from your completed scan.</td><td>Free</td></tr>
          <tr><th scope="row">View in AR</th><td>Open an existing 3D model in your room on a supported device.</td><td>Free</td></tr>
        </tbody>
      </table>
      <p className="credit-cost-note">Example: scan a photo once and edit two objects = {AI_COSTS.detection + AI_COSTS.imageEdit * 2} credits. Failed or empty detection scans return the scanning credit.</p>
    </section>
    <footer className="legal-links"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><span>Payments are securely processed by Whop.</span></footer>
  </div>;
}

const defaults = { studioName: "", language: "English", timezone: "Africa/Casablanca", currency: "USD", measurements: "Metric", defaultMode: "Interior", defaultQuality: "Standard", referenceFidelity: "Balanced", confirmHighCost: true, generationNotifications: true, creditNotifications: true, collaborationNotifications: true, marketingEmails: false, analyticsConsent: false, replayConsent: false };

export function SettingsPage({ onPricing }: { onPricing: () => void }) {
  const { user } = useUser();
  const { openUserProfile } = useClerk();
  const saved = useQuery(api.preferences.getMine, {});
  const balance = useQuery(api.credits.getMyBalance, {});
  const save = useMutation(api.preferences.saveMine);
  const [tab, setTab] = useState("Profile");
  const [form, setForm] = useState(defaults);
  const [notice, setNotice] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (saved) setForm({ ...defaults, ...saved }); }, [saved]);
  const sections = useMemo(() => ["Profile", "Workspace", "AI defaults", "Notifications", "Billing", "Privacy & data"], []);
  const set = (key: keyof typeof defaults, value: string | boolean) => setForm(current => ({ ...current, [key]: value }));
  const persist = async () => {
    if (saving) return;
    setSaving(true);
    setSaveError("");
    setNotice("");
    try {
      await save(form);
      setNotice("Settings saved");
      window.setTimeout(() => setNotice(""), 2500);
    } catch (reason) {
      setSaveError(reason instanceof Error ? reason.message : "Settings could not be saved. Try again.");
    } finally {
      setSaving(false);
    }
  };
  return <div className="settings-page">
    <header><span className="eyebrow">Workspace</span><h1>Settings</h1><p>Manage your account, design defaults, billing and privacy choices.</p></header>
    <div className="settings-layout"><nav aria-label="Settings sections">{sections.map(section => <button className={tab === section ? "active" : ""} onClick={() => setTab(section)} key={section}>{section}</button>)}</nav><section className="settings-panel">
      {tab === "Profile" ? <SettingsSection icon={<UserCircle />} title="Profile" description="Your identity is securely managed by Clerk."><ReadOnly label="Name" value={user?.fullName || "Not set"}/><ReadOnly label="Email" value={user?.primaryEmailAddress?.emailAddress || "Not set"}/><button onClick={() => openUserProfile()}>Manage account and security</button></SettingsSection> : null}
      {tab === "Workspace" ? <SettingsSection icon={<GearSix />} title="Workspace" description="Set the regional details used across projects."><Field label="Studio name"><input value={form.studioName} onChange={e => set("studioName", e.target.value)} /></Field><div className="settings-pair"><Select label="Language" value={form.language} values={["English", "French", "Arabic"]} onChange={v => set("language", v)}/><Select label="Measurements" value={form.measurements} values={["Metric", "Imperial"]} onChange={v => set("measurements", v)}/></div><div className="settings-pair"><Select label="Currency" value={form.currency} values={["USD", "EUR", "GBP", "MAD"]} onChange={v => set("currency", v)}/><Field label="Timezone"><input value={form.timezone} onChange={e => set("timezone", e.target.value)} /></Field></div></SettingsSection> : null}
      {tab === "AI defaults" ? <SettingsSection icon={<Sparkle />} title="AI defaults" description="Start every new project with the choices you use most."><Select label="Design mode" value={form.defaultMode} values={["Interior", "Exterior", "Garden"]} onChange={v => set("defaultMode", v)}/><Select label="Image quality" value={form.defaultQuality} values={["Standard", "High"]} onChange={v => set("defaultQuality", v)}/><Select label="Reference fidelity" value={form.referenceFidelity} values={["Flexible", "Balanced", "Literal"]} onChange={v => set("referenceFidelity", v)}/><Toggle label="Confirm higher-cost generations" hint="Ask before any 3D generation or other action costing 10+ credits." checked={form.confirmHighCost} onChange={v => set("confirmHighCost", v)}/></SettingsSection> : null}
      {tab === "Notifications" ? <SettingsSection icon={<Sparkle />} title="Notifications" description="Choose which useful updates Housora may send."><Toggle label="Generation updates" hint="Tell me when a longer render finishes." checked={form.generationNotifications} onChange={v => set("generationNotifications", v)}/><Toggle label="Low-credit alerts" hint="Warn me before my balance interrupts a project." checked={form.creditNotifications} onChange={v => set("creditNotifications", v)}/><Toggle label="Collaboration updates" hint="Invites, comments and approvals." checked={form.collaborationNotifications} onChange={v => set("collaborationNotifications", v)}/><Toggle label="Product news and offers" hint="Optional marketing email." checked={form.marketingEmails} onChange={v => set("marketingEmails", v)}/></SettingsSection> : null}
      {tab === "Billing" ? <SettingsSection icon={<CreditCard />} title="Billing and credits" description="Your plan balance and purchased credits are kept separate."><div className="billing-summary"><span><small>Current plan</small><b>{balance?.plan.replaceAll("_", " ") || "Free"}</b></span><span><small>Plan credits</small><b>{balance?.subscription ?? "—"}</b></span><span><small>Purchased credits</small><b>{balance?.purchased ?? "—"}</b></span></div><button className="primary-action" onClick={onPricing}>View plans and add credits</button><p className="settings-note">Subscription cancellation and payment-method changes are managed in your Whop customer portal.</p></SettingsSection> : null}
      {tab === "Privacy & data" ? <SettingsSection icon={<ShieldCheck />} title="Privacy and data" description="Optional analytics remain off unless you choose to enable them."><Toggle label="Product analytics" hint="Share interaction events that help improve Housora. Prompts and uploaded images are excluded." checked={form.analyticsConsent} onChange={v => setForm(current => ({ ...current, analyticsConsent: v, replayConsent: v ? current.replayConsent : false }))}/><Toggle label="Session replay" hint="Share a masked replay for UX troubleshooting. Requires product analytics." checked={form.replayConsent} onChange={v => set("replayConsent", v)} disabled={!form.analyticsConsent}/><div className="settings-legal"><Link href="/privacy">Read Privacy Policy</Link><Link href="/terms">Read Terms of Service</Link></div><button onClick={() => openUserProfile()}>Manage security or delete account</button></SettingsSection> : null}
      {tab !== "Profile" && tab !== "Billing" ? <div className="settings-save"><span className={saveError ? "settings-error" : ""} role={saveError ? "alert" : "status"}>{saveError || notice}</span><button className="primary-action" onClick={persist} disabled={saving}>{saving ? "Saving…" : "Save changes"}</button></div> : null}
    </section></div>
  </div>;
}

function SettingsSection({ icon, title, description, children }: { icon: React.ReactNode; title: string; description: string; children: React.ReactNode }) { return <div className="settings-section"><header><span>{icon}</span><div><h2>{title}</h2><p>{description}</p></div></header><div className="settings-fields">{children}</div></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="settings-field"><span>{label}</span>{children}</label>; }
function Select({ label, value, values, onChange }: { label: string; value: string; values: string[]; onChange: (value: string) => void }) { return <Field label={label}><select value={value} onChange={e => onChange(e.target.value)}>{values.map(item => <option key={item}>{item}</option>)}</select></Field>; }
function ReadOnly({ label, value }: { label: string; value: string }) { return <div className="settings-readonly"><small>{label}</small><b>{value}</b></div>; }
function Toggle({ label, hint, checked, onChange, disabled = false }: { label: string; hint: string; checked: boolean; onChange: (value: boolean) => void; disabled?: boolean }) { return <label className={disabled ? "settings-toggle disabled" : "settings-toggle"}><span><b>{label}</b><small>{hint}</small></span><input type="checkbox" checked={checked} disabled={disabled} onChange={e => onChange(e.target.checked)}/></label>; }
