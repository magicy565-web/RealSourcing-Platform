require('dotenv/config');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const pool = mysql.createPool(process.env.DATABASE_URL);

async function run() {
  const sqlFile = path.join(__dirname, 'RealSourcing-Platform/drizzle/inject_differentiated_data.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');
  
  // 按分号拆分语句
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => {
      if (s.length === 0) return false;
      if (s.startsWith('--')) return false;
      // 过滤只有注释的块
      const lines = s.split('\n').filter(l => l.trim().length > 0 && !l.trim().startsWith('--'));
      return lines.length > 0;
    });
  
  let ok = 0, fail = 0;
  for (const stmt of statements) {
    try {
      await pool.query(stmt);
      ok++;
      if (ok % 5 === 0) console.log(`  进度: ${ok}/${statements.length}`);
    } catch(e) {
      console.error('FAIL:', e.message.substring(0, 120));
      console.error('  SQL:', stmt.substring(0, 100));
      fail++;
    }
  }
  console.log(`完成: ${ok} 成功, ${fail} 失败`);
  process.exit(0);
}

run().catch(e => { console.error(e.message); process.exit(1); });
