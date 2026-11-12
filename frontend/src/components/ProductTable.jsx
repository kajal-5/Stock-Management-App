import { Pencil, Trash2 } from 'lucide-react';

export default function ProductTable({ products, onEdit, onDelete }) {
  return <div className="tablewrap"><table>
    <thead><tr><th>PRODUCT</th><th>SKU</th><th>QUANTITY</th><th>STATUS</th><th>PRICE</th><th>ACTIONS</th></tr></thead>
    <tbody>{products.map(product => <tr key={product.id}>
      <td><b>{product.name}</b>{product.description && <small className="desc">{product.description}</small>}</td>
      <td>{product.sku}</td><td>{product.quantity}</td>
      <td><span className={`badge ${product.quantity <= product.threshold ? 'red' : 'green'}`}>
        {product.quantity <= product.threshold ? 'Low stock' : 'In stock'}
      </span></td>
      <td>{product.price == null ? '—' : `$${Number(product.price).toFixed(2)}`}</td>
      <td><button className="iconbtn" onClick={() => onEdit(product)} title="Edit"><Pencil /></button>
        <button className="iconbtn" onClick={() => onDelete(product.id)} title="Delete"><Trash2 /></button></td>
    </tr>)}</tbody>
  </table>{products.length === 0 && <div className="empty">No products yet.</div>}</div>;
}
