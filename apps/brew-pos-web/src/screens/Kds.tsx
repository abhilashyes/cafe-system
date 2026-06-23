import { useEffect, useMemo, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { KdsTicket, StationType } from '@brew/contracts';
import { api, API_BASE_URL, STORE_ID } from '../api';
import { demo, demoMode } from '../demo';

const STATIONS: StationType[] = ['BAR', 'HOT_KITCHEN', 'COLD', 'BAKERY'];

/** Elapsed-time SLA cue (left border): cyan < 5m, champagne < 8m, rose after. */
function slaBorder(createdAt: string): string {
  const mins = (Date.now() - new Date(createdAt).getTime()) / 60000;
  if (mins > 8) return 'var(--rose)';
  if (mins > 5) return 'var(--champagne)';
  return 'var(--accent-alt)';
}

/**
 * Wall-mounted Kitchen Display. Connects to the /kds WebSocket for live ticket
 * pushes (new orders + bumps), reconnects gracefully, and bumps items via REST.
 */
export function Kds() {
  const [tickets, setTickets] = useState<KdsTicket[]>([]);
  const [connected, setConnected] = useState(false);
  const [, forceTick] = useState(0);

  useEffect(() => {
    if (demoMode) {
      // No backend: subscribe to the in-memory demo store.
      setConnected(true);
      setTickets(demo.getTickets());
      return demo.subscribe(() => setTickets(demo.getTickets()));
    }
    const socket: Socket = io(`${API_BASE_URL}/kds`, {
      query: { storeId: STORE_ID },
      transports: ['websocket'],
    });
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('kds:tickets', (next: KdsTicket[]) => setTickets(next));
    return () => {
      socket.disconnect();
    };
  }, []);

  // Re-render every 15s so the SLA colours/elapsed time update.
  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 15000);
    return () => clearInterval(t);
  }, []);

  const byStation = useMemo(() => {
    const map: Record<string, KdsTicket[]> = {};
    for (const station of STATIONS) {
      map[station] = tickets
        .map((t) => ({ ...t, items: t.items.filter((i) => i.station === station) }))
        .filter((t) => t.items.length > 0);
    }
    return map;
  }, [tickets]);

  const bump = (itemId: string) =>
    demoMode ? demo.bump(itemId) : api.bumpItem(itemId).catch(() => undefined);

  return (
    <section style={{ padding: 16 }}>
      <h2>
        The Brew Lab — Kitchen Display{' '}
        <span style={{ fontSize: 14, color: connected ? 'var(--accent-alt)' : 'var(--rose)' }}>
          {connected ? '● live' : '● reconnecting…'}
        </span>
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${STATIONS.length}, 1fr)`, gap: 12 }}>
        {STATIONS.map((station) => (
          <div key={station}>
            <h3 style={{ borderBottom: '2px solid var(--border)', paddingBottom: 4, color: 'var(--accent)' }}>
              {station}
            </h3>
            {byStation[station].length === 0 && <p style={{ color: 'var(--text-muted)' }}>—</p>}
            {byStation[station].map((t) => (
              <div
                key={t.orderId}
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderLeft: `4px solid ${slaBorder(t.createdAt)}`,
                  padding: 10,
                  borderRadius: 8,
                  marginBottom: 10,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong style={{ color: 'var(--accent)' }}>#{t.pickupCode}</strong>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {t.fulfilment === 'DINE_IN' ? `Dine-in T${t.tableNumber ?? '?'}` : 'Takeaway'}
                  </span>
                </div>
                {t.items.map((i) => (
                  <div key={i.itemId} style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span
                      style={{
                        textDecoration: i.status === 'READY' ? 'line-through' : 'none',
                        color: i.status === 'READY' ? 'var(--text-muted)' : 'var(--text)',
                      }}
                    >
                      {i.quantity}× {i.name}
                    </span>
                    {i.status === 'PENDING' && (
                      <button className="btn-tonal" onClick={() => bump(i.itemId)}>Bump</button>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
