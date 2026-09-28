import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function parser(){
  const source=fs.readFileSync(new URL('../overnight.js',import.meta.url),'utf8')+';globalThis.__parse=parseOvernightQuantities;';
  const context={rows:[],n:value=>Number(value)||0,document:{getElementById(){return null}},globalThis:null};
  context.globalThis=context;
  vm.createContext(context);
  vm.runInContext(source,context);
  return context.__parse;
}

test('凌晨快速粘贴仅接收统一品名和非负数量',()=>{
  const parse=parser();
  const result=parse('听可乐 2\n青岛：1\n未知酒水 3\n坏格式',[{name:'听可乐'},{name:'青岛'}]);
  assert.deepEqual(JSON.parse(JSON.stringify(result.matched)),{听可乐:2,青岛:1});
  assert.deepEqual(JSON.parse(JSON.stringify(result.unmatched)),['未知酒水']);
  assert.deepEqual(JSON.parse(JSON.stringify(result.invalid)),['坏格式']);
});
