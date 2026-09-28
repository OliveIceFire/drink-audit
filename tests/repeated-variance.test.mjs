import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

test('管理端只统计当前日前连续存在的同品项差异',()=>{
  const source=fs.readFileSync(new URL('../management.js',import.meta.url),'utf8').replace(/\nrenderManagementOverview\(\);\s*$/,'')+'\nglobalThis.__streak=consecutiveVarianceDays;';
  const records=new Map([
    ['audit-2026-09-24',JSON.stringify([{name:'青岛',variance:1}])],
    ['audit-2026-09-25',JSON.stringify([{name:'青岛',variance:2}])],
    ['audit-2026-09-26',JSON.stringify([{name:'青岛',variance:0}])],
  ]);
  const context={currentDate:'2026-09-27',localStorage:{getItem:key=>records.get(key)||null},key:date=>'audit-'+date,savedBusinessDates:()=>['2026-09-24','2026-09-25','2026-09-26'],missing:row=>row.variance,globalThis:null};
  context.globalThis=context;
  vm.createContext(context);
  vm.runInContext(source,context);
  assert.equal(context.__streak('青岛'),0);
  records.set('audit-2026-09-26',JSON.stringify([{name:'青岛',variance:-1}]));
  assert.equal(context.__streak('青岛'),3);
});
