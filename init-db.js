#!/usr/bin/env node
// scripts/init-db.js
// Run: node scripts/init-db.js
// Initializes DB schema and seeds data

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function init() {
  console.log('🗄  Connecting to database...');
  const client = await pool.connect();
  try {
    console.log('📋 Running schema...');
    const schema = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8');
    await client.query(schema);

    console.log('🌱 Running seed data...');
    const seed = fs.readFileSync(path.join(__dirname, '../db/seed.sql'), 'utf8');

    // Generate proper bcrypt hash for seed password "password"
    const hash = await bcrypt.hash('password', 10);
    const seedWithHash = seed.replace(/\$2a\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC\/.og\/at2.uheWG\/igi/g, hash);
    await client.query(seedWithHash);

    console.log('✅ Database initialized successfully!');
    console.log('');
    console.log('Demo accounts:');
    console.log('  admin    / password (Administrator)');
    console.log('  jsmith   / password (Manager)');
    console.log('  mjohnson / password (Analyst)');
    console.log('  lwilliams/ password (Viewer)');
  } catch(e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

init();
