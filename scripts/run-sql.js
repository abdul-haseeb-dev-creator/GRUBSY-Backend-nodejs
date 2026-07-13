// scripts/run-sql.js
// Usage:
//   DATABASE_URL="mysql://..." node scripts/run-sql.js scripts/sql/001_create_chat_messages.sql
//
import fs from 'node:fs';
import mysql from 'mysql2/promise';

const sqlFile = process.argv[2];
if (!sqlFile) {
  console.error('Usage: DATABASE_URL="mysql://..." node scripts/run-sql.js <sql-file>');
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('Missing DATABASE_URL env var');
  process.exit(1);
}

const sql = fs.readFileSync(sqlFile, 'utf8');
if (!sql.trim()) {
  console.error('SQL file is empty');
  process.exit(1);
}

const connection = await mysql.createConnection(databaseUrl);
try {
  // mysql2 supports multiple statements if enabled; easiest is to run raw SQL as-is.
  await connection.query({ sql, multipleStatements: true });
  console.log(`✅ Executed SQL file: ${sqlFile}`);
} finally {
  await connection.end();
}

