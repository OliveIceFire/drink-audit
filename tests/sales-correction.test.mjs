import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

test('销售覆盖记录只保留来源摘要且最多保留近 20 条',()=>{
  const full=fs.readFileSync(new URL('../sales-import.js',import.meta.url),'utf8');
  const source=full.slice(0,full.indexOf('function importMeituanSales'))+'\nglobalThis.__record=recordSalesCorrection;globalThis.__records=salesCorrectionRecords;';
  const values=new Map();
  const localStorage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,String(value))};
  const context={STORE:'audit',currentDate:'2026-09-27',rows:[],n:value=>Number(value)||0,localStorage,Date:class extends Date {static now(){return 0}},globalThis:null};
  context.globalThis=context;
  vm.createContext(context);
  vm.runInContext(source,context);
  for(let index=0;index<22;index++)context.__record({fingerprint:'old-'+index,sourceText:'不要存入更正摘要',items:1,total:2},{fingerprint:'new-'+index,sourceText:'也不要存入更正摘要',items:3,total:4});
  const records=JSON.parse(JSON.stringify(context.__records()));
  assert.equal(records.length,20);
  assert.equal(records[0].previous.fingerprint,'old-2');
  assert.equal(records.at(-1).replacement.fingerprint,'new-21');
  assert.equal('sourceText' in records[0].previous,false);
  assert.equal('sourceText' in records[0].replacement,false);
});
