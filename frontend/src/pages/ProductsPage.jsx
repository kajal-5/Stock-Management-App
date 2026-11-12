import { useState } from 'react';
import { Search } from 'lucide-react';
import ProductForm from '../components/ProductForm.jsx';
import ProductTable from '../components/ProductTable.jsx';

export default function ProductsPage({ products, form, editing, onFormChange, onSave, onCancel, onEdit, onDelete }) {
  const [search, setSearch] = useState('');
  const visible = products.filter(p => `${p.name} ${p.sku}`.toLowerCase().includes(search.toLowerCase()));
  return <section className="panel"><div className="panelhead"><div><h2>{editing ? 'Edit product' : 'Your products'}</h2><p className="muted">Manage products and stock levels</p></div>
    <label className="search"><Search /><input placeholder="Search name or SKU" value={search} onChange={e => setSearch(e.target.value)} /></label></div>
    <ProductForm value={form} editing={editing} onChange={onFormChange} onSubmit={onSave} onCancel={onCancel} />
    <ProductTable products={visible} onEdit={onEdit} onDelete={onDelete} />
  </section>;
}
