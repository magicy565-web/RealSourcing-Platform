-- ============================================================
-- RealSourcing 8家工厂差异化数据注入脚本
-- 执行时间：2026-02-22
-- ============================================================

-- ─── 1. 修正 factories 主表数据 ────────────────────────────────

-- ID 1: 上海鸿毅实业（美妆ODM）
UPDATE factories SET
  establishedYear = 2008,
  employeeCount = '500-999',
  annualRevenue = '10M-50M USD',
  mainProducts = JSON_ARRAY('哑光丝绒口红', '气垫BB霜', '定制香水瓶', '化妆品包材'),
  exportMarkets = JSON_ARRAY('North America', 'Europe', 'Southeast Asia', 'Middle East'),
  certifications = JSON_ARRAY('GMP', 'ISO22716', 'FDA备案', 'BSCI'),
  tags = JSON_ARRAY('美妆ODM', 'GMP认证', '无尘车间', '快速打样', '小单可接'),
  responseRate = 94.20,
  avgResponseTime = 2,
  languagesSpoken = JSON_ARRAY('English', 'Chinese'),
  description = '上海闵行区专业美妆ODM/OEM服务商，拥有GMP标准无尘灌装车间，主营彩妆盒、口红管及化妆品包材，提供从研发到成品的一站式解决方案。与欧莱雅、科蒂等国际品牌有稳定合作，年出口额超2000万美元。'
WHERE id = 1;

-- ID 2: 广州极联智能（智能家居）
UPDATE factories SET
  establishedYear = 2014,
  employeeCount = '200-499',
  annualRevenue = '5M-10M USD',
  mainProducts = JSON_ARRAY('智能中控面板', 'IR红外控制器', '全屋智能套装', 'WiFi智能开关'),
  exportMarkets = JSON_ARRAY('North America', 'Europe', 'Middle East', 'Australia'),
  certifications = JSON_ARRAY('CE', 'FCC', 'RoHS', 'Amazon Alexa认证'),
  tags = JSON_ARRAY('智能中控', 'Alexa兼容', 'Amazon FBA', 'CE认证', '全屋智能'),
  responseRate = 91.06,
  avgResponseTime = 4,
  languagesSpoken = JSON_ARRAY('English', 'Chinese'),
  description = '广州大学城国家数字家庭应用示范基地企业，Geeklink极联智能专注全屋智能中控系统研发，产品兼容Alexa/Google Home，已进入北美、欧洲主流电商渠道，Amazon BSR Top 100。'
WHERE id = 2;

-- ID 10: 广州极联智能（智能家居，演示版）
UPDATE factories SET
  establishedYear = 2014,
  employeeCount = '200-499',
  annualRevenue = '5M-10M USD',
  mainProducts = JSON_ARRAY('Geeklink智能中控', '全屋智能套装', 'IR红外控制器', 'WiFi智能插座'),
  exportMarkets = JSON_ARRAY('North America', 'Europe', 'Middle East', 'Australia'),
  certifications = JSON_ARRAY('CE', 'FCC', 'RoHS', 'Amazon Alexa认证'),
  tags = JSON_ARRAY('智能中控', 'Alexa兼容', 'Amazon FBA', 'CE认证', '全屋智能'),
  responseRate = 91.06,
  avgResponseTime = 4,
  languagesSpoken = JSON_ARRAY('English', 'Chinese'),
  description = '广州大学城国家数字家庭应用示范基地企业，Geeklink极联智能专注全屋智能中控系统研发，产品兼容Alexa/Google Home，已进入北美、欧洲主流电商渠道，Amazon BSR Top 100。'
WHERE id = 10;

