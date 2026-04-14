import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MetricCard } from '../components/MetricCard';

// Mock data — replace with real API calls once gateway is deployed
const DAILY: Array<{ day: string; geo: number; currency: number; weather: number; email: number }> = [
  { day: 'Apr 8',  geo: 1200, currency: 850,  weather: 340,  email: 210 },
  { day: 'Apr 9',  geo: 1850, currency: 1100, weather: 510,  email: 380 },
  { day: 'Apr 10', geo: 2100, currency: 1400, weather: 620,  email: 490 },
  { day: 'Apr 11', geo: 1780, currency: 980,  weather: 430,  email: 320 },
  { day: 'Apr 12', geo: 2400, currency: 1650, weather: 780,  email: 610 },
  { day: 'Apr 13', geo: 2900, currency: 2100, weather: 920,  email: 740 },
  { day: 'Apr 14', geo: 3200, currency: 2300, weather: 1100, email: 890 },
];

const TOTAL_CALLS = DAILY.reduce((s, d) => s + d.geo + d.currency + d.weather + d.email, 0);
const QUOTA = 1_000_000;

const ENDPOINT_COLORS = { geo: '#38bdf8', currency: '#34d399', weather: '#fbbf24', email: '#f472b6' };

export function DashboardPage() {
  const cacheHitRate = 78; // mock
  const avgLatency = 19;   // mock ms

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9' }}>Dashboard</h1>
        <p style={{ color: '#64748b', marginTop: 4 }}>April 2026 · Free plan</p>
      </div>

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <MetricCard
          label="Calls this month"
          value={TOTAL_CALLS.toLocaleString()}
          sub={`of ${(QUOTA / 1_000_000).toFixed(0)}M free quota`}
        />
        <MetricCard
          label="Remaining quota"
          value={`${(((QUOTA - TOTAL_CALLS) / QUOTA) * 100).toFixed(1)}%`}
          sub={`${(QUOTA - TOTAL_CALLS).toLocaleString()} requests left`}
          accent="#34d399"
        />
        <MetricCard
          label="Cache hit rate"
          value={`${cacheHitRate}%`}
          sub="requests served from cache"
          accent="#fbbf24"
        />
        <MetricCard
          label="Avg latency p95"
          value={`${avgLatency}ms`}
          sub="well under 100ms target"
          accent="#a78bfa"
        />
      </div>

      {/* Usage chart */}
      <div style={{ background: '#1e293b', borderRadius: 12, padding: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: '#cbd5e1' }}>
          Daily API calls — last 7 days
        </h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={DAILY} barSize={14}>
            <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 12 }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
            <Tooltip
              contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }}
              labelStyle={{ color: '#cbd5e1' }}
            />
            <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 13 }} />
            {(['geo', 'currency', 'weather', 'email'] as const).map((ep) => (
              <Bar key={ep} dataKey={ep} stackId="a" fill={ENDPOINT_COLORS[ep]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Endpoint breakdown table */}
      <div style={{ background: '#1e293b', borderRadius: 12, padding: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: '#cbd5e1' }}>
          Endpoint breakdown
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155' }}>
              {['Endpoint', 'Calls', 'Avg latency', 'Cache hit rate', 'Status'].map((h) => (
                <th key={h} style={{ padding: '8px 12px', color: '#64748b', textAlign: 'left', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { endpoint: 'geo',      calls: 15430, latency: 19, cache: 81, ok: true },
              { endpoint: 'currency', calls: 10380, latency: 12, cache: 94, ok: true },
              { endpoint: 'weather',  calls: 4700,  latency: 38, cache: 71, ok: true },
              { endpoint: 'email',    calls: 3640,  latency: 22, cache: 68, ok: true },
            ].map((row) => (
              <tr key={row.endpoint} style={{ borderBottom: '1px solid #1e293b' }}>
                <td style={{ padding: '12px', color: '#e2e8f0', fontFamily: 'monospace' }}>/v1/{row.endpoint}</td>
                <td style={{ padding: '12px', color: '#94a3b8' }}>{row.calls.toLocaleString()}</td>
                <td style={{ padding: '12px', color: '#94a3b8' }}>{row.latency}ms</td>
                <td style={{ padding: '12px', color: '#94a3b8' }}>{row.cache}%</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ background: '#064e3b', color: '#34d399', borderRadius: 4, padding: '2px 8px', fontSize: 12 }}>
                    ● operational
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
