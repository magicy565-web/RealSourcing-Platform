-- ============================================================
-- RealSourcing Platform - 演示种子数据 v2
-- 完全适配阿里云 RDS MySQL 8.0 实际 Schema
-- 保留现有数据，仅追加新演示数据
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ── 1. 新增工厂管理员用户
INSERT IGNORE INTO `users` 
  (`id`, `openId`, `email`, `passwordHash`, `name`, `role`, `status`, `onboardingCompleted`, `emailVerified`, `company`, `location`, `language`)
VALUES
  (20, 'demo_factory_gz_001', 'factory_gz@demo.realsourcing.com', '$2b$10$demoHashGZ001', '广州家居科技', 'FACTORY_ADMIN', 'active', 1, 1, '广州家居科技有限公司', '广州, 广东', 'zh-CN'),
  (21, 'demo_factory_sz_002', 'factory_sz@demo.realsourcing.com', '$2b$10$demoHashSZ002', '深圳运动装备', 'FACTORY_ADMIN', 'active', 1, 1, '深圳运动装备制造有限公司', '深圳, 广东', 'zh-CN'),
  (22, 'demo_factory_sh_003', 'factory_sh@demo.realsourcing.com', '$2b$10$demoHashSH003', '上海美妆科技', 'FACTORY_ADMIN', 'active', 1, 1, '上海美妆科技股份有限公司', '上海', 'zh-CN'),
  (23, 'demo_factory_dg_004', 'factory_dg@demo.realsourcing.com', '$2b$10$demoHashDG004', '东莞礼品工艺', 'FACTORY_ADMIN', 'active', 1, 1, '东莞礼品工艺制品有限公司', '东莞, 广东', 'zh-CN'),
  (24, 'demo_factory_nb_005', 'factory_nb@demo.realsourcing.com', '$2b$10$demoHashNB005', '宁波精密模具', 'FACTORY_ADMIN', 'active', 1, 1, '宁波精密模具制造有限公司', '宁波, 浙江', 'zh-CN'),
  (25, 'demo_factory_hz_006', 'factory_hz@demo.realsourcing.com', '$2b$10$demoHashHZ006', '杭州穿戴科技', 'FACTORY_ADMIN', 'active', 1, 1, '杭州穿戴科技有限公司', '杭州, 浙江', 'zh-CN');

-- ── 2. 新增采购商用户
INSERT IGNORE INTO `users`
  (`id`, `openId`, `email`, `passwordHash`, `name`, `role`, `status`, `onboardingCompleted`, `emailVerified`, `company`, `location`, `language`)
VALUES
  (30, 'demo_buyer_us_001', 'buyer_us@demo.realsourcing.com', '$2b$10$demoHashBuyerUS', 'Sarah Mitchell', 'BUYER', 'active', 1, 1, 'HomeStyle USA LLC', 'New York, USA', 'en'),
  (31, 'demo_buyer_de_002', 'buyer_de@demo.realsourcing.com', '$2b$10$demoHashBuyerDE', 'Klaus Weber', 'BUYER', 'active', 1, 1, 'Weber Sports GmbH', 'Munich, Germany', 'en'),
  (32, 'demo_buyer_ca_003', 'buyer_ca@demo.realsourcing.com', '$2b$10$demoHashBuyerCA', 'Emily Chen', 'BUYER', 'active', 1, 1, 'Beauty North Inc.', 'Toronto, Canada', 'en'),
  (33, 'demo_buyer_gb_004', 'buyer_gb@demo.realsourcing.com', '$2b$10$demoHashBuyerGB', 'James Thompson', 'BUYER', 'active', 1, 1, 'GiftWorld UK Ltd', 'London, UK', 'en');

-- ── 3. 新增工厂
INSERT IGNORE INTO `factories`
  (`id`, `userId`, `name`, `slug`, `category`, `country`, `city`, `description`, `status`, `verified`, `rating`, `reviewCount`, `responseRate`, `avgResponseTime`, `employeeCount`, `establishedYear`, `annualRevenue`, `mainProducts`, `exportMarkets`, `certifications`, `tags`, `overallScore`)
