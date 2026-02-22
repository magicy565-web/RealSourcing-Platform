import mysql from 'mysql2/promise';

const conn = await mysql.createConnection('mysql://magicyang:Wysk1214@rm-bp1h4o9up7249uep3to.mysql.rds.aliyuncs.com:3306/realsourcing');

try {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS inquiry_messages (
      id INT PRIMARY KEY AUTO_INCREMENT,
      inquiryId INT NOT NULL,
      senderId INT NOT NULL,
      senderRole VARCHAR(20) NOT NULL DEFAULT 'buyer',
      content TEXT NOT NULL,
      isRead TINYINT NOT NULL DEFAULT 0,
      createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      INDEX idx_inquiry_id (inquiryId),
      INDEX idx_sender_id (senderId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log('✅ Table inquiry_messages created successfully');
} catch (e) {
  if (e.code === 'ER_TABLE_EXISTS_ERROR') {
    console.log('ℹ️  Table already exists');
  } else {
    console.error('❌ Error:', e.message);
  }
}

await conn.end();
