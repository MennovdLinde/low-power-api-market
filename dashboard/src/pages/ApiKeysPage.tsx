import { useState } from 'react';

interface ApiKey {
  id: string;
  prefix: string;
  name: string;
  isActive: boolean;
  lastUsed: string | null;
  createdAt: string;
}

const MOCK_KEYS: ApiKey[] = [
  { id: '1', prefix: 'lpa_live_a1b2', name: 'production', isActive: true, lastUsed: '2026-04-14T09:32:00Z', createdAt: '2026-04-01T00:00:00Z' },
  { id: '2', prefix: 'lpa_live_c3d4', name: 'staging',    isActive: true, lastUsed: '2026-04-13T14:11:00Z', createdAt: '2026-04-05T00:00:00Z' },
];

export function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>(MOCK_KEYS);
  const [newKeyName, setNewKeyName] = useState('');
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  function handleCreate() {
    if (!newKeyName.trim()) return;
    const fakeKey = 'lpa_live_' + Math.random().toString(36).slice(2, 18);
    setRevealedKey(fakeKey);
    setKeys((prev) => [...prev, {
      id: Date.now().toString(),
      prefix: fakeKey.slice(0, 16),
      name: newKeyName.trim(),
      isActive: true,
      lastUsed: null,
      createdAt: new Date().toISOString(),
    }]);
    setNewKeyName('');
    setCreating(false);
  }

  function handleRevoke(id: string) {
    setKeys((prev) => prev.map((k) => k.id === id ? { ...k, isActive: false } : k));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9' }}>API Keys</h1>
          <p style={{ color: '#64748b', marginTop: 4 }}>Manage keys for accessing the gateway</p>
        </div>
        <button onClick={() => setCreating(true)} style={btnStyle('#38bdf8', '#0f172a')}>
          + New Key
        </button>
      </div>

      {/* Revealed key banner */}
      {revealedKey && (
        <div style={{ background: '#064e3b', border: '1px solid #059669', borderRadius: 10, padding: 20 }}>
          <p style={{ color: '#34d399', fontWeight: 600, marginBottom: 8 }}>
            Your new API key — save it now, it won't be shown again
          </p>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <code style={{ fontSize: 14, color: '#e2e8f0', background: '#0f172a', padding: '8px 14px', borderRadius: 6, flex: 1 }}>
              {revealedKey}
            </code>
            <button onClick={() => { navigator.clipboard.writeText(revealedKey); }} style={btnStyle('#059669', '#fff')}>
              Copy
            </button>
            <button onClick={() => setRevealedKey(null)} style={btnStyle('#374151', '#94a3b8')}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Create form */}
      {creating && (
        <div style={{ background: '#1e293b', borderRadius: 10, padding: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
          <input
            autoFocus
            placeholder="Key name (e.g. production)"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            style={{ flex: 1, padding: '10px 14px', borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0', fontSize: 14 }}
          />
          <button onClick={handleCreate} style={btnStyle('#38bdf8', '#0f172a')}>Create</button>
          <button onClick={() => setCreating(false)} style={btnStyle('#334155', '#94a3b8')}>Cancel</button>
        </div>
      )}

      {/* Keys table */}
      <div style={{ background: '#1e293b', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155' }}>
              {['Name', 'Key', 'Created', 'Last used', 'Status', ''].map((h) => (
                <th key={h} style={{ padding: '14px 16px', color: '#64748b', textAlign: 'left', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {keys.map((key) => (
              <tr key={key.id} style={{ borderBottom: '1px solid #0f172a' }}>
                <td style={{ padding: '14px 16px', color: '#e2e8f0' }}>{key.name}</td>
                <td style={{ padding: '14px 16px' }}>
                  <code style={{ color: '#94a3b8', fontSize: 13 }}>{key.prefix}••••••••</code>
                </td>
                <td style={{ padding: '14px 16px', color: '#64748b' }}>{key.createdAt.slice(0, 10)}</td>
                <td style={{ padding: '14px 16px', color: '#64748b' }}>
                  {key.lastUsed ? key.lastUsed.slice(0, 10) : '—'}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{
                    background: key.isActive ? '#064e3b' : '#1c1917',
                    color: key.isActive ? '#34d399' : '#78716c',
                    borderRadius: 4, padding: '2px 8px', fontSize: 12,
                  }}>
                    {key.isActive ? '● active' : '○ revoked'}
                  </span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  {key.isActive && (
                    <button onClick={() => handleRevoke(key.id)} style={btnStyle('#7f1d1d', '#fca5a5', 12)}>
                      Revoke
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function btnStyle(bg: string, color: string, fontSize = 14): React.CSSProperties {
  return { background: bg, color, border: 'none', borderRadius: 6, padding: '8px 16px', fontSize, cursor: 'pointer', fontWeight: 600 };
}