VALUES
  (10, 20, '广州家居科技有限公司', 'gz-home-tech', 'Home Furnishing', 'China', '广州',
   '专注家居智能产品研发制造，拥有12年出口经验，主要产品包括智能家居控制器、LED照明系统和家居装饰品。年出口额超过2000万美元，服务全球45个国家的买家。',
   'verified', 1, 4.7, 89, 96.50, 2, '201-500', 2012, '$10M-$50M',
   '["智能家居控制器","LED照明系统","家居装饰品","智能插座"]',
   '["USA","Germany","UK","Australia","Canada"]',
   '["ISO 9001","CE","RoHS","FCC"]',
   '["智能家居","LED照明","出口经验丰富","快速响应"]',
   4.7),
  (11, 21, '深圳运动装备制造有限公司', 'sz-sports-gear', 'Sporting Goods', 'China', '深圳',
   '专业运动装备制造商，专注于户外运动、健身器材和运动服饰的研发生产。拥有先进的自动化生产线和严格的质量管控体系，产品远销欧美日韩等60余个国家。',
   'verified', 1, 4.5, 67, 94.20, 3, '501-1000', 2009, '$50M-$100M',
   '["跑步机","哑铃套装","瑜伽垫","运动护具","骑行头盔"]',
   '["USA","Germany","Japan","South Korea","France"]',
   '["ISO 9001","SGS","EN 71","ASTM"]',
   '["运动装备","健身器材","大批量生产","OEM/ODM"]',
   4.5),
  (12, 22, '上海美妆科技股份有限公司', 'sh-beauty-tech', 'Beauty & Personal Care', 'China', '上海',
   '高端美妆科技企业，专注于护肤品、彩妆和美容仪器的研发制造。拥有GMP认证生产车间和专业配方研发团队，为全球200余个品牌提供OEM/ODM服务。',
   'verified', 1, 4.8, 134, 98.10, 1, '1001-5000', 2005, '$100M+',
   '["精华液","面膜","美容仪","防晒霜","彩妆套装"]',
   '["USA","UK","Japan","South Korea","Australia"]',
   '["GMP","ISO 22716","FDA","CE","SGS"]',
   '["美妆护肤","GMP认证","配方研发","高端定制"]',
   4.8),
  (13, 23, '东莞礼品工艺制品有限公司', 'dg-gift-craft', 'Gifts & Crafts', 'China', '东莞',
   '专业礼品工艺品制造商，提供从设计到成品的一站式服务。产品涵盖企业礼品、节日礼品、创意文具等多个品类，支持小批量定制，最低起订量100件。',
   'verified', 1, 4.3, 45, 91.80, 4, '51-200', 2015, '$1M-$10M',
   '["企业定制礼品","节日礼品套装","创意文具","金属工艺品","木质礼品"]',
   '["USA","Canada","Australia","UK","UAE"]',
   '["ISO 9001","BSCI","SEDEX"]',
   '["礼品定制","小批量","快速打样","一站式服务"]',
   4.3),
  (14, 24, '宁波精密模具制造有限公司', 'nb-precision-mold', 'Industrial Equipment', 'China', '宁波',
   '精密模具制造专家，专注于注塑模具、冲压模具和压铸模具的设计与制造。拥有50余台高精度加工设备，模具精度可达±0.005mm，服务汽车、电子、医疗等多个行业。',
   'verified', 1, 4.6, 28, 97.30, 2, '201-500', 2003, '$10M-$50M',
   '["注塑模具","冲压模具","压铸模具","精密零件加工"]',
   '["Germany","USA","Japan","South Korea","Italy"]',
   '["ISO 9001","IATF 16949","ISO 13485"]',
   '["精密模具","高精度","汽车零部件","医疗器械"]',
   4.6),
  (15, 25, '杭州穿戴科技有限公司', 'hz-wearable-tech', 'Consumer Electronics', 'China', '杭州',
   '专注智能穿戴设备研发制造，产品涵盖智能手表、健康监测手环、智能眼镜等。拥有完整的研发团队和供应链体系，从芯片选型到整机出货全程把控。',
   'pending', 0, 4.1, 12, 88.50, 6, '51-200', 2018, '$1M-$10M',
   '["智能手表","健康手环","智能眼镜","TWS耳机"]',
   '["USA","UK","Germany","France","Japan"]',
   '["CE","FCC","RoHS","Bluetooth SIG"]',
   '["智能穿戴","IoT","健康监测","新兴品牌"]',
   4.1);

