export function ConfigurationRequired({ missing }: { missing: string[] }) {
  return (
    <main className="auth-page">
      <section className="auth-card configuration-card">
        <a className="auth-brand" href="/">Housora</a>
        <span className="eyebrow">Configuration required</span>
        <h1>Finish connecting your account services.</h1>
        <p>The code is ready, but these public configuration values are still missing:</p>
        <ul>{missing.map((item) => <li key={item}><code>{item}</code></li>)}</ul>
        <p className="configuration-note">Add them to <code>.env.local</code>, then restart Housora.</p>
      </section>
    </main>
  );
}

