require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const sequelize = require('./config/database');
const { initializeMailer } = require('./utils/email');

require('./models/associations');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const attachmentRoutes = require('./routes/attachments');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/attachments', express.static(path.join(__dirname, '../attachments')));

app.use(express.static(path.join(__dirname, '../../client/dist')));

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:projectId/posts', postRoutes);
app.use('/api/projects/:projectId/posts/:postId/comments', commentRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Public branding config endpoint
app.get('/api/branding-config', async (req, res) => {
  try {
    const { BrandingConfig } = require('./models/associations');
    let brandingConfig = await BrandingConfig.findByPk(1);
    
    if (!brandingConfig) {
      brandingConfig = {
        id: 1,
        app_name: 'TigerBug',
        logo_url: null,
        tagline: null,
        social_links: null,
        client_url: null,
      };
    }

    res.json({ brandingConfig });
  } catch (error) {
    console.error('Error fetching public branding config:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use((err, req, res, next) => {
  console.error('Error:', err);

  res.status(500).json({
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});

async function startServer() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    console.log('Synchronizing database models...');
    await sequelize.sync();
    console.log('Database models synchronized.');

    console.log('Initializing email service...');
    await initializeMailer();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  console.log('\nShutting down server...');
  try {
    await sequelize.close();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

startServer();

module.exports = app;