-- ── 4. 工厂验证数据
INSERT IGNORE INTO `factory_verifications`
  (`factoryId`, `aiVerificationScore`, `aiVerificationReason`, `complianceScore`, `trustBadges`, `lastVerificationAt`, `verificationExpiresAt`)
VALUES
  (10, 88, '{"businessLicense":true,"exportLicense":true,"qualitySystem":"ISO9001","financialHealth":"stable","yearsInBusiness":12}', 85, '["verified_exporter","quality_certified","fast_responder"]', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR)),
  (11, 82, '{"businessLicense":true,"exportLicense":true,"qualitySystem":"ISO9001","financialHealth":"good","yearsInBusiness":15}', 80, '["verified_exporter","quality_certified","large_manufacturer"]', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR)),
  (12, 95, '{"businessLicense":true,"exportLicense":true,"qualitySystem":"GMP","financialHealth":"excellent","yearsInBusiness":19}', 93, '["verified_exporter","gmp_certified","top_rated","fast_responder"]', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR)),
  (13, 72, '{"businessLicense":true,"exportLicense":true,"qualitySystem":"ISO9001","financialHealth":"stable","yearsInBusiness":9}', 70, '["verified_exporter","quality_certified"]', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR)),
  (14, 90, '{"businessLicense":true,"exportLicense":true,"qualitySystem":"IATF16949","financialHealth":"good","yearsInBusiness":21}', 88, '["verified_exporter","quality_certified","precision_manufacturer"]', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR)),
  (15, 65, '{"businessLicense":true,"exportLicense":false,"qualitySystem":"CE","financialHealth":"growing","yearsInBusiness":6}', 62, '["verified_manufacturer"]', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR));

-- ── 5. 工厂运营指标
INSERT IGNORE INTO `factory_metrics`
  (`factoryId`, `totalMeetings`, `totalSampleRequests`, `sampleConversionRate`, `totalOrders`, `totalOrderValue`, `disputeRate`, `reelCount`, `reelViewCount`)
VALUES
  (10, 156, 89, 67.42, 234, 2850000.00, 0.85, 8, 45200),
  (11, 203, 124, 58.87, 312, 8920000.00, 1.28, 5, 28900),
  (12, 445, 267, 78.65, 891, 24500000.00, 0.34, 12, 98700),
  (13, 67, 45, 44.44, 123, 890000.00, 2.44, 3, 12400),
  (14, 89, 34, 82.35, 178, 5600000.00, 0.56, 2, 8900),
  (15, 23, 18, 38.89, 34, 280000.00, 3.12, 4, 15600);

-- ── 6. 工厂认证证书
INSERT IGNORE INTO `factory_certifications`
  (`factoryId`, `name`, `issuer`, `issuedAt`, `expiresAt`, `verified`)
VALUES
  (10, 'ISO 9001:2015', 'Bureau Veritas', '2023-03-15', '2026-03-14', 1),
  (10, 'CE Certification', 'TUV Rheinland', '2023-06-01', '2026-05-31', 1),
  (10, 'RoHS Compliance', 'SGS', '2023-06-01', '2025-05-31', 1),
  (11, 'ISO 9001:2015', 'SGS', '2022-09-20', '2025-09-19', 1),
  (11, 'EN 71 Safety', 'Intertek', '2023-01-10', '2025-01-09', 1),
  (12, 'GMP Certification', 'NMPA', '2023-05-01', '2026-04-30', 1),
  (12, 'ISO 22716:2007', 'Bureau Veritas', '2023-05-01', '2026-04-30', 1),
  (12, 'FDA Registration', 'US FDA', '2022-11-15', '2027-11-14', 1),
  (13, 'ISO 9001:2015', 'Intertek', '2023-07-01', '2026-06-30', 1),
  (13, 'BSCI Audit', 'BSCI', '2023-08-15', '2025-08-14', 1),
  (14, 'ISO 9001:2015', 'TUV SUD', '2022-12-01', '2025-11-30', 1),
  (14, 'IATF 16949:2016', 'TUV SUD', '2022-12-01', '2025-11-30', 1);

-- ── 7. 产品数据
INSERT IGNORE INTO `products`
  (`id`, `factoryId`, `name`, `description`, `category`, `moq`, `leadTime`, `price`, `currency`, `status`)
