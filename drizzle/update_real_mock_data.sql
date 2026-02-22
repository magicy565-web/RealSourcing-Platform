-- 更新工厂信息为真实数据 (针对正确的 ID)

-- 1. 广州极联智能科技有限公司 (ID: 10)
UPDATE factories SET 
    name = '广州极联智能科技有限公司',
    description = '成立于2014年，极联智能（Geeklink）是一家专注于智能家居自动化领域的研发型企业。公司位于广州大学城国家数字家庭应用示范基地，致力于提供包括智能中控、安防监控、环境监测在内的全屋智能解决方案。',
    city = '广州',
    category = '智能家居',
    coverImage = '/images/factories/geeklink_product_1.webp'
WHERE id = 10;

-- 2. 深圳立秀运动科技有限公司 (ID: 11)
UPDATE factories SET 
    name = '深圳立秀运动科技有限公司',
    description = '成立于2018年，立秀运动（Leadshow）是一家专业的运动服装制造商。公司专注于高品质女性瑜伽服、运动套装及功能性面料的研发生产，拥有严格的质量控制体系和专业的ODM/OEM定制服务能力。',
    city = '深圳',
    category = '运动装备',
    coverImage = '/images/factories/leadshow_factory_1.webp'
WHERE id = 11;

-- 3. 上海鸿毅实业有限公司 (ID: 12)
UPDATE factories SET 
    name = '上海鸿毅实业有限公司',
    description = '位于上海闵行区，鸿毅实业是一家专业的美妆产品ODM/OEM服务商。公司提供从产品研发、包装设计到成品制造的一站式解决方案，主营彩妆盒、口红管及各类化妆品包材，拥有完整的供应链控制能力。',
    city = '上海',
    category = '美妆个护',
    coverImage = '/images/factories/hongyi_cosmetic_1.webp'
WHERE id = 12;

-- 4. 东莞市源杰工艺礼品有限公司 (ID: 13)
UPDATE factories SET 
    name = '东莞市源杰工艺礼品有限公司',
    description = '成立于2016年，源杰工艺专注于金属及塑胶礼品的生产。主营产品包括徽章、钥匙扣、高尔夫球标、奖牌及纪念币等。公司拥有先进的压铸和珐琅工艺，为全球品牌提供高品质的促销及纪念礼品。',
    city = '东莞',
    category = '礼品工艺',
    coverImage = '/images/factories/yuanjie_gift_1.webp'
WHERE id = 13;

-- 5. 宁波PM模具有限公司 (ID: 14)
UPDATE factories SET 
    name = '宁波PM模具有限公司',
    description = '拥有17年精密模具制造经验，宁波PM模具专注于塑料注塑模具和金属模具的设计与制造。公司为全球客户提供高精度的汽车配件、医疗器械及电子产品模具，是行业领先的定制化制造供应商。',
    city = '宁波',
    category = '精密模具',
    coverImage = '/images/factories/pm_mold_product_1.webp'
WHERE id = 14;

-- 6. 杭州灵伴科技有限公司 (ID: 15)
UPDATE factories SET 
    name = '杭州灵伴科技有限公司',
    description = 'Rokid成立于2014年，是一家专注于人机交互技术的科技公司。公司致力于AR眼镜和人工智能软硬件产品的研发，其最新推出的Rokid Glasses是全球首款量产的消费级AI+AR眼镜，引领智能穿戴技术新趋势。',
    city = '杭州',
    category = '穿戴科技',
    coverImage = '/images/factories/rokid_glasses.jpg'
WHERE id = 15;

-- 更新产品信息
UPDATE products SET name = 'Geeklink Thinker 智能中控', description = '支持iOS/Android远程控制，集成WiFi/红外/射频控制功能。' WHERE factoryId = 10;
UPDATE products SET name = '专业无缝瑜伽套装', description = '高弹透气面料，人体工学设计，适合高强度运动。' WHERE factoryId = 11;
UPDATE products SET name = '哑光丝绒口红系列', description = '持久显色，不沾杯配方，多种流行色号可选。' WHERE factoryId = 12;
UPDATE products SET name = '定制珐琅金属徽章', description = '精细烤漆工艺，金属质感，支持企业Logo定制。' WHERE factoryId = 13;
UPDATE products SET name = '高精度注塑模具', description = '采用优质模具钢，精度达0.01mm，支持复杂结构定制。' WHERE factoryId = 14;
UPDATE products SET name = 'Rokid Glasses AI+AR眼镜', description = '仅重49克，集成实时翻译、智能提醒及物体识别功能。' WHERE factoryId = 15;
