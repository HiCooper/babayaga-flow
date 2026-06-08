const BASE = '/api';
async function request<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, { headers: { 'Content-Type': 'application/json' }, ...opts });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}
export const api = {
  getStats: () => request<import('../types').Stats>('/stats'),
  getProjects: () => request<import('../types').Project[]>('/projects'),
  getProject: (id: string) => request<import('../types').ProjectDetail>(`/projects/${id}`),
  getIterations: (id: string) => request<import('../types').Iteration[]>(`/projects/${id}/iterations/active`),
  resolveDecision: (id: string, chosen: string) => request(`/decisions/${id}/resolve`, { method: 'POST', body: JSON.stringify({ chosen }) }),
  getTechDebts: () => request<import('../types').TechDebt[]>('/tech-debts'),
  getCrossDeps: () => request<import('../types').CrossDep[]>('/cross-deps'),
  getStandards: () => request<import('../types').OrgStandard[]>('/standards'),
};

export function useWebSocket(onMessage: (msg: any) => void) {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  let ws: WebSocket;
  function connect() {
    ws = new WebSocket(`${proto}//${location.host}/ws`);
    ws.onmessage = (e) => { try { onMessage(JSON.parse(e.data)); } catch {} };
    ws.onclose = () => setTimeout(connect, 5000);
    ws.onopen = () => {
      // subscribe to all projects (we'll do this after projects load)
    };
  }
  connect();
  return {
    subscribe: (projectId: string) => ws?.send(JSON.stringify({ type: 'subscribe', projectId })),
    close: () => ws?.close(),
  };
}
