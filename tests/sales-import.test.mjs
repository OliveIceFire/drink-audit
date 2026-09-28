import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

async function loadImporter(){
  const source=await readFile(new URL('../sales-import.js',import.meta.url),'utf8');
  const context={STORE:'test',rows:[{name:'青岛'},{name:'听可乐'},{name:'力波白啤'},{name:'LOOK'}],n:value=>Number(value)||0,localStorage:{getItem:()=>null},document:{getElementById:()=>null,querySelector:()=>null}};
  vm.createContext(context);
  vm.runInContext(source,context);
  return context;
}

test('美团名称映射到统一酒水品名',async()=>{
  const importer=await loadImporter();
  const result=importer.parseMeituanSales('青岛1903 9\n听可乐 13\n上海力波精酿白啤1L 5\n光明LOOK酸奶300克 8');
  assert.deepEqual({...result.matched},{'青岛':9,'听可乐':13,'力波白啤':5,'LOOK':8});
  assert.deepEqual([...result.unmatched],[]);
  assert.equal(result.total,35);
});

test('未知美团品项不会被静默映射',async()=>{
  const importer=await loadImporter();
  const result=importer.parseMeituanSales('古法酸梅汁400Ml 24\n青岛1903 9');
  assert.deepEqual({...result.matched},{'青岛':9});
  assert.deepEqual([...result.unmatched],['古法酸梅汁400Ml']);
});

test('光明酸奶及常见 LOOK 名称统一映射到 LOOK',async()=>{
  const importer=await loadImporter();
  const result=importer.parseMeituanSales('光明酸奶 2\n光明LOOK酸奶300克 3\nLOOK酸奶 1');
  assert.deepEqual({...result.matched},{LOOK:6});
  assert.deepEqual([...result.unmatched],[]);
});

test('美团完整品项报表只提取已映射酒水，并阻止未知饮料',async()=>{
  const importer=await loadImporter();
  const result=importer.parseMeituanReportRows([
    {name:'雪花纯生',quantity:'12.0'},
    {name:'听可乐',quantity:'11.0'},
    {name:'手切吊龙★必点',quantity:'45.0'},
    {name:'（新品）古法酸梅汁400Ml',quantity:'11.0'}
  ]);
  assert.deepEqual({...result.matched},{'雪花纯生':12,'听可乐':11});
  assert.equal(result.total,23);
  assert.deepEqual([...result.unmatched],['（新品）古法酸梅汁400Ml']);
});

test('美团导出文件必须在文件内声明单个营业日和标准销量列',async()=>{
  const source=await readFile(new URL('../sales-import.js',import.meta.url),'utf8');
  assert.match(source,/营业日期【/);
  assert.match(source,/row\.includes\('菜品名称'\).*row\.includes\('销售数量'\)/);
  assert.match(source,/if\(report\.start!==report\.end\)throw Error\('xlsx_date_range_invalid'\)/);
  assert.match(source,/source:'meituan_xlsx_export'/);
  assert.match(source,/未匹配的酒水饮料，已阻止写入/);
  assert.match(source,/function saveSalesAlias\(\)/);
  assert.match(source,/function buildBusinessAnalysis\(items\)/);
  assert.match(source,/businessAnalysisKey\(report\.start\)/);
});

test('美团导入要求报表业务日期与系统昨天一致，并保存来源证据',async()=>{
  const source=await readFile(new URL('../sales-import.js',import.meta.url),'utf8');
  assert.match(source,/const input=document\.getElementById\('meituanSalesText'\),dateInput=document\.getElementById\('meituanBusinessDate'\)/);
  assert.match(source,/if\(reportDate!==YESTERDAY\)/);
  assert.match(source,/source:'meituan_text_manual_copy'/);
  assert.match(source,/sourceText,importedAt:new Date\(\)\.toISOString\(\)/);
  assert.match(source,/function cleanSalesSourceText\(value\)/);
  assert.match(source,/function recordSalesCorrection\(previous,replacement\)/);
  assert.match(source,/reason:'manual_full_report_override'/);
  assert.match(source,/section\.querySelector\('#meituanBusinessDate'\)\.value=YESTERDAY/);
});