VALUES
  (20, 10, '智能家居控制中枢 Pro', '支持Zigbee/WiFi/蓝牙三协议，兼容Amazon Alexa、Google Home、Apple HomeKit，可控制128个智能设备。', 'Smart Home', 500, '25-35天', 45.00, 'USD', 'active'),
  (21, 10, 'LED 智能灯带套装', 'RGBW四色调光，支持APP控制和语音控制，防水等级IP65，每米60颗LED，套装含5米灯带和控制器。', 'Lighting', 200, '15-20天', 18.50, 'USD', 'active'),
  (22, 11, '专业级跑步机 T900', '最大速度20km/h，坡度0-15%，运行面积140x50cm，配备心率监测和蓝牙音箱，折叠设计节省空间。', 'Fitness Equipment', 50, '30-45天', 320.00, 'USD', 'active'),
  (23, 11, '可调节哑铃套装 5-52.5磅', '快速调节系统，15秒内完成重量切换，替代15对传统哑铃，附带收纳托盘。', 'Fitness Equipment', 100, '20-30天', 89.00, 'USD', 'active'),
  (24, 12, '玻尿酸精华液 30ml', '2%玻尿酸复合配方，三重分子量渗透，临床测试显示28天肌肤水分提升47%，适合所有肤质。', 'Skincare', 1000, '20-30天', 8.50, 'USD', 'active'),
  (25, 12, '美容射频仪 RF-Pro', '三极射频技术，配合LED光疗，促进胶原蛋白再生，临床认证，适合家用。', 'Beauty Device', 200, '25-35天', 65.00, 'USD', 'active'),
  (26, 13, '企业定制礼品套装', '可定制LOGO和包装，包含商务笔、笔记本、U盘和名片夹，适合企业年会和商务赠礼。', 'Corporate Gifts', 100, '15-25天', 28.00, 'USD', 'active'),
  (27, 14, '精密注塑模具 P-Series', '钢材P20/H13可选，模具寿命50-100万次，精度0.01mm，支持复杂结构设计。', 'Mold & Tooling', 1, '45-60天', 3500.00, 'USD', 'active'),
  (28, 15, '智能健康手环 Band X5', '血氧、心率、睡眠监测，IP68防水，续航14天，兼容iOS/Android，支持50+运动模式。', 'Wearable Tech', 300, '30-45天', 22.00, 'USD', 'active');

-- ── 8. FTGI AI 评分数据
INSERT IGNORE INTO `factory_ftgi_scores`
  (`factoryId`, `d1_trust`, `d2_fulfillment`, `d3_market`, `d4_ecosystem`, `d5_community`, `raw_score`, `ai_coefficient`, `ftgi_score`, `status`, `calculatedAt`, `scoreDetails`)
VALUES
  (10, 88.00, 90.00, 78.00, 72.00, 82.00, 83.40, 0.60, 50.04, 'completed', NOW(),
   '{"d1_detail":"AI验厂分88，合规分85，12年出口经验","d2_detail":"响应率96.5%，样品转化率67.4%，纠纷率0.85%","d3_detail":"8条产品视频，市场内容丰富","d4_detail":"已集成主流电商平台","d5_detail":"89条买家评价，好评率96%"}'),
  (11, 82.00, 85.00, 70.00, 65.00, 76.00, 77.60, 0.60, 46.56, 'completed', NOW(),
   '{"d1_detail":"AI验厂分82，合规分80，15年制造经验","d2_detail":"响应率94.2%，样品转化率58.9%","d3_detail":"5条产品视频","d4_detail":"ERP系统已接入","d5_detail":"67条买家评价"}'),
  (12, 95.00, 96.00, 88.00, 85.00, 92.00, 92.40, 0.60, 55.44, 'completed', NOW(),
   '{"d1_detail":"AI验厂分95，GMP认证，合规分93，19年经验","d2_detail":"响应率98.1%，样品转化率78.7%，纠纷率0.34%","d3_detail":"12条产品视频，内容专业","d4_detail":"完整数字化供应链","d5_detail":"134条买家评价，好评率98%"}'),
  (13, 72.00, 75.00, 62.00, 55.00, 68.00, 68.40, 0.60, 41.04, 'completed', NOW(),
   '{"d1_detail":"AI验厂分72，合规分70，9年经验","d2_detail":"响应率91.8%，样品转化率44.4%","d3_detail":"3条产品视频","d4_detail":"数字化程度较低","d5_detail":"45条买家评价"}'),
  (14, 90.00, 92.00, 68.00, 78.00, 80.00, 83.60, 0.60, 50.16, 'completed', NOW(),
   '{"d1_detail":"AI验厂分90，IATF16949认证，21年经验","d2_detail":"响应率97.3%，样品转化率82.4%，纠纷率0.56%","d3_detail":"2条产品视频，内容待丰富","d4_detail":"精密制造数字化程度高","d5_detail":"28条买家评价"}'),
  (15, 65.00, 68.00, 75.00, 58.00, 60.00, 66.40, 0.60, 39.84, 'completed', NOW(),
   '{"d1_detail":"AI验厂分65，合规分62，6年经验，尚在成长","d2_detail":"响应率88.5%，样品转化率38.9%","d3_detail":"4条产品视频，内容有创意","d4_detail":"技术集成能力强但经验不足","d5_detail":"12条买家评价"}');

