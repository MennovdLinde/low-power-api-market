import { MetricCard } from '../components/MetricCard';

const PLAN = 'free';
const USAGE = 34150;
const QUOTA = 1_000_000;

export function BillingPage() {
  const pct = (USAGE / QUOTA) * 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9' }}>Billing</h1>
        <p style={{ color: '#64748b', marginTop: 4 }}>Manage your plan and invoices</p>
      </div>

      {/* Current plan */}
      <div style={{ background: '#1e293b', borderRadius: 12, padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ background: '#0c4a6e', color: '#38bdf8', borderRadius: 4, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>
              {PLAN.toUpperCase()} PLAN
            </span>
            <h2 style={{ marginTop: 12, fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>
              {PLAN === 'free' ? 'Free' : '$0.001 per 1,000 requests'}
            </h2>
            <p style={{ color: '#64748b', marginTop: 4, fontSize: 14 }}>
              {PLAN === 'free' ? '1,000,000 requests / month included' : '100,000,000 requests / month'}
            </p>
          </div>
          {PLAN === 'free' && (
            <button style={{
              background: '#38bdf8', color: '#0f172a', border: 'none',
              borderRadius: 8, padding: '12px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}>
              Upgrade to Pro →
            </button>
          )}
        </div>

        {/* Quota bar */}
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, color: '#64748b' }}>
            <span>{USAGE.toLocaleString()} used</span>
            <span>{QUOTA.toLocaleString()} limit</span>
          </div>
          <div style={{ height: 8, background: '#334155', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: pct > 90 ? '#ef4444' : '#38bdf8', borderRadius: 4 }} />
          </div>
          <p style={{ marginTop: 6, fontSize: 12, color: '#475569' }}>{pct.toFixed(2)}% of monthly quota used</p>
        </div>
      </div>

      {/* Pro plan comparison */}
      <div style={{ background: '#1e293b', borderRadius: 12, padding: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#cbd5e1', marginBottom: 20 }}>Plan comparison</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155' }}>
              <th style={{ padding: '10px 12px', color: '#64748b', textAlign: 'left', fontWeight: 500 }}>Feature</th>
              <th style={{ padding: '10px 12px', color: '#38bdf8', textAlign: 'center', fontWeight: 600 }}>Free</th>
              <th style={{ padding: '10px 12px', color: '#34d399', textAlign: 'center', fontWeight: 600 }}>Pro</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Monthly requests',  '1,000,000',  '100,000,000'],
              ['Rate limit',        '60 req/min', '600 req/min'],
              ['Endpoints',         'All 4',      'All 4'],
              ['Price',             '$0',         '$0.001 / 1k req'],
              ['Support',           'Community',  'Priority'],
            ].map(([feature, free, pro]) => (
              <tr key={feature} style={{ borderBottom: '1px solid #0f172a' }}>
                <td style={{ padding: '12px', color: '#94a3b8' }}>{feature}</td>
                <td style={{ padding: '12px', color: '#64748b', textAlign: 'center' }}>{free}</td>
                <td style={{ padding: '12px', color: '#e2e8f0', textAlign: 'center', fontWeight: 500 }}>{pro}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invoice history (mock) */}
      <div style={{ background: '#1e293b', borderRadius: 12, padding: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#cbd5e1', marginBottom: 16 }}>Invoice history</h2>
        <p style={{ color: '#475569', fontSize: 14 }}>No invoices yet — you're on the free plan.</p>
      </div>
    </div>
  );
}
