import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';

test('凌晨已结账与未结账桌取酒会加回前一营业日核账余量', () => {
  const source=fs.readFileSync(new URL('../core.js',import.meta.url),'utf8')+';globalThis.__formula={theory,reconciledActual,missing};';
  const context={document:{},localStorage:{getItem(){return null},setItem(){}},globalThis:null};
  context.globalThis=context;
  vm.createContext(context);
  vm.runInContext(source,context);
  const row={start:100,cases:1,caseSize:12,sales:20,actual:70,afterSales:5,openTable:3};
  assert.equal(context.__formula.theory(row),92);
  assert.equal(context.__formula.reconciledActual(row),78);
  assert.equal(context.__formula.missing(row),14);
});

test('旧数据没有凌晨字段时仍按零处理', () => {
  const source=fs.readFileSync(new URL('../core.js',import.meta.url),'utf8')+';globalThis.__formula={reconciledActual,missing};';
  const context={document:{},localStorage:{getItem(){return null},setItem(){}},globalThis:null};
  context.globalThis=context;
  vm.createContext(context);
  vm.runInContext(source,context);
  const oldRow={start:10,cases:0,caseSize:12,sales:4,actual:6};
  assert.equal(context.__formula.reconciledActual(oldRow),6);
  assert.equal(context.__formula.missing(oldRow),0);
});
