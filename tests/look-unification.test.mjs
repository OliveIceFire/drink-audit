import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function setup(){
  const values=new Map(),localStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value))};
  const context=vm.createContext({localStorage,document:{getElementById(){return null}},innerWidth:1024});
  vm.runInContext(fs.readFileSync(new URL('../core.js',import.meta.url),'utf8')+'\n'+fs.readFileSync(new URL('../drink.js',import.meta.url),'utf8')+'\n'+fs.readFileSync(new URL('../audit-preview.js',import.meta.url),'utf8')+'\nglobalThis.api={BASE,unifyDrinkRows,saved,key,actualEntryKey,parseFeishuRemainingPaste};',context);
  return {api:context.api,localStorage};
}
test('目录仅有一个 LOOK；合并保留瓶数、销量与凌晨回加且可重复读取',()=>{
  const {api}=setup();
  assert.equal(api.BASE.length,25);
  assert.equal(api.BASE.filter(row=>row.name==='LOOK').length,1);
  assert.equal(api.BASE.some(row=>row.name==='光明酸奶'),false);
  const rows=api.unifyDrinkRows([{name:'光明酸奶',start:8,caseSize:12,cases:1,sales:4,actual:4,afterSales:2},{name:'LOOK',start:2,caseSize:24,cases:1,sales:1,actual:3,openTable:1}]);
  assert.equal(rows[0].start,10);
  assert.equal(rows[0].cases*rows[0].caseSize,36);
  assert.equal(rows[0].sales,5);
  assert.equal(rows[0].actual,7);
  assert.equal(rows[0].afterSales,2);
  assert.equal(rows[0].openTable,1);
  assert.equal(JSON.stringify(api.unifyDrinkRows(rows)),JSON.stringify(rows));
});
test('旧日盘先保留原始备份并取消酸奶实盘确认，其他品项不受影响',()=>{
  const {api,localStorage}=setup(),date='2026-09-28',raw=JSON.stringify([{name:'光明酸奶',actual:4,caseSize:12},{name:'LOOK',actual:0,caseSize:24}]);
  localStorage.setItem(api.key(date),raw);
  localStorage.setItem(api.actualEntryKey(date),JSON.stringify(['LOOK','光明酸奶','青岛']));
  assert.equal(api.saved(date)[0].name,'LOOK');
  assert.equal(localStorage.getItem(api.key(date)+'-before-look-merge'),raw);
  assert.deepEqual(JSON.parse(localStorage.getItem(api.actualEntryKey(date))),['青岛']);
});
test('旧26行飞书余量保留位置并合并酸奶，当前25行顺序不变',()=>{
  const {api}=setup();
  const legacy=api.parseFeishuRemainingPaste(Array.from({length:26},(_,i)=>String(i+1)).join('\n'));
  assert.equal(legacy.length,25);
  assert.equal(legacy[20],47);
  assert.equal(legacy[21],22);
  assert.equal(legacy[24],25);
  const current=api.parseFeishuRemainingPaste(Array.from({length:25},(_,i)=>String(i+1)).join('\n'));
  assert.equal(current[20],21);
});
