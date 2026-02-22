import 'dotenv/config';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pool = mysql.createPool(process.env.DATABASE_URL);

async function run() {
  const sqlFile = path.join(__dirname, 'drizzle/inject_differentiated_data.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');
  
  // 按分号拆分语句
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => {
      if (s.length === 0) return false;
      const lines = s.split('\n').filter(l => l.trim().length > 0 && !l.trim().startsWith('--'));
      return lines.length > 0;
    });
  
  console.log(`共 ${statements.length} 条语句`);
  let ok = 0, fail = 0;
  for (const stmt of statements) {
    try {
      await pool.query(stmt);
      ok++;
      if (ok % 5 === 0) console.log(`  进度: ${ok}/${statements.length}`);
    } catch(e) {
      console.error('FAIL:', e.message.substring(0, 150));
      console.error('  SQL:', stmt.substring(0, 120));
      fail++;
    }
  }
  console.log(`完成: ${ok} 成功, ${fail} 失败`);
  await pool.end();
  process.exit(0);
}

run().catch(e => { console.error(e.message); process.exit(1); });
