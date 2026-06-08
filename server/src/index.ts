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

// Serve static frontend from docs/
const docsPath = path.resolve(__dirname, '../../docs');
app.use(express.static(docsPath));

// Root → control tower
app.get('/', (_req, res) => {
  res.sendFile(path.join(docsPath, 'control-tower-mockup.html'));
});

// Product lens
app.get('/lens', (_req, res) => {
  res.sendFile(path.join(docsPath, 'product-lens-mockup.html'));
});

// WebSocket
wsHub.init(server);

const PORT = parseInt(process.env.PORT || '3001', 10);
server.listen(PORT, () => {
  console.log(`\n🔭 Control Tower  http://localhost:${PORT}/`);
  console.log(`🔮 Product Lens    http://localhost:${PORT}/lens`);
  console.log(`📡 API             http://localhost:${PORT}/api/projects`);
  console.log(`📡 WebSocket       ws://localhost:${PORT}/ws`);
  console.log(`   Projects: ${store.listProjects().length} | Agents: 8 | Iterations: 11\n`);
});