-- ID 11: 深圳立秀运动（运动服装）
UPDATE factories SET
  establishedYear = 2016,
  employeeCount = '200-499',
  annualRevenue = '5M-10M USD',
  mainProducts = JSON_ARRAY('无缝瑜伽套装', '女性运动内衣', '压缩裤', '运动短裤'),
  exportMarkets = JSON_ARRAY('USA', 'UK', 'Germany', 'Australia', 'Canada'),
  certifications = JSON_ARRAY('OEKO-TEX', 'BSCI', 'ISO9001', 'GRS再生认证'),
  tags = JSON_ARRAY('Shopify友好', '白标发货', '小单友好', '女性运动专家', 'ODM能力强'),
  responseRate = 88.30,
  avgResponseTime = 3,
  languagesSpoken = JSON_ARRAY('English', 'Chinese'),
  description = '深圳坪山区专业运动服装ODM工厂，专注女性瑜伽/健身服装研发制造，拥有自主针织工艺，面料弹力≥400%，与Lululemon供应链同级。支持Shopify白标发货，最低起订50件。'
WHERE id = 11;

-- ID 12: 上海鸿毅实业（美妆，演示版）
UPDATE factories SET
  establishedYear = 2008,
  employeeCount = '500-999',
  annualRevenue = '10M-50M USD',
  mainProducts = JSON_ARRAY('哑光丝绒口红', '气垫BB霜', '定制香水瓶', '化妆品包材'),
  exportMarkets = JSON_ARRAY('North America', 'Europe', 'Southeast Asia', 'Middle East'),
  certifications = JSON_ARRAY('GMP', 'ISO22716', 'FDA备案', 'BSCI'),
  tags = JSON_ARRAY('美妆ODM', 'GMP认证', '无尘车间', '快速打样', '小单可接'),
  responseRate = 96.80,
  avgResponseTime = 1,
  languagesSpoken = JSON_ARRAY('English', 'Chinese', 'French'),
  description = '上海闵行区专业美妆ODM/OEM服务商，拥有GMP标准无尘灌装车间，主营彩妆盒、口红管及化妆品包材，提供从研发到成品的一站式解决方案。与欧莱雅、科蒂等国际品牌有稳定合作。'
WHERE id = 12;

-- ID 13: 东莞源杰工艺（礼品工艺）
UPDATE factories SET
  establishedYear = 2010,
  employeeCount = '51-200',
  annualRevenue = '1M-5M USD',
  mainProducts = JSON_ARRAY('定制珐琅徽章', '金属钥匙扣', '企业纪念章', '奖牌奖杯'),
  exportMarkets = JSON_ARRAY('USA', 'UK', 'Germany', 'Japan', 'Australia'),
  certifications = JSON_ARRAY('ISO9001', 'BSCI', 'SGS检测'),
  tags = JSON_ARRAY('展会参展', '小单友好', '品牌定制专家', '珐琅工艺精湛', '价格有竞争力'),
  responseRate = 82.50,
  avgResponseTime = 8,
  languagesSpoken = JSON_ARRAY('English', 'Chinese'),
  description = '东莞长安镇专业金属工艺品制造商，专注珐琅徽章、金属钥匙扣等定制礼品，采用传统烤漆工艺结合现代CNC精密加工，支持企业Logo定制，最低起订100件，7天快速打样。'
WHERE id = 13;

-- ID 14: 宁波PM模具（精密模具）
UPDATE factories SET
  establishedYear = 2009,
  employeeCount = '51-200',
  annualRevenue = '5M-10M USD',
  mainProducts = JSON_ARRAY('精密注塑模具', 'CNC精密零件', '汽车配件模具', '医疗器械模具'),
  exportMarkets = JSON_ARRAY('Germany', 'USA', 'Japan', 'South Korea', 'UK'),
  certifications = JSON_ARRAY('IATF16949', 'ISO9001', 'ISO14001', 'SGS'),
  tags = JSON_ARRAY('Dropship', '小单友好', '精密模具专家', '快速打样', 'IATF16949认证'),
  responseRate = 89.40,
  avgResponseTime = 5,
  languagesSpoken = JSON_ARRAY('English', 'Chinese', 'German'),
  description = '宁波北仑区精密模具制造商，拥有30+台高精度CNC加工中心，模具精度达±0.005mm，服务汽车、医疗、消费电子等行业，通过IATF16949认证，支持3D打印快速打样，7天交样。'
WHERE id = 14;

