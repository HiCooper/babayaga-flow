import express from 'express';
import cors from 'cors';
import path from 'path';
import http from 'http';
import { MemoryStore } from './db/memory.store';
import { createRouter } from './routes';
import { wsHub } from './ws/hub';
import { seed } from './seed';

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// Init store and seed data
const store = new MemoryStore();
seed(store);

// API routes
app.use(createRouter(store));

// Serve React frontend (production build or fallback to docs/)
const webDist = path.resolve(__dirname, '../../web/dist');
const docsPath = path.resolve(__dirname, '../../docs');
const fs = require('fs');
if (fs.existsSync(webDist)) {
  app.use(express.static(webDist));
  app.get('*', (_req: any, res: any) => res.sendFile(path.join(webDist, 'index.html')));
} else {
  // Fallback: serve mockup HTML for development
  app.use(express.static(docsPath));
  app.get('/', (_req, res) => res.sendFile(path.join(docsPath, 'control-tower-mockup.html')));
  app.get('/lens', (_req, res) => res.sendFile(path.join(docsPath, 'product-lens-mockup.html')));
}

// WebSocket
wsHub.init(server);

const PORT = parseInt(process.env.PORT || '3001', 10);
server.listen(PORT, () => {
  console.log(`\n🔭 Control Tower  http://localhost:${PORT}/`);
  console.log(`🔮 Product Lens    http://localhost:${PORT}/lens`);
  console.log(`📡 API             http://localhost:${PORT}/api/projects`);
  console.log(`📡 WebSocket       ws://localhost:${PORT}/ws`);
  const activeAgents = Array.from(store['agents']?.values?.() || []);
  const activeIters = Array.from(store['iterations']?.values?.() || []);
  console.log(`   Projects: ${store.listProjects().length} | Agents: ${activeAgents.filter((a:any) => a.status === 'running' || a.status === 'blocked').length} | Iterations: ${activeIters.filter((i:any) => i.status === 'running' || i.status === 'blocked').length}\n`);
});
