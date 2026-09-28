require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const messRoutes = require('./routes/messRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const confirmRoutes = require('./routes/confirmRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/messes', messRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/confirm', confirmRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'QuickMess',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Production: Serve static assets built by Vite
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  // Catch-all SPA handler compatible with Express 4 and Express 5
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(clientDistPath, 'index.html'));
    }
    next();
  });
}

// Start Server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 QuickMess Server running on http://localhost:${PORT}`);
  console.log(`📡 API Endpoints available at http://localhost:${PORT}/api`);
  console.log(`===============================================`);
});
