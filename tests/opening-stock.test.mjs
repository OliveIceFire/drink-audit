import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

test('新一天初始库存继承上一日核账余量，而非仅继承凌晨实物', () => {
  const source=fs.readFileSync(new URL('../drink.js',import.meta.url),'utf8')+';previousRows=()=>[{name:"听可乐",actual:70,afterSales:5,openTable:3,caseSize:12}];globalThis.__fresh=freshFromPrevious;';
  const context={BASE:[],STORE:'test',DUCK_STORE:'duck',localStorage:{getItem(){return null}},shiftDate(){return 'x'},saved(){return null},draft(){return null},clone:value=>JSON.parse(JSON.stringify(value)),n:value=>Number(value)||0,reconciledActual:row=>(Number(row.actual)||0)+(Number(row.afterSales)||0)+(Number(row.openTable)||0),document:{},innerWidth:1024};
  context.globalThis=context;
  vm.createContext(context);
  vm.runInContext(source,context);
  const [row]=context.__fresh('2026-09-27');
  assert.equal(row.start,78);
  assert.equal(row.actual,0);
  assert.equal(row.afterSales,0);
  assert.equal(row.openTable,0);
});