-- ID 15: 杭州灵伴科技（穿戴科技）
UPDATE factories SET
  establishedYear = 2018,
  employeeCount = '51-200',
  annualRevenue = '1M-10M USD',
  mainProducts = JSON_ARRAY('Rokid AR眼镜', 'AI智能助手设备', '企业级AR解决方案', '消费级AR套件'),
  exportMarkets = JSON_ARRAY('USA', 'UK', 'Germany', 'France', 'Japan'),
  certifications = JSON_ARRAY('CE', 'FCC', 'RoHS', 'MFi认证'),
  tags = JSON_ARRAY('Amazon FBA', 'Dropship', '小单友好', 'AR眼镜前沿', 'AI集成能力', '新兴品牌潜力'),
  responseRate = 88.50,
  avgResponseTime = 6,
  languagesSpoken = JSON_ARRAY('English', 'Chinese', 'Japanese'),
  description = '杭州滨江区AR/AI穿戴设备研发商，Rokid品牌创始企业，专注消费级与企业级AR眼镜研发，仅重49克，集成实时翻译、物体识别功能，已获红杉资本等顶级VC投资，进入全球20+国市场。'
WHERE id = 15;

-- ─── 2. 修正 factory_details 联系方式 ─────────────────────────

UPDATE factory_details SET
  phone = '+86-21-5888-6688',
  email = 'export@hongyi-cosmetic.com',
  website = 'www.hongyi-cosmetic.com',
  established = 2008,
  employeeCount = '500-1000人',
  annualRevenue = '$10M-50M',
  certifications = JSON_ARRAY('GMP', 'ISO22716', 'FDA备案', 'BSCI'),
  productionCapacity = JSON_ARRAY(
    JSON_OBJECT('item', '口红/唇釉', 'capacity', '500万支/年'),
    JSON_OBJECT('item', '气垫BB霜', 'capacity', '200万件/年'),
    JSON_OBJECT('item', '化妆品包材', 'capacity', '1000万件/年')
  )
WHERE factoryId = 1;

-- ─── 3. 清空旧产品，插入差异化产品 ────────────────────────────

-- 删除旧的重复/错误产品
DELETE FROM products WHERE factoryId IN (1,2,10,11,12,13,14,15);

-- ID 1: 鸿毅实业 - 美妆产品
INSERT INTO products (factoryId, name, slug, category, description, moq, leadTime, priceMin, priceMax, status, createdAt, updatedAt) VALUES
(1, '哑光丝绒口红系列', 'hongyi-matte-lipstick', '彩妆', '持久显色12小时，不沾杯配方，提供OEM色号定制，支持私标包装，MOQ 500支起。', 500, '20-30天', 1.20, 3.50, 'active', NOW(), NOW()),
(1, '气垫BB霜OEM', 'hongyi-cushion-bb', '底妆', '轻薄透气配方，SPF50+防晒，支持配方定制，GMP车间生产，FDA备案可出口美国。', 1000, '25-35天', 2.80, 6.50, 'active', NOW(), NOW()),
(1, '定制香水瓶包材', 'hongyi-perfume-bottle', '包材', '高端玻璃香水瓶，支持喷砂/镀金/丝印工艺，100ml/50ml/30ml多规格，最低起订200件。', 200, '30-45天', 3.50, 12.00, 'active', NOW(), NOW()),
(1, '化妆品礼盒套装', 'hongyi-gift-set', '礼盒', '节日礼盒定制，含口红+眼影+腮红组合，精美礼盒包装，支持品牌定制，圣诞/情人节爆款。', 300, '35-45天', 8.00, 25.00, 'active', NOW(), NOW());

