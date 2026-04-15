import { Outlet, NavLink } from 'react-router-dom';

const s: Record<string, React.CSSProperties> = {
  shell: { display: 'flex', minHeight: '100vh' },
  sidebar: {
    width: 220,
    background: 'var(--sidebar-bg)',
    backdropFilter: 'var(--glass-blur)',
    WebkitBackdropFilter: 'var(--glass-blur)',
    borderRight: '1px solid var(--sidebar-border)',
    padding: '32px 0',
    display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0,
    position: 'sticky', top: 0, height: '100vh',
  },
  brand: {
    padding: '0 24px 24px',
    fontSize: 15, fontWeight: 700,
    color: 'var(--accent)',
    letterSpacing: '-0.3px',
    borderBottom: '1px solid var(--sidebar-border)',
    marginBottom: 8,
  },
  nav: { display: 'flex', flexDirection: 'column', gap: 2, padding: '8px 0' },
  main: { flex: 1, padding: 40, overflowY: 'auto' as const, color: 'var(--text)' },
};

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/keys',      label: 'API Keys' },
  { to: '/billing',   label: 'Billing' },
  { to: '/docs',      label: 'Docs' },
];

export function Layout() {
  return (
    <div style={s.shell}>
      <aside style={s.sidebar}>
        <div style={s.brand}>⚡ Low-Power API</div>
        <nav style={s.nav}>
          {links.map(({ to, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              padding: '10px 24px',
              fontSize: 13,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--text)' : 'var(--muted)',
              textDecoration: 'none',
              borderRadius: 8,
              margin: '0 8px',
              transition: 'background 0.15s, color 0.15s',
              background: isActive ? 'var(--glass-bg)' : 'transparent',
              borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
            })}>
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
