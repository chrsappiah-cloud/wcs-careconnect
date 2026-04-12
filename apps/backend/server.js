const jsonServer = require('json-server');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const PORT = 3001;

// Seed fresh data on every start
require('./seed');

const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, 'db.json'));
const middlewares = jsonServer.defaults();

// Allow all origins for dev
server.use(cors());
server.use(middlewares);
server.use(jsonServer.bodyParser);

// Normalize query params and strip /api prefix
server.use((req, _res, next) => {
  // Strip /api prefix so json-server can match routes
  if (req.path.startsWith('/api/')) {
    req.url = req.url.replace('/api/', '/');
  }
  // residentId → resident_id (mobile app sends camelCase)
  if (req.query.residentId) {
    req.query.resident_id = req.query.residentId;
    delete req.query.residentId;
  }
  // status=all means "return everything" — remove the filter
  if (req.query.status === 'all') {
    delete req.query.status;
  }
  next();
});

server.use(router);

server.listen(PORT, () => {
  console.log(`\n  🏥 CareConnect API Server running at http://localhost:${PORT}`);
  console.log(`  📋 Endpoints:`);
  console.log(`     GET    /api/residents`);
  console.log(`     GET    /api/residents/:id`);
  console.log(`     GET    /api/alerts?status=open`);
  console.log(`     PATCH  /api/alerts/:id`);
  console.log(`     GET    /api/tasks?status=all`);
  console.log(`     PATCH  /api/tasks/:id`);
  console.log(`     POST   /api/tasks`);
  console.log(`     GET    /api/messages`);
  console.log(`     POST   /api/messages`);
  console.log(`     GET    /api/readings?residentId=:id`);
  console.log(`     POST   /api/readings\n`);
});
