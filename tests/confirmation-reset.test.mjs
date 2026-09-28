import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function storage(){
  const values=new Map();
  return {getItem:key=>values.has(key)?values.get(key):null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)};
}

test('重置无保存日盘会清除旧的实盘确认，避免未重盘数据被提交',()=>{
  const source=fs.readFileSync(new URL('../core.js',import.meta.url),'utf8')+'\n'+fs.readFileSync(new URL('../drink.js',import.meta.url),'utf8')+'\ncurrentDate="2026-09-02";localStorage.setItem(actualEntryKey(currentDate),JSON.stringify(["雪花纯生"]));render=()=>{};toastMsg=()=>{};globalThis.__reset=resetCurrent;globalThis.__actualKey=actualEntryKey;';
  const localStorage=storage();
  const context={document:{},localStorage,innerWidth:1024,globalThis:null};
  context.globalThis=context;
  vm.createContext(context);
  vm.runInContext(source,context);
  context.__reset();
  assert.equal(localStorage.getItem(context.__actualKey('2026-09-02')),null);
});

test('保存日盘会保存实盘确认快照，重置后恢复该快照',()=>{
  const source=fs.readFileSync(new URL('../core.js',import.meta.url),'utf8')+'\n'+fs.readFileSync(new URL('../drink.js',import.meta.url),'utf8')+'\ncurrentDate="2026-09-02";rows=[{name:"雪花纯生",start:1,cases:0,caseSize:12,sales:0,actual:1}];localStorage.setItem(actualEntryKey(currentDate),JSON.stringify(["雪花纯生"]));render=()=>{};toastMsg=()=>{};globalThis.__save=saveDay;globalThis.__reset=resetCurrent;globalThis.__actualKey=actualEntryKey;';
  const localStorage=storage();
  const context={document:{},localStorage,innerWidth:1024,globalThis:null};
  context.globalThis=context;
  vm.createContext(context);
  vm.runInContext(source,context);
  context.__save();
  localStorage.setItem(context.__actualKey('2026-09-02'),JSON.stringify([]));
  context.__reset();
  assert.deepEqual(JSON.parse(localStorage.getItem(context.__actualKey('2026-09-02'))),['雪花纯生']);
});
