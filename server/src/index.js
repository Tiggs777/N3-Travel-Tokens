const express = require('express');
const cors = require('cors');
const routes = require('./routes/index');
require('dotenv').config();

const app = express();

app.use(cors({ origin: 'http://localhost:3001' }));
app.use(express.json());

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.path}`);
  next();
});

console.log('Loading API routes from ./routes/index.js');
console.log('Router routes before use:', routes.stack.map(r => `${r.route.path} (${Object.keys(r.route.methods).join(',')})`));

// Explicitly apply the router
app.use('/api', routes);

// Debug full router stack after mounting
console.log('Full router stack after mounting:', app._router.stack.map(layer => {
  if (layer.route) {
    return `${layer.route.path} (${Object.keys(layer.route.methods).join(',')})`;
  } else if (layer.name === 'router') {
    return `Router at ${layer.regexp} with routes: ${layer.handle.stack.map(r => r.route ? `${r.route.path} (${Object.keys(r.route.methods).join(',')})` : 'sub-router').join(', ')}`;
  }
  return layer.name;
}));

// Root route
app.get('/', (req, res) => res.send('Welcome to the Travel Token DApp Server'));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('API routes initialized');
  console.log('Final registered routes:', app._router.stack
    .filter(r => r.route)
    .map(r => `${r.route.path} (${Object.keys(r.route.methods).join(',')})`));
});