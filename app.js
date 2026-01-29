const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');

// Load Config & Services
const appConfig = require('./config/app');
const Scheduler = require('./src/services/Scheduler');

// Load Routes
const webRoutes = require('./src/routes/web');
const apiRoutes = require('./src/routes/api');

const app = express();
const server = http.createServer(app);

// --- 1. MIDDLEWARE ---
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// Folder Public untuk CSS/JS/Gambar
app.use(express.static(path.join(__dirname, 'public')));

// --- 2. VIEW ENGINE ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// --- 3. ROUTING ---
app.use('/', webRoutes);      // Semua halaman HTML
app.use('/api', apiRoutes);   // Semua API JSON

// --- 4. START SERVICES ---
// Menjalankan scheduler di background (Auto-WDP & Notif)
Scheduler.start(); 

// --- 5. START SERVER ---
const PORT = appConfig.server.port || 3000;
server.listen(PORT, () => {
    console.clear(); 
    console.log("========================================");
    console.log(`   🚀 STACKY SYSTEM (REFACTORED)       `);
    console.log("========================================");
    console.log(`✅ Server Run  : http://localhost:${PORT}`);
    console.log(`📂 Database    : Multi-JSON Files`);
    console.log(`⏳ Services    : Scheduler & Auto-Notif ON`);
    console.log("========================================");
});