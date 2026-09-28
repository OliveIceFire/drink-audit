-- 首次试点初始化：在已执行 schema.sql 后，以项目管理员身份执行一次。
-- 可重复执行；不会覆盖任何既有盘查记录。

insert into stores (name)
values ('马厂老火锅（古美店上海76店）')
on conflict (name) do nothing;

insert into drink_products (canonical_name, case_size) values
  ('雪花纯生', 12),
  ('超级勇闯', 12),
  ('百威', 12),
  ('喜力', 12),
  ('老雪花', 12),
  ('青岛', 12),
  ('乌毡帽', 6),
  ('大窑荔爱', 12),
  ('大窑橙诺', 12),
  ('北冰洋', 24),
  ('听可乐', 24),
  ('听雪碧', 24),
  ('无糖可乐', 24),
  ('王老吉', 24),
  ('果粒橙', 12),
  ('大可乐', 12),
  ('大雪碧', 12),
  ('矿泉水', 24),
  ('唯怡豆奶', 20),
  ('椰子水', 15),
  ('光明酸奶', 12),
  ('30白啤', 6),
  ('力波白啤', 6),
  ('小郎酒', 24),
  ('古越龙山', 12),
  ('LOOK', 24)
on conflict (canonical_name) do update set case_size = excluded.case_size, active = true;

-- 美团管家“酒水饮料”销售名称 → 系统统一品名。
-- 未确认的商品不在此处猜测映射，避免把销量记到错误酒水。
insert into drink_product_aliases (alias, product_id)
select v.alias, p.id
from (values
  ('雪花纯生', '雪花纯生'),
  ('超级勇闯', '超级勇闯'),
  ('百威', '百威'),
  ('喜力', '喜力'),
  ('老雪花', '老雪花'),
  ('青岛1903', '青岛'),
  ('大窑荔爱', '大窑荔爱'),
  ('大窑橙诺', '大窑橙诺'),
  ('听北冰洋', '北冰洋'),
  ('听可乐', '听可乐'),
  ('听雪碧', '听雪碧'),
  ('无糖可乐', '无糖可乐'),
  ('王老吉', '王老吉'),
  ('果粒橙', '果粒橙'),
  ('大可乐', '大可乐'),
  ('大雪碧', '大雪碧'),
  ('哇哈哈纯净水', '矿泉水'),
  ('唯怡豆奶', '唯怡豆奶'),
  ('椰子水', '椰子水'),
  ('光明LOOK酸奶300克', 'LOOK'),
  ('鲜啤30公里白啤', '30白啤'),
  ('上海力波精酿白啤1L', '力波白啤'),
  ('古越龙山黄酒', '古越龙山')
) as v(alias, canonical_name)
join drink_products p on p.canonical_name = v.canonical_name
on conflict (alias) do update set product_id = excluded.product_id;

-- 执行后复制该 id 到 cloud-config.js 的 storeId 字段；不要把任何密钥提交到 Git。
select id, name from stores where name = '马厂老火锅（古美店上海76店）';
