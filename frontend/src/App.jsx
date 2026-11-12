import { useEffect, useState } from 'react';
import { api } from './lib/api.js';
import Sidebar from './components/Sidebar.jsx';
import AuthPage from './pages/AuthPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

const emptyProduct = { name: '', sku: '', description: '', quantity: '0', cost: '', price: '', threshold: '' };

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyProduct);
  const [editing, setEditing] = useState(null);
  const [threshold, setThreshold] = useState(5);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function loadProducts() { setProducts(await api('/products')); }
  useEffect(() => { api('/me').then(async result => { setUser(result.user); await loadProducts(); }).catch(() => {}); }, []);

  async function login(mode, credentials) {
    try { setError(''); const result = await api(`/${mode}`, { method: 'POST', body: JSON.stringify(credentials) });
      setUser(result.user); await loadProducts();
    } catch (e) { setError(e.message); }
  }
  async function logout() { await api('/logout', { method: 'POST' }); setUser(null); }
  async function saveProduct(event) {
    event.preventDefault();
    try { setError(''); await api(`/products${editing ? `/${editing}` : ''}`, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(form) });
      setForm(emptyProduct); setEditing(null); await loadProducts(); setNotice('Product saved.');
    } catch (e) { setError(e.message); }
  }
  function editProduct(product) { setForm({ ...product, threshold: product.threshold ?? '' }); setEditing(product.id); setPage('products'); window.scrollTo(0, 0); }
  async function deleteProduct(id) { if (confirm('Delete this product?')) { await api(`/products/${id}`, { method: 'DELETE' }); await loadProducts(); } }
  async function openSettings() { setPage('settings'); try { const settings = await api('/settings'); setThreshold(settings.default_threshold); } catch (e) { setError(e.message); } }
  async function saveSettings(event) {
    event.preventDefault();
    try { await api('/settings', { method: 'PUT', body: JSON.stringify({ default_threshold: threshold }) }); await loadProducts(); setNotice('Settings saved.'); }
    catch (e) { setError(e.message); }
  }
  function cancelEdit() { setEditing(null); setForm(emptyProduct); }

  if (!user) return <AuthPage onLogin={login} error={error} />;
  const title = page[0].toUpperCase() + page.slice(1);
  return <div className="layout">
    <Sidebar user={user} page={page} onNavigate={setPage} onLogout={logout} />
    <main className="content"><header><div><small>INVENTORY</small><h1>{title}</h1></div><span className="today">{new Date().toLocaleDateString()}</span></header>
      {error && <p className="error">{error}</p>}{notice && <p className="success">{notice}</p>}
      {page === 'dashboard' && <DashboardPage products={products} onEdit={editProduct} onDelete={deleteProduct} onViewProducts={() => setPage('products')} />}
      {page === 'products' && <ProductsPage products={products} form={form} editing={editing} onFormChange={setForm} onSave={saveProduct} onCancel={cancelEdit} onEdit={editProduct} onDelete={deleteProduct} />}
      {page === 'settings' && <SettingsPage threshold={threshold} onChange={setThreshold} onSave={saveSettings} />}
    </main>
  </div>;
}
