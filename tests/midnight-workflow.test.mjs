import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

test('零点核账将凌晨已结账与开台取酒作为回加，不改写昨天销量',async()=>{
  const source=await readFile(new URL('../overnight.js',import.meta.url),'utf8');
  assert.match(source,/零点核账余量 = 实物剩余 \+ 00点后已结账 \+ 开台已拿酒/);
  assert.match(source,/期初 \+ 进货 − 昨天销量 − 零点核账余量/);
  assert.match(source,/row\[field\]=result\.matched\[row\.name\]/);
  assert.doesNotMatch(source,/row\.sales=/);
});

test('零点核账入口提供前日完整销量与零点后已结账的美团查询按钮',async()=>{
  const source=await readFile(new URL('../overnight.js',import.meta.url),'utf8');
  assert.match(source,/打开美团导出昨天完整销量/);
  assert.match(source,/打开美团查询今天00点后已结账/);
  assert.match(source,/function openMeituanSalesReport\(period\)/);
});
