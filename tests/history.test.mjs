import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

test('历史记录只列出已保存的营业日，不混入草稿和实盘确认内部键',()=>{
  const source=fs.readFileSync(new URL('../drink.js',import.meta.url),'utf8')+';globalThis.__savedBusinessDates=savedBusinessDates;';
  const values=new Map([
    ['store-2026-09-27','[]'],
    ['store-2026-09-26','[]'],
    ['store-draft-2026-09-27','[]'],
    ['store-actual-entered-2026-09-27','[]'],
    ['store-saved-actual-entered-2026-09-27','[]'],
  ]);
  const localStorage={get length(){return values.size},key:index=>[...values.keys()][index],getItem:key=>values.get(key)||null};
  const context={STORE:'store',localStorage,globalThis:null};
  context.globalThis=context;
  vm.createContext(context);
  vm.runInContext(source,context);
  assert.deepEqual(JSON.parse(JSON.stringify(context.__savedBusinessDates())),['2026-09-26','2026-09-27']);
});