-- ID 2: 极联智能 - 智能家居产品
INSERT INTO products (factoryId, name, slug, category, description, moq, leadTime, priceMin, priceMax, status, createdAt, updatedAt) VALUES
(2, 'Geeklink Thinker 智能中控', 'geeklink-thinker-hub', '智能家居', '支持WiFi/红外/射频三合一控制，兼容Alexa/Google Home，APP远程控制，支持定时场景联动。', 200, '15-25天', 25.00, 45.00, 'active', NOW(), NOW()),
(2, 'Geeklink Mini 红外控制器', 'geeklink-mini-ir', '智能家居', '超小体积WiFi红外控制器，支持空调/电视/机顶盒等所有红外设备，Alexa语音控制。', 500, '10-15天', 8.00, 15.00, 'active', NOW(), NOW()),
(2, 'WiFi智能开关面板', 'geeklink-wifi-switch', '智能开关', '86型标准面板，支持单/双/三联，中性线/零火线两种接法，APP+语音双控，OEM定制可选。', 300, '20-30天', 6.00, 18.00, 'active', NOW(), NOW()),
(2, '全屋智能套装', 'geeklink-smart-home-kit', '套装', '含中控主机+4个智能开关+2个红外控制器，开箱即用，适合Airbnb/酒店批量采购。', 50, '20-30天', 120.00, 180.00, 'active', NOW(), NOW());

-- ID 10: 极联智能（演示版）
INSERT INTO products (factoryId, name, slug, category, description, moq, leadTime, priceMin, priceMax, status, createdAt, updatedAt) VALUES
(10, 'Geeklink Thinker 智能中控', 'geeklink-thinker-10', '智能家居', '支持WiFi/红外/射频三合一控制，兼容Alexa/Google Home，APP远程控制，支持定时场景联动。', 200, '15-25天', 25.00, 45.00, 'active', NOW(), NOW()),
(10, 'Geeklink Mini 红外控制器', 'geeklink-mini-10', '智能家居', '超小体积WiFi红外控制器，支持空调/电视/机顶盒等所有红外设备，Alexa语音控制。', 500, '10-15天', 8.00, 15.00, 'active', NOW(), NOW()),
(10, 'WiFi智能开关', 'geeklink-switch-10', '智能开关', '86型标准面板，支持单/双/三联，APP+语音双控，OEM定制可选。', 300, '20-30天', 6.00, 18.00, 'active', NOW(), NOW());

-- ID 11: 立秀运动 - 运动服装
INSERT INTO products (factoryId, name, slug, category, description, moq, leadTime, priceMin, priceMax, status, createdAt, updatedAt) VALUES
(11, '无缝瑜伽套装（上衣+裤）', 'lixiu-yoga-set', '瑜伽服', '四向弹力无缝编织，弹力≥400%，速干透气，提供OEM颜色定制，Shopify白标发货。', 50, '30-45天', 12.00, 28.00, 'active', NOW(), NOW()),
(11, '女性运动内衣', 'lixiu-sports-bra', '运动内衣', '中强度支撑，无钢圈设计，可拆卸胸垫，多色可选，支持私标定制，最低起订50件。', 50, '25-35天', 6.00, 15.00, 'active', NOW(), NOW()),
(11, '高腰压缩运动裤', 'lixiu-leggings', '运动裤', '高腰设计提臀效果，四向弹力面料，口袋设计，适合跑步/瑜伽/健身，OEKO-TEX认证。', 100, '20-30天', 8.00, 20.00, 'active', NOW(), NOW()),
(11, '运动短裤套装', 'lixiu-shorts-set', '运动短裤', '2合1设计，内置压缩裤，外层轻薄速干，适合跑步/HIIT训练，支持定制印花。', 100, '20-30天', 7.00, 18.00, 'active', NOW(), NOW());

-- ID 12: 鸿毅实业（演示版）
INSERT INTO products (factoryId, name, slug, category, description, moq, leadTime, priceMin, priceMax, status, createdAt, updatedAt) VALUES
(12, '哑光丝绒口红系列', 'hongyi12-lipstick', '彩妆', '持久显色12小时，不沾杯配方，提供OEM色号定制，支持私标包装，MOQ 500支起。', 500, '20-30天', 1.20, 3.50, 'active', NOW(), NOW()),
(12, '气垫BB霜OEM', 'hongyi12-cushion', '底妆', '轻薄透气配方，SPF50+防晒，支持配方定制，GMP车间生产，FDA备案可出口美国。', 1000, '25-35天', 2.80, 6.50, 'active', NOW(), NOW()),
(12, '精华液私标定制', 'hongyi12-serum', '护肤', '玻尿酸+烟酰胺配方，支持成分定制，白标/私标均可，小批量起订，附SGS检测报告。', 200, '30-40天', 3.00, 8.00, 'active', NOW(), NOW()),
(12, '化妆品礼盒套装', 'hongyi12-giftset', '礼盒', '节日礼盒定制，含口红+眼影+腮红，精美礼盒包装，支持品牌定制。', 300, '35-45天', 8.00, 25.00, 'active', NOW(), NOW());

