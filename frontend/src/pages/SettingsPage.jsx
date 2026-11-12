export default function SettingsPage({ threshold, onChange, onSave }) {
  return <section className="panel"><h2>Inventory settings</h2>
    <p className="muted">Default used when a product has no custom low-stock threshold.</p>
    <form className="settingsform" onSubmit={onSave}>
      <label>Default low-stock threshold<input type="number" min="0" value={threshold} onChange={e => onChange(e.target.value)} required /></label>
      <button className="primary">Save settings</button>
    </form>
  </section>;
}
