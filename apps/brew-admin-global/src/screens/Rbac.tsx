import { Page, Card } from '../components';
import { roles, permissions } from '../data';

export function Rbac() {
  return (
    <Page title="Roles & Permissions" kicker="least-privilege RBAC">
      <Card style={{ padding: 0, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--surface)' }}>
              <th style={{ padding: '10px 14px', textAlign: 'left' }}>Role</th>
              {permissions.map((p) => (
                <th key={p} className="mono" style={{ padding: '10px 8px', fontWeight: 500 }}>{p}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r.key} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 14px', fontWeight: 600 }}>{r.key}</td>
                {permissions.map((p) => (
                  <td key={p} style={{ padding: '10px 8px', textAlign: 'center' }}>
                    {r.allow.includes(p) ? (
                      <span style={{ color: 'var(--accent-alt)' }}>✓</span>
                    ) : (
                      <span style={{ color: 'var(--border)' }}>·</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p style={{ color: 'var(--text-muted)', marginTop: 16 }}>
        Permissions are scoped to the org hierarchy (a Store Manager sees one store; a Regional
        Manager sees a region) and enforced server-side on every endpoint.
      </p>
    </Page>
  );
}