-- ID 13: 源杰工艺 - 礼品工艺
INSERT INTO products (factoryId, name, slug, category, description, moq, leadTime, priceMin, priceMax, status, createdAt, updatedAt) VALUES
(13, '定制珐琅金属徽章', 'yuanjie-enamel-badge', '徽章', '精细烤漆工艺，金属质感，支持企业Logo定制，硬珐琅/软珐琅可选，附安全别针。', 100, '15-25天', 0.80, 3.50, 'active', NOW(), NOW()),
(13, '金属钥匙扣定制', 'yuanjie-keychain', '钥匙扣', '锌合金压铸，支持3D浮雕设计，电镀金/银/古铜多种表面处理，企业礼品首选。', 100, '10-20天', 0.50, 2.50, 'active', NOW(), NOW()),
(13, '企业纪念章套装', 'yuanjie-medal-set', '纪念章', '运动会/企业年会定制奖牌，含绶带，直径50mm/70mm可选，支持彩色印刷背面。', 50, '20-30天', 2.00, 8.00, 'active', NOW(), NOW()),
(13, '搪瓷马克杯定制', 'yuanjie-enamel-mug', '礼品杯', '复古搪瓷工艺，支持全彩印刷，350ml标准容量，适合品牌推广/节日礼品。', 200, '15-25天', 3.00, 7.00, 'active', NOW(), NOW());

-- ID 14: PM模具 - 精密模具
INSERT INTO products (factoryId, name, slug, category, description, moq, leadTime, priceMin, priceMax, status, createdAt, updatedAt) VALUES
(14, '精密注塑模具', 'pm-injection-mold', '注塑模具', '采用P20/H13优质模具钢，精度±0.005mm，支持复杂结构，寿命100万次+，含3D设计服务。', 1, '45-60天', 3000.00, 50000.00, 'active', NOW(), NOW()),
(14, 'CNC精密加工件', 'pm-cnc-parts', 'CNC零件', '5轴CNC精密加工，铝/钢/钛/铜均可，公差±0.01mm，适合汽车/医疗/航空零部件。', 1, '7-15天', 50.00, 5000.00, 'active', NOW(), NOW()),
(14, '汽车内饰模具', 'pm-auto-mold', '汽车模具', '通过IATF16949认证，专业汽车内饰件模具，支持PP/ABS/PC等工程塑料，表面纹理处理。', 1, '60-90天', 10000.00, 200000.00, 'active', NOW(), NOW()),
(14, '快速3D打印样件', 'pm-3d-prototype', '快速打样', 'SLA/SLS/FDM多种工艺，24小时出样，精度±0.1mm，适合产品验证和展会样品。', 1, '3-7天', 50.00, 500.00, 'active', NOW(), NOW());

-- ID 15: 灵伴科技 - AR眼镜
INSERT INTO products (factoryId, name, slug, category, description, moq, leadTime, priceMin, priceMax, status, createdAt, updatedAt) VALUES
(15, 'Rokid AR Lite 消费级AR眼镜', 'rokid-ar-lite', 'AR眼镜', '仅重49克，搭载Rokid AI助手，支持实时翻译/导航/物体识别，续航8小时，兼容iOS/Android。', 100, '30-45天', 180.00, 280.00, 'active', NOW(), NOW()),
(15, 'Rokid Max 企业级AR眼镜', 'rokid-ar-max', '企业AR', '4K Micro-OLED显示，120°视场角，支持远程协作/工业巡检/培训，企业定制版含SDK。', 50, '45-60天', 450.00, 650.00, 'active', NOW(), NOW()),
(15, 'Rokid Station 独立计算单元', 'rokid-station', '配件', '搭配AR眼镜使用的独立计算单元，骁龙XR2处理器，支持离线AI推理，IP54防护等级。', 100, '30-45天', 120.00, 180.00, 'active', NOW(), NOW()),
(15, 'AR企业解决方案套件', 'rokid-enterprise-kit', '套装', '含AR Max眼镜+Station+定制SDK+技术支持，适合工厂巡检/远程维修/仓储管理场景。', 20, '60-90天', 800.00, 1200.00, 'active', NOW(), NOW());

