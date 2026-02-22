const mysql = require('mysql2/promise');

async function test() {
  console.log('🚀 Testing direct DB connection...');
  const connection = await mysql.createConnection('mysql://magicyang:Wysk1214@rm-bp1h4o9up7249uep3to.mysql.rds.aliyuncs.com:3306/realsourcing');
  
  try {
    // 1. 检查表是否存在
    console.log('--- Step 1: Checking webinar_leads table ---');
    const [rows] = await connection.execute('SHOW TABLES LIKE "webinar_leads"');
    if (rows.length === 0) {
      console.log('❌ Table "webinar_leads" does not exist in the database.');
      console.log('Please run migrations or create the table manually.');
      
      // 尝试自动创建表（根据 schema.ts 定义）
      console.log('--- Attempting to create table ---');
      const createTableSql = `
        CREATE TABLE IF NOT EXISTS webinar_leads (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          webinar_id INT NOT NULL,
          product_id INT NOT NULL,
          quantity VARCHAR(255) NOT NULL,
          status VARCHAR(50) DEFAULT 'new',
          whatsapp_sent BOOLEAN DEFAULT FALSE,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `;
      await connection.execute(createTableSql);
      console.log('✅ Table created successfully.');
    } else {
      console.log('✅ Table "webinar_leads" exists.');
    }

    // 2. 测试插入数据
    console.log('--- Step 2: Testing Insert ---');
    const [insertResult] = await connection.execute(
      'INSERT INTO webinar_leads (user_id, webinar_id, product_id, quantity) VALUES (?, ?, ?, ?)',
      [1, 1, 1, 'Test 50 units']
    );
    console.log('✅ Insert successful, ID:', insertResult.insertId);

    // 3. 测试查询
    console.log('--- Step 3: Testing Query ---');
    const [leads] = await connection.execute('SELECT * FROM webinar_leads WHERE id = ?', [insertResult.insertId]);
    console.log('✅ Query result:', leads[0]);

    // 4. 清理测试数据
    console.log('--- Step 4: Cleaning up ---');
    await connection.execute('DELETE FROM webinar_leads WHERE id = ?', [insertResult.insertId]);
    console.log('✅ Cleanup successful.');

  } catch (err) {
    console.error('❌ DB Error:', err);
  } finally {
    await connection.end();
  }
}

test();
