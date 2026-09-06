"use client";
import Link from "next/link";
import { useClerk, useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Bell,
  Check,
  CheckCircle2,
  CreditCard,
  Info,
  Loader2,
  Save,
  Settings as GearSix,
  ShieldCheck,
  Sparkles as Sparkle,
  User as UserCircle,
  Users,
} from "lucide-react";
import { api } from "../convex/_generated/api";
import type { WhopOfferKey } from "../lib/whop";
import { AI_COSTS } from "../lib/ai-costs";
import "./settings.css";

const plans = [
  { name: "Free", monthly: "$0", yearly: "$0", credits: "12 credits once", description: "Starter credits to try core tools — each generation, edit, and 3D draws from the same balance.", features: ["Up to 3 image generations or edits", "Or 1 complete 3D model", "AR viewing is always free"] },
  { name: "Creator", monthly: "$19/mo", yearly: "$190/yr", credits: "120 credits each month", description: "For homeowners and independent designers creating regularly.", features: ["Up to 30 image generations or edits", "Or up to 10 3D models", "Extra credits available anytime"], highlight: "Recommended" },
  { name: "Studio", monthly: "$49/mo", yearly: "$490/yr", credits: "400 credits each month", description: "For professionals managing ongoing projects.", features: ["Up to 100 image generations or edits", "Or up to 33 3D models", "Best rate for regular production"] },
];
const packs = [
  { key: "credits_50", credits: 50, price: "$10", best: false },
  { key: "credits_150", credits: 150, price: "$25", best: false },
  { key: "credits_400", credits: 400, price: "$55", best: true, badge: "Lowest per credit" },
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
  useEffect(() => { setCheckoutReturned(new URLSearchParams(window.location.search).get("checkout") === "success"); }, []);
  const balanceLoaded = balance !== undefined;
  const balanceText = balanceLoaded ? new Intl.NumberFormat().format(balance.total) : "—";
  const isFreePlan = balance?.plan === "free";
  function handlePackKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const keys = packs.map((p) => p.key) as string[];
    const idx = keys.indexOf(selectedPack);
    let next = idx;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (idx + 1) % keys.length;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (idx - 1 + keys.length) % keys.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = keys.length - 1;
    setSelectedPack(keys[next] as typeof selectedPack);
    setError("");
  }
  async function checkout(offer: WhopOfferKey) {
    setPending(offer); setError("");
    try {
      const response = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ offer }) });
      const result = await response.json().catch(() => null) as { url?: string; error?: string } | null;
      if (!response.ok || !result?.url) throw new Error(result?.error || "Checkout could not start. Please try again.");
      window.location.assign(result.url);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Checkout could not start."); setPending(null); }
  }
  return <div className="commerce-page pricing-page">
    <h1 className="visually-hidden">Pricing</h1>
    <header className="pricing-toolbar">
      <div className="balance-pill" aria-live="polite" aria-busy={balance === undefined}><Sparkle aria-hidden size={16} /> {balance === undefined ? <span>Loading balance…</span> : <><b>{new Intl.NumberFormat().format(balance.total)}</b> credits available</>}{balance !== undefined && (balance.subscription !== undefined || balance.purchased !== undefined) ? <small className="balance-breakdown">{balance.subscription ?? 0} plan + {balance.purchased ?? 0} purchased</small> : null}</div>
      <div className="billing-toggle" role="group" aria-label="Billing period">
        <button aria-pressed={!annual} className={!annual ? "active" : ""} onClick={() => setAnnual(false)}>Monthly</button>
        <button aria-pressed={annual} className={annual ? "active" : ""} onClick={() => setAnnual(true)}>Yearly <small>Save 2 months</small></button>
      </div>
    </header>
    <p className="billing-disclosure" role="note">Yearly plans are billed upfront for 12 months — Creator $190, Studio $490. Included credits refresh monthly; purchased credits expire after 12 months and are used by nearest expiry.</p>
    {checkoutReturned ? <p className="checkout-success" role="status"><Check aria-hidden size={16} /> Checkout complete. We’re confirming your purchase with Whop; your balance updates automatically.</p> : null}
    <section className="plan-grid" aria-label="Plans">
      {plans.map((plan, index) => {
        const isPopular = "highlight" in plan && !!(plan as any).highlight;
        const label = (plan as any).highlight;
        return <article key={plan.name} className={isPopular ? "plan-card popular" : "plan-card"}>
        {isPopular && label ? <span className="popular-label">{label}</span> : null}
        <h2>{plan.name}</h2><p>{plan.description}</p><strong aria-label={annual ? `${plan.yearly} billed yearly upfront` : plan.monthly}>{annual ? plan.yearly : plan.monthly}</strong><b>{plan.credits}</b>
        {annual && index !== 0 ? <small className="plan-annual-note">Billed {plan.yearly.replace("/yr","")} upfront · credits refresh monthly</small> : null}
        <ul>{plan.features.map(feature => <li key={feature}><Check aria-hidden size={16} />{feature}</li>)}</ul>
        {index === 0 ? <button disabled aria-disabled="true">{isFreePlan ? "Current starter plan" : "Starter plan"}</button> : (() => { const offer = `${plan.name.toLowerCase()}_${annual ? "yearly" : "monthly"}` as WhopOfferKey; const current = balance?.plan === offer; const isPending = pending?.startsWith(plan.name.toLowerCase()); return <button className={isPopular ? "primary-action" : ""} disabled={Boolean(pending) || current} aria-busy={isPending ? true : undefined} onClick={() => checkout(offer)}>{current ? "Current plan" : isPending ? "Opening secure checkout…" : `Choose ${plan.name}`}</button>; })()}
      </article>;})}
    </section>
    <p className="pricing-note" role="note">One shared balance for every AI action. “Up to X images <em>or</em> Y models” are alternative uses — mixing reduces each count. Detections 1 credit, image generations/edits 4, 3D models 12. AR viewing is free after a model exists.</p>
    <section className="topup-section" aria-labelledby="topup-title"><div><span className="eyebrow">Extra credits</span><h2 id="topup-title">Add credits, keep your plan.</h2><p>Choose a pack, then continue to Whop’s secure checkout. Purchased credits remain available for 12 months and are consumed by nearest expiry after plan credits.</p></div><div className="pack-purchase"><div className="pack-grid" role="radiogroup" aria-label="Extra credit pack" tabIndex={0} onKeyDown={handlePackKeyDown}>{packs.map(pack => <button key={pack.key} role="radio" aria-checked={selectedPack === pack.key} tabIndex={selectedPack === pack.key ? 0 : -1} className={`${(pack as any).best ? "best " : ""}${selectedPack === pack.key ? "selected" : ""}`} disabled={Boolean(pending)} onClick={() => { setSelectedPack(pack.key); setError(""); }}><span><b>{pack.credits} credits</b>{(pack as any).badge && (pack as any).best ? <small>{(pack as any).badge}</small> : (pack as any).best ? <small>Best value</small> : null}</span><strong>{pack.price}</strong><small className="pack-unit" aria-hidden="true">{pack.credits === 400 ? "$0.14 per credit" : pack.credits === 150 ? "$0.17 per credit" : "$0.20 per credit"}</small></button>)}</div><button className="primary-action pack-checkout" disabled={Boolean(pending)} aria-busy={pending?.startsWith("credits_") ? true : undefined} onClick={() => checkout(selectedPack)}>{pending?.startsWith("credits_") ? "Opening secure checkout…" : `Buy ${packs.find(pack => pack.key === selectedPack)?.credits} credits`}</button></div></section>
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
      <p className="credit-cost-note">Example: scan a photo once and edit two objects = {AI_COSTS.detection + AI_COSTS.imageEdit * 2} credits. Failed or empty detection scans return the scanning credit. AR viewing is free after a model exists. Mixed actions share one balance.</p>
    </section>
  <footer className="legal-links"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/refunds">Refunds</Link><Link href="/cookies">Cookies</Link><span>Payments are securely processed by Whop.</span></footer>
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
  const [baseline, setBaseline] = useState(defaults);
  const [notice, setNotice] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const browserTz = useMemo(() => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || form.timezone || defaults.timezone; } catch { return form.timezone; }
  }, [form.timezone]);
  const isLoading = saved === undefined;
  const sections = useMemo(() => ["Profile", "Workspace", "AI defaults", "Team", "Notifications", "Billing", "Privacy & data"], []);
  const editableTabs = useMemo(() => new Set(["Workspace", "AI defaults", "Notifications", "Privacy & data"]), []);
  const isEditable = editableTabs.has(tab);
  const isDirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(baseline), [form, baseline]);
  useEffect(() => {
    if (saved) {
      const merged = { ...defaults, ...saved } as typeof defaults;
      setForm(merged);
      setBaseline(merged);
    }
  }, [saved]);
  const set = (key: keyof typeof defaults, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));
  const persist = async () => {
    if (saving) return;
    setSaving(true);
    setSaveError("");
    setNotice("");
    try {
      const tz = browserTz || form.timezone;
      await save({ ...form, timezone: tz });
      setBaseline({ ...form, timezone: tz } as typeof defaults);
      setNotice("Saved");
      window.setTimeout(() => setNotice(""), 2500);
    } catch (reason) {
      setSaveError(reason instanceof Error ? reason.message : "Settings could not be saved. Try again.");
    } finally {
      setSaving(false);
    }
  };
  const canSave = isEditable && (isDirty || Boolean(saveError)) && !saving;
  const statusState: "saving" | "error" | "unsaved" | "saved" = saveError ? "error" : saving ? "saving" : isDirty ? "unsaved" : "saved";
  const statusIcon =
    statusState === "error" ? <AlertCircle aria-hidden size={14} /> :
    statusState === "saving" ? <Loader2 aria-hidden size={14} className="spin" /> :
    statusState === "saved" ? <CheckCircle2 aria-hidden size={14} /> :
    <Info aria-hidden size={14} />;
  const statusText =
    statusState === "error" ? saveError :
    statusState === "saving" ? "Saving…" :
    statusState === "saved" ? (notice ? "Saved · All changes stored" : "Saved") :
    "Unsaved changes";
  return (
    <div className="settings-page settings-page--compact">
      <header className="settings-header">
        <h1>Settings</h1>
        <p>Manage your profile, workspace preferences, and privacy. Changes save only when you confirm.</p>
      </header>
      <div className="settings-layout--compact">
        <nav className="settings-nav" aria-label="Settings sections">
          {sections.map((section) => (
            <button
              key={section}
              className={tab === section ? "active" : ""}
              aria-current={tab === section ? "page" : undefined}
              onClick={() => setTab(section)}
            >
              {section}
            </button>
          ))}
        </nav>
        <section className="settings-panel--compact" aria-live="polite" aria-busy={isLoading}>
          {isLoading ? (
            <div className="settings-section--compact">
              <header>
                <span aria-hidden><Loader2 size={18} className="spin" /></span>
                <div><h2>Loading settings</h2><p>Fetching your saved preferences…</p></div>
              </header>
              <div className="settings-hint" role="status">Please wait — preferences are being loaded.</div>
            </div>
          ) : null}
          {!isLoading && tab === "Profile" ? (
            <SettingsSection icon={<UserCircle aria-hidden size={18} />} title="Profile" description="Your name and email are read-only here and stored with your Housora account.">
              <ReadOnly label="Name" value={user?.fullName || "Not set"} />
              <ReadOnly label="Email" value={user?.primaryEmailAddress?.emailAddress || "Not set"} />
              <p className="settings-hint">To update your name or email, open your account. You’ll be asked to verify changes.</p>
              <button onClick={() => openUserProfile()} aria-label="Open account">Open account</button>
              <p className="settings-hint settings-hint--muted">Account changes are confirmed by your sign-in provider. No extra provider names are needed here.</p>
            </SettingsSection>
          ) : null}
          {!isLoading && tab === "Workspace" ? (
            <SettingsSection icon={<GearSix aria-hidden size={18} />} title="Workspace" description="Studio details and regional preferences for upcoming work.">
              <Field label="Studio name">
                <input value={form.studioName} onChange={(e) => set("studioName", e.target.value)} placeholder="e.g. Ismail Studio" aria-label="Studio name" />
              </Field>
              <div className="settings-pair--compact">
                <Select label="Language" value={form.language} values={["English", "French", "Arabic"]} onChange={(v) => set("language", v)} />
                <Select label="Measurements" value={form.measurements} values={["Metric", "Imperial"]} onChange={(v) => set("measurements", v)} />
              </div>
              <div className="settings-pair--compact">
                <Select label="Currency" value={form.currency} values={["USD", "EUR", "GBP", "MAD"]} onChange={(v) => set("currency", v)} />
                <Field label="Timezone">
                  <input value={browserTz} readOnly aria-describedby="tz-help" aria-label="Timezone, auto-detected" />
                </Field>
              </div>
              <p id="tz-help" className="settings-hint">Auto-detected from your browser: <b style={{ color: "#efede6" }}>{browserTz}</b>. No need to set it manually. If your device time is incorrect, correct it in your system settings.</p>
              <p className="settings-hint settings-hint--muted">These preferences are saved for your workspace.</p>
            </SettingsSection>
          ) : null}
          {!isLoading && tab === "AI defaults" ? (
            <SettingsSection icon={<Sparkle aria-hidden size={18} />} title="AI defaults" description="Choose how Housora starts each new project.">
              <Select label="Default design mode" value={form.defaultMode} values={["Interior", "Exterior", "Garden"]} onChange={(v) => set("defaultMode", v)} />
              <Toggle
                label="Confirm high-cost actions (required)"
                hint={`Housora always asks before spending credits. A 3D model costs ${AI_COSTS.model3d} credits; image generations and edits cost ${AI_COSTS.imageEdit}; detection costs ${AI_COSTS.detection}.`}
                checked
                onChange={() => undefined}
                disabled
              />
              <p className="settings-hint">This preference is saved. Today, every paid action still shows a confirmation with live balance, cost, and remaining credits before any charge. Turning this off does not skip confirmations — no spending consent is weakened.</p>
              <p className="settings-hint settings-hint--muted">Your choice will be used when starting a new project.</p>
            </SettingsSection>
          ) : null}
          {!isLoading && tab === "Team" ? (
            <SettingsSection icon={<Users aria-hidden size={18} />} title="Team & sharing" description="Sharing and invites will be added in a future release.">
              <div className="unavailable-card" role="status" aria-live="polite">
                <span aria-hidden><Users size={18} /></span>
                <h3>Team invites unavailable</h3>
                <p>Housora currently runs as a personal workspace. Email invites, roles, and shared project permissions are not yet available. No invitations can be sent from this screen today. Project sharing links for viewers exist at the project level where supported.</p>
              </div>
            </SettingsSection>
          ) : null}
          {!isLoading && tab === "Notifications" ? (
            <SettingsSection icon={<Bell aria-hidden size={18} />} title="Notifications" description="Store your preferences. No messages are sent yet.">
              <Toggle label="Generation updates" hint="Save preference for when a longer render finishes. No email or push is sent yet." checked={form.generationNotifications} onChange={(v) => set("generationNotifications", v)} />
              <Toggle label="Low-credit alerts" hint="Save preference for balance warnings. No alerts are delivered yet." checked={form.creditNotifications} onChange={(v) => set("creditNotifications", v)} />
              <Toggle label="Collaboration updates" hint="Save preference for invites, comments, and approvals. No notifications are delivered yet." checked={form.collaborationNotifications} onChange={(v) => set("collaborationNotifications", v)} />
              <p className="settings-hint">Preferences are stored now and will take effect only after delivery is connected. Until then, you won’t receive emails or push notifications for these items.</p>
              <p className="settings-hint settings-hint--muted">You can change these preferences at any time.</p>
            </SettingsSection>
          ) : null}
          {!isLoading && tab === "Billing" ? (
            <SettingsSection icon={<CreditCard aria-hidden size={18} />} title="Billing and credits" description="Plan and purchased credits are tracked separately and spent in one order.">
              <div className="billing-summary--compact" role="group" aria-label="Credit balances">
                <span><small>Current plan</small><b>{balance ? balance.plan.replaceAll("_", " ") : "Loading…"}</b></span>
                <span><small>Plan credits</small><b style={{ fontVariantNumeric: "tabular-nums" }}>{balance ? `${(balance.subscription ?? 0).toLocaleString()}` : "—"}</b><small style={{ letterSpacing: 0, textTransform: "none" }}>{balance ? `${(balance.subscription ?? 0) === 1 ? "credit" : "credits"} · renews with plan` : ""}</small></span>
                <span><small>Purchased credits</small><b style={{ fontVariantNumeric: "tabular-nums" }}>{balance ? `${(balance.purchased ?? 0).toLocaleString()}` : "—"}</b><small style={{ letterSpacing: 0, textTransform: "none" }}>{balance ? "credits · expire after 12 months" : ""}</small></span>
              </div>
              <p className="settings-hint">Total available: <b style={{ color: "#efede6" }}>{balance ? `${(balance.total ?? 0).toLocaleString()} credits` : "—"}</b> — plan credits are used first, then purchased credits by nearest expiry.</p>
              <button className="primary-action" onClick={onPricing} aria-label="View plans and add credits">View plans and add credits</button>
              <p className="settings-note">Manage cancellation, payment method, and invoices in your Whop customer portal (access via your Whop purchase receipt or the Whop support channels). Housora never receives your card details. Do not use unofficial links.</p>
              <p className="settings-hint settings-hint--muted">Balances are formatted with tabular numbers for easy comparison. Purchased credits remain available for 12 months after purchase.</p>
            </SettingsSection>
          ) : null}
          {!isLoading && tab === "Privacy & data" ? (
            <SettingsSection icon={<ShieldCheck aria-hidden size={18} />} title="Privacy and data" description="Optional analytics remain off unless you enable them.">
              <Toggle label="Product analytics" hint="Share interaction events that help improve Housora. Prompts, uploaded images, and photo content are excluded." checked={form.analyticsConsent} onChange={(v) => { set("analyticsConsent", v); if (!v) set("replayConsent", false); }} />
              <Toggle label="Session replay" hint="Session replay is currently unavailable. No recordings are created." checked={false} onChange={() => undefined} disabled />
              {!form.analyticsConsent ? <p className="settings-hint">Enable Product analytics first — session replay cannot remain on when analytics is off.</p> : null}
              <p className="settings-hint settings-hint--muted">Analytics are optional. Session replay is currently unavailable.</p>
              <div className="settings-legal">
                <Link href="/privacy">Privacy Policy</Link>
                <Link href="/terms">Terms of Service</Link>
                <Link href="/refunds">Refunds</Link>
                <Link href="/cookies">Cookies</Link>
              </div>
              <div className="security-grid">
                <div>
                  <h3>Account security</h3>
                  <p>Change your password, enable passkeys or 2FA, review active sessions, and control sign-in methods. These controls open in your secure account area.</p>
                  <button onClick={() => openUserProfile()} aria-label="Manage security">Manage security</button>
                </div>
                <div>
                  <h3>Delete account</h3>
                  <p>Permanently delete your Housora account and associated data. You’ll be asked to confirm and re-authenticate. This action cannot be undone.</p>
                  <button className="danger" onClick={() => openUserProfile()} aria-label="Delete account">Delete account</button>
                </div>
              </div>
            </SettingsSection>
          ) : null}
          {isEditable ? (
            <div className="settings-save--compact" role="status" aria-live="polite">
              <span className={statusState === "error" ? "settings-error" : statusState === "unsaved" ? "settings-unsaved" : "settings-saved"}>
                {statusIcon} {statusText}
              </span>
              <button onClick={persist} disabled={!canSave} aria-busy={saving}>
                {saving ? <><Loader2 aria-hidden size={14} className="spin" /> Saving…</> : statusState === "error" ? <><AlertCircle aria-hidden size={14} /> Retry</> : <><Save aria-hidden size={14} /> Save changes</>}
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function SettingsSection({ icon, title, description, children }: { icon: React.ReactNode; title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="settings-section--compact">
      <header>
        <span aria-hidden>{icon}</span>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </header>
      <div className="settings-fields--compact">{children}</div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="settings-field--compact">
      <span>{label}</span>
      {children}
    </label>
  );
}
function Select({ label, value, values, onChange }: { label: string; value: string; values: string[]; onChange: (value: string) => void }) {
  return (
    <Field label={label}>
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
        {values.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
    </Field>
  );
}
function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div className="settings-readonly--compact">
      <small>{label}</small>
      <b>{value}</b>
    </div>
  );
}
function Toggle({ label, hint, checked, onChange, disabled = false }: { label: string; hint: string; checked: boolean; onChange: (value: boolean) => void; disabled?: boolean }) {
  return (
    <label className={disabled ? "settings-toggle--compact disabled" : "settings-toggle--compact"}>
      <span>
        <b>{label}</b>
        <small>{hint}</small>
      </span>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} aria-label={label} />
    </label>
  );
}
