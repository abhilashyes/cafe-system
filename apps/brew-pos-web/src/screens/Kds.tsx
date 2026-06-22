import { useEffect, useMemo, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { KdsTicket, StationType } from '@brew/contracts';
import { api, API_BASE_URL, STORE_ID } from '../api';

const STATIONS: StationType[] = ['BAR', 'HOT_KITCHEN', 'COLD', 'BAKERY'];

/** Elapsed-time SLA colour cue: green < 5m, amber < 8m, red after. */
function slaColor(createdAt: string): string {
  const mins = (Date.now() - new Date(createdAt).getTime()) / 60000;
  if (mins > 8) return '#fdecea';
  if (mins > 5) return '#fff4e5';
  return '#f0f7f2';
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

  const bump = (itemId: string) => api.bumpItem(itemId).catch(() => undefined);

  return (
    <section style={{ padding: 16, fontFamily: 'system-ui' }}>
      <h2>
        Kitchen Display — {STORE_ID}{' '}
        <span style={{ fontSize: 14, color: connected ? 'green' : 'crimson' }}>
          {connected ? '● live' : '● reconnecting…'}
        </span>
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${STATIONS.length}, 1fr)`, gap: 12 }}>
        {STATIONS.map((station) => (
          <div key={station}>
            <h3 style={{ borderBottom: '2px solid #ddd' }}>{station}</h3>
            {byStation[station].length === 0 && <p style={{ color: '#aaa' }}>—</p>}
            {byStation[station].map((t) => (
              <div
                key={t.orderId}
                style={{ background: slaColor(t.createdAt), padding: 10, borderRadius: 6, marginBottom: 10 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>#{t.pickupCode}</strong>
                  <span>{t.fulfilment === 'DINE_IN' ? `Dine-in T${t.tableNumber ?? '?'}` : 'Takeaway'}</span>
                </div>
                {t.items.map((i) => (
                  <div key={i.itemId} style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ textDecoration: i.status === 'READY' ? 'line-through' : 'none' }}>
                      {i.quantity}× {i.name}
                    </span>
                    {i.status === 'PENDING' && (
                      <button onClick={() => bump(i.itemId)}>Bump</button>
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
