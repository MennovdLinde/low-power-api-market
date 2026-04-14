import { useState } from 'react';

const BASE = 'https://your-app.herokuapp.com';

const ENDPOINTS = [
  {
    method: 'GET',
    path: '/v1/geo',
    description: 'Resolve an IP address to geographic location. Defaults to the caller\'s IP if omitted.',
    params: [{ name: 'ip', type: 'string', required: false, desc: 'IPv4 or IPv6 address to look up' }],
    example: `curl -H "X-API-Key: YOUR_KEY" \\\n  "${BASE}/v1/geo?ip=8.8.8.8"`,
    response: `{\n  "ip": "8.8.8.8",\n  "country": "United States",\n  "countryCode": "US",\n  "region": "Virginia",\n  "city": "Ashburn",\n  "lat": 39.03,\n  "lon": -77.47,\n  "timezone": "America/New_York",\n  "isp": "Google LLC"\n}`,
  },
  {
    method: 'GET',
    path: '/v1/currency',
    description: 'Convert an amount between any two currencies using ECB rates (updated hourly).',
    params: [
      { name: 'from',   type: 'string', required: false, desc: 'Source currency code (default: USD)' },
      { name: 'to',     type: 'string', required: true,  desc: 'Target currency code' },
      { name: 'amount', type: 'number', required: false, desc: 'Amount to convert (default: 1)' },
    ],
    example: `curl -H "X-API-Key: YOUR_KEY" \\\n  "${BASE}/v1/currency?from=USD&to=CHF&amount=100"`,
    response: `{\n  "from": "USD",\n  "to": "CHF",\n  "rate": 0.9012,\n  "amount": 100,\n  "converted": 90.12,\n  "date": "2026-04-14",\n  "source": "frankfurter.app (ECB)"\n}`,
  },
  {
    method: 'GET',
    path: '/v1/weather',
    description: 'Current weather for a coordinate. No API key required upstream — uses Open-Meteo (GDPR-compliant).',
    params: [
      { name: 'lat',  type: 'number', required: true,  desc: 'Latitude (-90 to 90)' },
      { name: 'lon',  type: 'number', required: true,  desc: 'Longitude (-180 to 180)' },
      { name: 'unit', type: 'string', required: false, desc: '"celsius" (default) or "fahrenheit"' },
    ],
    example: `curl -H "X-API-Key: YOUR_KEY" \\\n  "${BASE}/v1/weather?lat=47.56&lon=7.59"`,
    response: `{\n  "lat": 47.56,\n  "lon": 7.59,\n  "temperature": 18.2,\n  "feelsLike": 17.4,\n  "humidity": 62,\n  "windSpeed": 12.4,\n  "weatherCode": 2,\n  "description": "Partly cloudy",\n  "unit": "celsius"\n}`,
  },
  {
    method: 'GET',
    path: '/v1/email/validate',
    description: 'Validate an email address: syntax check, MX record lookup, and disposable domain detection. No external API dependency.',
    params: [{ name: 'email', type: 'string', required: true, desc: 'Email address to validate' }],
    example: `curl -H "X-API-Key: YOUR_KEY" \\\n  "${BASE}/v1/email/validate?email=user@example.com"`,
    response: `{\n  "email": "user@example.com",\n  "isValidSyntax": true,\n  "hasMx": true,\n  "isDisposable": false,\n  "domain": "example.com"\n}`,
  },
];

const ERRORS = [
  { code: '401', title: 'Unauthorized', desc: 'Missing or invalid X-API-Key header.' },
  { code: '402', title: 'Quota exceeded', desc: 'Monthly request quota exhausted. Upgrade to Pro or wait for reset.' },
  { code: '429', title: 'Rate limited', desc: 'Too many requests per minute. Check X-RateLimit-Reset header.' },
  { code: '400', title: 'Bad request', desc: 'Invalid query parameters. Check the parameter table for the endpoint.' },
  { code: '422', title: 'Unprocessable', desc: 'The upstream provider could not resolve the input (e.g. private IP for geo).' },
];

export function DocsPage() {
  const [copied, setCopied] = useState<string | null>(null);

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40, maxWidth: 860 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9' }}>API Reference</h1>
        <p style={{ color: '#64748b', marginTop: 4 }}>
          All endpoints require an <code style={codeInline}>X-API-Key</code> header.
          Base URL: <code style={codeInline}>{BASE}</code>
        </p>
      </div>

      {ENDPOINTS.map((ep) => (
        <div key={ep.path} style={{ background: '#1e293b', borderRadius: 12, padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <span style={{ background: '#0c4a6e', color: '#38bdf8', borderRadius: 4, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>
              {ep.method}
            </span>
            <code style={{ fontSize: 16, color: '#e2e8f0', fontWeight: 600 }}>{ep.path}</code>
          </div>
          <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 20 }}>{ep.description}</p>

          {/* Parameters */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 20 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                {['Parameter', 'Type', 'Required', 'Description'].map((h) => (
                  <th key={h} style={{ padding: '8px 10px', color: '#64748b', textAlign: 'left', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ep.params.map((p) => (
                <tr key={p.name} style={{ borderBottom: '1px solid #0f172a' }}>
                  <td style={{ padding: '10px', fontFamily: 'monospace', color: '#38bdf8' }}>{p.name}</td>
                  <td style={{ padding: '10px', color: '#94a3b8' }}>{p.type}</td>
                  <td style={{ padding: '10px', color: p.required ? '#fbbf24' : '#475569' }}>{p.required ? 'yes' : 'no'}</td>
                  <td style={{ padding: '10px', color: '#94a3b8' }}>{p.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Example */}
          <div style={{ position: 'relative' }}>
            <pre style={{ background: '#0f172a', borderRadius: 8, padding: 16, fontSize: 13, color: '#94a3b8', overflowX: 'auto' }}>
              {ep.example}
            </pre>
            <button
              onClick={() => copy(ep.example, ep.path + '-req')}
              style={{ position: 'absolute', top: 10, right: 10, ...smallBtn }}
            >
              {copied === ep.path + '-req' ? 'Copied!' : 'Copy'}
            </button>
          </div>

          {/* Response */}
          <div style={{ position: 'relative', marginTop: 12 }}>
            <pre style={{ background: '#0f172a', borderRadius: 8, padding: 16, fontSize: 13, color: '#34d399', overflowX: 'auto' }}>
              {ep.response}
            </pre>
            <button
              onClick={() => copy(ep.response, ep.path + '-res')}
              style={{ position: 'absolute', top: 10, right: 10, ...smallBtn }}
            >
              {copied === ep.path + '-res' ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      ))}

      {/* Error codes */}
      <div style={{ background: '#1e293b', borderRadius: 12, padding: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#cbd5e1', marginBottom: 20 }}>Error codes</h2>
        {ERRORS.map((e) => (
          <div key={e.code} style={{ display: 'flex', gap: 16, padding: '12px 0', borderBottom: '1px solid #0f172a', alignItems: 'flex-start' }}>
            <code style={{ color: '#f87171', fontWeight: 700, minWidth: 40 }}>{e.code}</code>
            <div>
              <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{e.title}</span>
              <span style={{ color: '#64748b', marginLeft: 12, fontSize: 14 }}>{e.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const codeInline: React.CSSProperties = {
  background: '#0f172a', color: '#38bdf8', borderRadius: 4, padding: '2px 6px', fontSize: 13,
};

const smallBtn: React.CSSProperties = {
  background: '#334155', color: '#94a3b8', border: 'none', borderRadius: 4,
  padding: '4px 10px', fontSize: 12, cursor: 'pointer',
};
