import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

test('飞书剩余库存导入按完整 26 项目录校验',()=>{
  const source=fs.readFileSync(new URL('../audit-preview.js',import.meta.url),'utf8')+';globalThis.__parse=parseFeishuRemainingPaste;globalThis.__names=PASTE_ROW_NAMES;';
  const base=Array.from({length:26},(_,index)=>({name:'品项'+(index+1)}));
  const context={BASE:base,document:{getElementById(){return null}},globalThis:null};
  context.globalThis=context;
  vm.createContext(context);
  vm.runInContext(source,context);
  const values=Array.from({length:26},(_,index)=>String(index+1)).join('\n');
  assert.equal(context.__names.length,26);
  assert.deepEqual(JSON.parse(JSON.stringify(context.__parse(values))),Array.from({length:26},(_,index)=>index+1));
});

test('跨设备导入拒绝非有限数、负数与零箱规',()=>{
  const source=fs.readFileSync(new URL('../sync.js',import.meta.url),'utf8');
  assert.match(source,/function importQuantity\(value,\{positive=false\}=\{\}\)\{const parsed=Number\(value\);if\(!Number\.isFinite\(parsed\)\|\|parsed<0\|\|\(positive&&parsed<=0\)\)throw Error\('quantity'\)/);
  assert.match(source,/caseSize:importQuantity\(row\.caseSize,\{positive:true\}\)/);
  const context={};
  vm.createContext(context);
  vm.runInContext(source.slice(0,source.indexOf('async function importAuditPackage')),context);
  assert.equal(context.importQuantity('2.5'),2.5);
  assert.throws(()=>context.importQuantity('Infinity'));
  assert.throws(()=>context.importQuantity(-1));
  assert.throws(()=>context.importQuantity(0,{positive:true}));
});