-- ── 9. 买家多维度评价 V2
INSERT IGNORE INTO `factory_reviews_v2`
  (`factoryId`, `userId`, `rating_overall`, `rating_communication`, `rating_quality`, `rating_lead_time`, `rating_service`, `comment`, `is_verified_purchase`)
VALUES
  (10, 30, 5, 5, 5, 4, 5, '非常专业的工厂！样品质量超出预期，沟通非常顺畅，项目经理全程跟进。交货比承诺提前了3天，强烈推荐！', 1),
  (10, 31, 4, 5, 4, 4, 5, 'Good quality products and very responsive team. The LED strips are exactly as described. Will order again.', 1),
  (10, 32, 5, 4, 5, 5, 4, 'Excellent smart home products. The quality control is very strict. Packaging is also very professional.', 1),
  (11, 30, 4, 4, 4, 3, 4, '运动装备质量不错，价格也有竞争力。交货期稍微比预期长了一周，但整体满意。', 1),
  (11, 31, 5, 5, 5, 4, 5, 'Perfect treadmill quality! The factory was very cooperative during the customization process. Highly recommended for fitness equipment.', 1),
  (12, 32, 5, 5, 5, 5, 5, '上海美妆科技是我合作过最专业的美妆代工厂！配方研发团队非常专业，GMP车间参观后完全放心。已经合作3年了，每次都超出预期。', 1),
  (12, 33, 5, 5, 5, 5, 5, 'The best cosmetics OEM factory I have worked with. Their R&D team is world-class. The hyaluronic acid serum formula they developed for us became our bestseller.', 1),
  (13, 33, 4, 4, 4, 4, 4, 'Good gift products with nice customization options. The minimum order quantity is reasonable for small businesses. Communication could be faster.', 1),
  (14, 31, 5, 5, 5, 4, 5, 'Exceptional precision! The molds they made for our automotive parts are perfect. Tolerance is within 0.005mm as promised. Very professional team.', 1),
  (14, 32, 4, 4, 5, 5, 4, '模具精度非常高，完全满足我们医疗器械的要求。交货准时，售后服务也很好。', 1),
  (15, 30, 4, 3, 4, 3, 4, 'The smart band has good features for the price. Communication was a bit slow at first but improved. Product quality is decent for a newer factory.', 1);

-- ── 10. 人工评分汇总（字段名完全匹配实际 Schema）
INSERT IGNORE INTO `factory_human_scores`
  (`factoryId`, `score_from_reviews`, `score_from_webinars`, `score_from_experts`, `human_score`, `ftgi_contribution`, `review_count`, `webinar_vote_count`, `expert_review_count`, `last_calculated_at`)
VALUES
  (10, 88.00, 0.00, 0.00, 88.00, 35.20, 3, 0, 0, NOW()),
  (11, 84.00, 0.00, 0.00, 84.00, 33.60, 2, 0, 0, NOW()),
  (12, 97.50, 0.00, 0.00, 97.50, 39.00, 2, 0, 0, NOW()),
  (13, 80.00, 0.00, 0.00, 80.00, 32.00, 1, 0, 0, NOW()),
  (14, 87.50, 0.00, 0.00, 87.50, 35.00, 2, 0, 0, NOW()),
  (15, 75.00, 0.00, 0.00, 75.00, 30.00, 1, 0, 0, NOW());

-- ── 11. 询盘数据
INSERT IGNORE INTO `inquiries`
  (`id`, `factoryId`, `buyerId`, `productId`, `subject`, `content`, `quantity`, `targetPrice`, `status`, `createdAt`)
