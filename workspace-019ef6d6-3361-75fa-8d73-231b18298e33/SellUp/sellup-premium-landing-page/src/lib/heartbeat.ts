import { useEffect } from 'react';

const SESSION_KEY = 'sellup_session_id';

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = (crypto as any).randomUUID ? crypto.randomUUID() : `s-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function useHeartbeat(shop_slug: string | undefined, page: string = 'shop') {
  useEffect(() => {
    if (!shop_slug) return;
    const session_id = getSessionId();
    const ping = () => {
      fetch('/api/public/heartbeat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ shop_slug, session_id, page }),
        keepalive: true,
      }).catch(() => {});
    };
    ping();
    const i = setInterval(ping, 15000);
    return () => clearInterval(i);
  }, [shop_slug, page]);
}
