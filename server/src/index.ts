import express from 'express';
import cors from 'cors';
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

// Routes
app.use(createRouter(store));

// WebSocket
wsHub.init(server);

const PORT = parseInt(process.env.PORT || '3001', 10);
server.listen(PORT, () => {
  console.log(`\n🔭 Control Tower API running on http://localhost:${PORT}`);
  console.log(`   WebSocket: ws://localhost:${PORT}/ws`);
  console.log(`   Projects: ${store.listProjects().length}`);
  console.log(`   Agents: ${store.listAgents('tracker-system').length + store.listAgents('payment-gateway').length + store.listAgents('user-mobile').length + store.listAgents('data-pipeline').length}`);
  console.log(`   Active iterations: ${store.getActiveIterations('tracker-system').length + store.getActiveIterations('payment-gateway').length + store.getActiveIterations('user-mobile').length + store.getActiveIterations('data-pipeline').length}`);
  console.log(`   Connected WS clients: ${wsHub.getConnectedCount()}\n`);
});
