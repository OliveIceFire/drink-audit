import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

async function loadOrder(){
  const source=await readFile(new URL('../order.js',import.meta.url),'utf8');
  const storage=new Map();
  const context={BASE:[{name:'青岛',caseSize:12},{name:'雪花纯生',caseSize:12},{name:'椰子水',caseSize:15},{name:'30白啤',caseSize:6}],n:value=>Number(value)||0,TODAY:'2026-09-28',shiftDate:()=> '2026-09-27',key:date=>'audit-'+date,localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)},document:{getElementById:()=>null}};
  vm.createContext(context);vm.runInContext(source,context);return context;
}

test('普通酒水不足五件但次日会断货时补足可送的五件',async()=>{
  const order=await loadOrder();
  const profile={factor:1,label:'工作日'};
  const plan=order.orderPlan([{name:'青岛',best:42,current:0,caseSize:12},{name:'雪花纯生',best:48,current:100,caseSize:12}],5,profile);
  assert.equal(plan.needed,4);
  assert.equal(plan.total,5);
  assert.equal(plan.status,'可下单（防断货凑单）');
  assert.equal(plan.lines.reduce((sum,line)=>sum+order.totalCases(line),0),5);
});

test('未达最低起送量且次日不断货时建议等待凑单',async()=>{
  const order=await loadOrder();
  const plan=order.orderPlan([{name:'青岛',best:42,current:31,caseSize:12}],5,{factor:1,label:'工作日'});
  assert.equal(plan.needed,1);
  assert.equal(plan.total,0);
  assert.equal(plan.status,'建议等待凑单');
});

test('周末目标库存高于工作日目标，特殊合单最低两件',async()=>{
  const order=await loadOrder();
  const row={name:'椰子水',best:15,current:0,caseSize:15};
  assert.equal(order.targetStock(row,{factor:1,label:'工作日'}),15);
  assert.equal(order.targetStock(row,{factor:1.25,label:'周末'}),19);
  const plan=order.orderPlan([row,{name:'30白啤',best:18,current:18,caseSize:6}],2,{factor:1,label:'工作日'});
  assert.equal(plan.total,2);
  assert.equal(plan.status,'可下单（防断货凑单）');
});
