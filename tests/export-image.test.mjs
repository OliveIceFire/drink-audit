import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('导出图片使用核账余量，并保留凌晨回加汇总',()=>{
  const source=fs.readFileSync(new URL('../drink.js',import.meta.url),'utf8');
  assert.match(source,/const W=1360/);
  assert.doesNotMatch(source,/const W=1180/);
  assert.match(source,/\['凌晨回加',sum\(r=>n\(r\.afterSales\)\+n\(r\.openTable\)\)\]/);
  assert.match(source,/\['核账余量',sum\(reconciledActual\)\]/);
  assert.match(source,/vals=\[r\.name,n\(r\.start\),incoming\(r\),reconciledActual\(r\)/);
});

test('云端配置脚本使用独立版本参数，避免被旧 Service Worker 缓存',()=>{
  const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const worker=fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8');
  assert.match(index,/cloud-config\.js\?v=20260927a/);
  assert.match(index,/drink\.js\?v=20260928a/);
  assert.match(index,/audit-preview\.js\?v=20260928b/);
  assert.match(worker,/drink-audit-v27/);
  const cloud=fs.readFileSync(new URL('../cloud.js',import.meta.url),'utf8');
  assert.match(cloud,/management\.js\?v=20260928c/);
  assert.match(cloud,/sales-import\.js\?v=20260928e/);
  assert.match(index,/cloud\.js\?v=20260928e/);
  assert.match(index,/order\.js\?v=20260928a/);
  assert.match(cloud,/overnight\.js\?v=20260928a/);
});

test('日盘表只允许填写实物剩余，期初和销量为自动显示',()=>{
  const source=fs.readFileSync(new URL('../drink.js',import.meta.url),'utf8');
  const daily=source.slice(source.indexOf('function renderDaily'),source.indexOf('function renderPack'));
  assert.match(daily,/td class="auto">\$\{n\(r\.start\)\}/);
  assert.match(daily,/td class="auto">\$\{n\(r\.sales\)\}/);
  assert.match(daily,/input\(\$\{i\},'actual',this\.value\)/);
  assert.doesNotMatch(daily,/input\(\$\{i\},'(start|sales)',this\.value\)/);
});
