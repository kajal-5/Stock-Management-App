import { Boxes, Package } from 'lucide-react';
import ProductTable from '../components/ProductTable.jsx';

export default function DashboardPage({ products, onEdit, onDelete, onViewProducts }) {
  const lowStock = products.filter(product => product.quantity <= product.threshold);
  const units = products.reduce((sum, product) => sum + product.quantity, 0);
  return <>
    <div className="cards">
      <article><span>Total products</span><b>{products.length}</b><Package /></article>
      <article><span>Units in stock</span><b>{units}</b><Boxes /></article>
      <article><span>Low stock items</span><b>{lowStock.length}</b><span className="warn">Needs attention</span></article>
    </div>
    <section className="panel"><div className="panelhead"><div><h2>Low stock</h2><p className="muted">Products at or below their threshold</p></div>
      <button className="secondary" onClick={onViewProducts}>View products</button></div>
      <ProductTable products={lowStock} onEdit={onEdit} onDelete={onDelete} />
    </section>
  </>;
}
