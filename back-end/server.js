const express = require('express');
const path = require('path');
const apiRoutes = require('./api/apiRoutes');
const db = require('./config/db');
const mqttConfig = require('./config/mqttConfig');
const cors = require('cors');

const app = express();
const port = process.env.PORT;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../front-end')));
app.use(cors());

// Routes
app.use('/api', apiRoutes);

// Serve front-end
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../front-end/pages/index.html'));
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Connect to the database
db.getConnection()
  .then(() => {
    console.log('Successfully connected to the database.');
  })
  .catch((err) => {
    console.error('Error connecting to the database:', err);
  });