-- ─── 4. 为所有工厂添加差异化评价 ───────────────────────────────

-- 清空旧评价（只保留ID 1的）
DELETE FROM factory_reviews WHERE factoryId IN (10,11,12,13,14,15);

-- ID 10: 极联智能评价
INSERT INTO factory_reviews (factoryId, userId, rating, comment, createdAt) VALUES
(10, 2, 5, '产品与Alexa兼容性非常好，接入我们的智能家居系统毫无障碍，已下第三单。', NOW()),
(10, 2, 5, '工厂响应速度超快，样品3天到货，质量超出预期，强烈推荐！', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(10, 2, 4, '价格有竞争力，OEM定制服务专业，唯一不足是包装需要改进。', DATE_SUB(NOW(), INTERVAL 7 DAY)),
(10, 2, 5, 'Amazon FBA发货流程非常熟悉，条码贴合规范，零退件率。', DATE_SUB(NOW(), INTERVAL 14 DAY));

-- ID 11: 立秀运动评价
INSERT INTO factory_reviews (factoryId, userId, rating, comment, createdAt) VALUES
(11, 2, 5, '瑜伽套装面料质感超好，客户反馈弹力和透气性都非常棒，复购率很高！', NOW()),
(11, 2, 5, 'Shopify白标发货服务太方便了，直接发到我们客户，省去了中转环节。', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(11, 2, 4, 'ODM定制颜色很准，打样速度快，就是起订量稍微有点高。', DATE_SUB(NOW(), INTERVAL 10 DAY)),
(11, 2, 5, '女性运动服装专业度很高，版型设计非常好，欧美客户很喜欢。', DATE_SUB(NOW(), INTERVAL 20 DAY));

-- ID 12: 鸿毅实业评价
INSERT INTO factory_reviews (factoryId, userId, rating, comment, createdAt) VALUES
(12, 2, 5, 'GMP车间生产的口红质量非常稳定，FDA备案让我们顺利进入美国市场！', NOW()),
(12, 2, 5, '快速打样服务太赞了，7天拿到样品，颜色和配方完全按要求，立即下单。', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(12, 2, 5, '与多家美妆工厂合作过，鸿毅的品控是最严格的，强烈推荐！', DATE_SUB(NOW(), INTERVAL 8 DAY)),
(12, 2, 4, '包材定制服务很专业，设计团队响应快，就是价格稍高但物有所值。', DATE_SUB(NOW(), INTERVAL 15 DAY));

-- ID 13: 源杰工艺评价
INSERT INTO factory_reviews (factoryId, userId, rating, comment, createdAt) VALUES
(13, 2, 5, '珐琅徽章工艺精湛，颜色鲜艳持久，企业年会礼品客户非常满意！', NOW()),
(13, 2, 4, '价格非常有竞争力，100件起订很友好，适合小批量定制需求。', DATE_SUB(NOW(), INTERVAL 6 DAY)),
(13, 2, 5, '钥匙扣3D浮雕效果很好，电镀质量稳定，已经合作3年了。', DATE_SUB(NOW(), INTERVAL 12 DAY));

-- ID 14: PM模具评价
INSERT INTO factory_reviews (factoryId, userId, rating, comment, createdAt) VALUES
(14, 2, 5, 'CNC精度非常高，公差控制在±0.005mm以内，汽车零件完全符合要求！', NOW()),
(14, 2, 5, '3D打印样件服务太快了，24小时拿到样品，大大缩短了开发周期。', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(14, 2, 5, 'IATF16949认证工厂，质量管理体系非常完善，已成为我们长期供应商。', DATE_SUB(NOW(), INTERVAL 9 DAY)),
(14, 2, 4, '模具寿命超过承诺的100万次，性价比很高，德语沟通也没问题。', DATE_SUB(NOW(), INTERVAL 18 DAY));

-- ID 15: 灵伴科技评价
INSERT INTO factory_reviews (factoryId, userId, rating, comment, createdAt) VALUES
(15, 2, 5, 'Rokid AR眼镜的AI翻译功能非常实用，我们用于展会接待，效果惊艳！', NOW()),
(15, 2, 5, '企业级AR解决方案完全满足工厂巡检需求，技术支持团队响应及时。', DATE_SUB(NOW(), INTERVAL 7 DAY)),
(15, 2, 4, '产品创新性很强，就是价格偏高，但对于B端企业客户来说物超所值。', DATE_SUB(NOW(), INTERVAL 14 DAY));

-- ─── 5. 更新 factory_details 联系方式 ─────────────────────────

INSERT INTO factory_details (factoryId, phone, email, website, established, employeeCount, annualRevenue, certifications, productionCapacity, createdAt, updatedAt)
VALUES 
(10, '+86-20-8888-6699', 'export@geeklink.cn', 'www.geeklink.cn', 2014, '200-499人', '$5M-10M',
 JSON_ARRAY('CE', 'FCC', 'RoHS', 'Amazon Alexa认证'),
 JSON_ARRAY(JSON_OBJECT('item','智能中控','capacity','50万台/年'), JSON_OBJECT('item','WiFi开关','capacity','200万件/年')),
 NOW(), NOW()),
(11, '+86-755-2888-9966', 'sales@lixiu-sports.com', 'www.lixiu-sports.com', 2016, '200-499人', '$5M-10M',
 JSON_ARRAY('OEKO-TEX', 'BSCI', 'ISO9001', 'GRS再生认证'),
 JSON_ARRAY(JSON_OBJECT('item','瑜伽套装','capacity','100万套/年'), JSON_OBJECT('item','运动内衣','capacity','200万件/年')),
 NOW(), NOW()),
(12, '+86-21-5888-6688', 'export@hongyi-cosmetic.com', 'www.hongyi-cosmetic.com', 2008, '500-1000人', '$10M-50M',
 JSON_ARRAY('GMP', 'ISO22716', 'FDA备案', 'BSCI'),
 JSON_ARRAY(JSON_OBJECT('item','口红/唇釉','capacity','500万支/年'), JSON_OBJECT('item','气垫BB霜','capacity','200万件/年')),
 NOW(), NOW()),
(13, '+86-769-8866-5533', 'info@yuanjie-craft.com', 'www.yuanjie-craft.com', 2010, '51-200人', '$1M-5M',
 JSON_ARRAY('ISO9001', 'BSCI', 'SGS检测'),
 JSON_ARRAY(JSON_OBJECT('item','金属徽章','capacity','500万件/年'), JSON_OBJECT('item','钥匙扣','capacity','300万件/年')),
 NOW(), NOW()),
(14, '+86-574-8699-7788', 'sales@pm-mold.com', 'www.pm-mold.com', 2009, '51-200人', '$5M-10M',
 JSON_ARRAY('IATF16949', 'ISO9001', 'ISO14001', 'SGS'),
 JSON_ARRAY(JSON_OBJECT('item','注塑模具','capacity','200套/年'), JSON_OBJECT('item','CNC精密件','capacity','50万件/年')),
 NOW(), NOW()),
(15, '+86-571-8866-9977', 'bd@rokid.com', 'www.rokid.com', 2018, '51-200人', '$1M-10M',
 JSON_ARRAY('CE', 'FCC', 'RoHS', 'MFi认证'),
 JSON_ARRAY(JSON_OBJECT('item','AR眼镜','capacity','10万台/年'), JSON_OBJECT('item','计算单元','capacity','20万台/年')),
 NOW(), NOW())
ON DUPLICATE KEY UPDATE
  phone = VALUES(phone),
  email = VALUES(email),
  website = VALUES(website),
  established = VALUES(established),
  employeeCount = VALUES(employeeCount),
  annualRevenue = VALUES(annualRevenue),
  certifications = VALUES(certifications),
  productionCapacity = VALUES(productionCapacity),
  updatedAt = NOW();
