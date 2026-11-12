import { Plus, X } from 'lucide-react';

const fields = [
  ['name', 'Product name', 'text'], ['sku', 'SKU', 'text'], ['quantity', 'Quantity', 'number'],
  ['cost', 'Cost price', 'number'], ['price', 'Selling price', 'number'],
  ['threshold', 'Low stock threshold', 'number'], ['description', 'Description (optional)', 'text'],
];

export default function ProductForm({ value, editing, onChange, onSubmit, onCancel }) {
  return <form className="addform" onSubmit={onSubmit}>
    {fields.map(([key, label, type]) => <input key={key} type={type}
      min={type === 'number' ? 0 : undefined} step={['cost', 'price'].includes(key) ? '0.01' : undefined}
      placeholder={label} value={value[key] ?? ''} required={['name', 'sku', 'quantity'].includes(key)}
      onChange={event => onChange({ ...value, [key]: event.target.value })} />)}
    <button className="primary">{editing ? 'Save changes' : <><Plus /> Add product</>}</button>
    {editing && <button type="button" className="secondary" onClick={onCancel}><X /> Cancel</button>}
  </form>;
}
