import { LayoutDashboard, Package, Settings, LogOut } from 'lucide-react';
import Brand from './Brand.jsx';

export default function Sidebar({ user, page, onNavigate, onLogout }) {
  const links = [
    ['dashboard', 'Dashboard', LayoutDashboard],
    ['products', 'Products', Package],
    ['settings', 'Settings', Settings],
  ];
  return <aside>
    <Brand />
    <nav className="nav">{links.map(([id, label, Icon]) =>
      <button key={id} className={page === id ? 'active' : ''} onClick={() => onNavigate(id)}>
        <Icon />{label}
      </button>
    )}</nav>
    <div className="profile">
      <div className="avatar">{user.name[0].toUpperCase()}</div>
      <span><b>{user.name}</b><small>{user.organization}</small></span>
      <button className="logout" onClick={onLogout} title="Log out"><LogOut /></button>
    </div>
  </aside>;
}
