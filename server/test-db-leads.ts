import 'dotenv/config';
import * as db from './db';

async function testLeadsFlow() {
  console.log('🚀 Starting Webinar Leads Flow Test...');
  
  try {
    // 1. 创建测试线索
    const testLead = {
      userId: 1, // 假设用户 1 存在
      webinarId: 1, // 假设 Webinar 1 存在
      productId: 1,
      quantity: '100 units',
    };
    
    console.log('--- Step 1: Creating Lead ---');
    const newLead = await db.createWebinarLead(testLead);
    console.log('✅ Lead created:', newLead);
    
    // 2. 获取线索列表
    console.log('--- Step 2: Fetching Leads for Webinar 1 ---');
    const leads = await db.getWebinarLeads(1);
    console.log('✅ Fetched leads count:', leads.length);
    
    // 3. 更新线索状态
    if (newLead && newLead.id) {
      console.log('--- Step 3: Updating Lead Status ---');
      const updatedLead = await db.updateWebinarLeadStatus(newLead.id, 'contacted', 'Test follow up');
      console.log('✅ Lead updated:', updatedLead);
    }
    
    // 4. 获取线索总数
    console.log('--- Step 4: Getting Lead Count ---');
    const count = await db.getWebinarLeadCount(1);
    console.log('✅ Total leads for webinar 1:', count);

    console.log('\n✨ All DB tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testLeadsFlow();