VALUES
  (10, 10, 30, 20, '智能家居控制中枢 Pro 批量采购咨询',
   '您好，我们是美国家居零售商，对贵司的智能家居控制中枢Pro非常感兴趣。我们计划首批采购2000套，请提供详细报价和样品安排。我们的目标价格是FOB $38-42/套。',
   2000, 40.00, 'replied', DATE_SUB(NOW(), INTERVAL 5 DAY)),
  (11, 12, 32, 24, 'OEM 护肤品系列合作意向',
   'Hi, we are a Canadian beauty brand looking for a GMP-certified manufacturer for our new skincare line. We need 5 SKUs including serums, moisturizers and eye creams. Annual volume would be around 50,000 units per SKU.',
   50000, 7.50, 'replied', DATE_SUB(NOW(), INTERVAL 3 DAY)),
  (12, 11, 31, 22, 'Treadmill OEM Order Inquiry',
   'We are a German fitness equipment distributor interested in your T900 treadmill for our private label brand. Initial order would be 200 units with potential for 1000+ units annually.',
   200, 280.00, 'pending', DATE_SUB(NOW(), INTERVAL 1 DAY)),
  (13, 14, 31, 27, 'Precision Mold for Automotive Component',
   'We need a precision injection mold for an automotive sensor housing. Material: PA66+GF30, tolerance: 0.01mm, expected production volume: 500,000 shots/year.',
   1, 4000.00, 'replied', DATE_SUB(NOW(), INTERVAL 7 DAY)),
  (14, 13, 33, 26, 'Corporate Gift Sets for Q4 Campaign',
   'Hello, we are looking for customized corporate gift sets for our UK client year-end campaign. Quantity: 500 sets, budget: $25-30/set, delivery needed by November 30.',
   500, 27.00, 'pending', DATE_SUB(NOW(), INTERVAL 2 DAY)),
  (15, 15, 30, 28, 'Smart Band Bulk Order',
   'Interested in your Band X5 for our US retail chain. We need 1000 units for initial trial. If quality meets our standard, we will place a 10,000 unit order quarterly.',
   1000, 20.00, 'pending', NOW());

-- ── 12. 更新工厂综合评分
UPDATE `factories` f
JOIN `factory_ftgi_scores` fs ON f.id = fs.factoryId
JOIN `factory_human_scores` hs ON f.id = hs.factoryId
SET f.overallScore = ROUND((fs.ftgi_score + hs.ftgi_contribution) / 100 * 5, 2)
WHERE f.id IN (10, 11, 12, 13, 14, 15);

-- ── 13. 验证数据插入结果
SELECT '=== 数据验证 ===' AS info;
SELECT '用户总数' AS metric, COUNT(*) AS count FROM users
UNION ALL SELECT '工厂总数', COUNT(*) FROM factories
UNION ALL SELECT '产品总数', COUNT(*) FROM products
UNION ALL SELECT '询盘总数', COUNT(*) FROM inquiries
UNION ALL SELECT 'FTGI评分记录', COUNT(*) FROM factory_ftgi_scores
UNION ALL SELECT '买家评价V2', COUNT(*) FROM factory_reviews_v2
UNION ALL SELECT '人工评分记录', COUNT(*) FROM factory_human_scores
UNION ALL SELECT '工厂认证记录', COUNT(*) FROM factory_certifications;

SELECT '=== FTGI 评分排行 ===' AS info;
SELECT 
  f.name AS factory_name, 
  fs.ftgi_score AS ai_contribution,
  hs.ftgi_contribution AS human_contribution,
  ROUND(fs.ftgi_score + hs.ftgi_contribution, 2) AS total_ftgi,
  CASE 
    WHEN (fs.ftgi_score + hs.ftgi_contribution) >= 90 THEN '铂金'
    WHEN (fs.ftgi_score + hs.ftgi_contribution) >= 75 THEN '黄金'
    WHEN (fs.ftgi_score + hs.ftgi_contribution) >= 60 THEN '白银'
    ELSE '青铜'
  END AS ftgi_tier
FROM factories f
JOIN factory_ftgi_scores fs ON f.id = fs.factoryId
JOIN factory_human_scores hs ON f.id = hs.factoryId
ORDER BY total_ftgi DESC;

SET FOREIGN_KEY_CHECKS = 1;
SELECT '✅ 种子数据插入完成！' AS result;
