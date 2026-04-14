import { Outlet, NavLink } from 'react-router-dom';

const s: Record<string, React.CSSProperties> = {
  shell: { display: 'flex', minHeight: '100vh' },
  sidebar: {
    width: 220, background: '#1e293b', padding: '32px 0',
    display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0,
  },
  brand: {
    padding: '0 24px 24px', fontSize: 15, fontWeight: 700,
    color: '#38bdf8', letterSpacing: '-0.3px',
  },
  nav: { display: 'flex', flexDirection: 'column', gap: 2 },
  link: {
    padding: '10px 24px', fontSize: 14, color: '#94a3b8',
    textDecoration: 'none', borderRadius: 6, margin: '0 8px',
    transition: 'background 0.15s, color 0.15s',
  },
  activeLink: { background: '#0f172a', color: '#e2e8f0' },
  main: { flex: 1, padding: 40, overflowY: 'auto' as const },
};

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/keys', label: 'API Keys' },
  { to: '/billing', label: 'Billing' },
  { to: '/docs', label: 'Docs' },
];

export function Layout() {
  return (
    <div style={s.shell}>
      <aside style={s.sidebar}>
        <div style={s.brand}>⚡ Low-Power API</div>
        <nav style={s.nav}>
          {links.map(({ to, label }) => (
            <NavLink
              key={to} to={to}
              style={({ isActive }) => ({ ...s.link, ...(isActive ? s.activeLink : {}) })}
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main style={s.main}>
        <Outlet />
      </main>
    </div>
  );
}
