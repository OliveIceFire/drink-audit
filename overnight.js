function escapeOvernight(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))}
function parseOvernightQuantities(value,knownRows=rows){
  const matched={},unmatched=[],invalid=[];
  String(value||'').split(/\r?\n/).forEach(line=>{
    const clean=line.trim();if(!clean)return;
    const hit=clean.match(/^(.*?)(?:\s|\t|：|:)+(\d+(?:\.\d+)?)\s*$/);
    if(!hit){invalid.push(clean);return}
    const name=hit[1].trim(),quantity=n(hit[2]),row=knownRows.find(item=>item.name===name);
    if(!row||quantity<0){unmatched.push(name);return}
    matched[row.name]=(matched[row.name]||0)+quantity;
  });
  return {matched,unmatched:[...new Set(unmatched)],invalid};
}
function applyOvernightPaste(field){
  const input=document.getElementById(field==='afterSales'?'afterSalesPaste':'openTablePaste');
  let state=document.getElementById('overnightPasteResult');
  const result=parseOvernightQuantities(input?.value);
  if(result.unmatched.length||result.invalid.length){state.textContent=(result.unmatched.length?'未找到统一品名：'+result.unmatched.join('、')+'。':'')+(result.invalid.length?'请按“品名 空格 数量”逐行填写。':'');return}
  const names=Object.keys(result.matched);
  if(!names.length){state.textContent='没有可写入的回加项。';return}
  rows.forEach(row=>{if(Object.prototype.hasOwnProperty.call(result.matched,row.name))row[field]=result.matched[row.name]});
  persist();render();state=document.getElementById('overnightPasteResult');
  state.textContent='已写入 '+names.length+' 个品项的'+(field==='afterSales'?'00点后已结账':'未结账桌已拿酒')+'数量。';
  toastMsg('凌晨回加项已写入');
}
function updateOvernightAdjustment(index,field,value){if(!rows[index])return;rows[index][field]=n(value);persist();render()}
function openMeituanSalesReport(period){const message=period==='after'?'打开美团后查询今天 00:00 至实盘时的“已结账”酒水；未结账桌的酒水请单独填右侧。':'打开美团后导出昨天 00:00:00–23:59:59 的“品项销售统计” .xlsx，再回到本页导入。';toastMsg(message);window.open('https://pos.meituan.com/web/report/dpaas-report-dishSale#/rms-report/dpaas-report-dishSale/test.itemsalepoi.itemsalepoi_pc','_blank','noopener')}
function renderOvernightAdjustments(){
  const page=document.getElementById('waterPage');if(!page)return;
  let section=document.getElementById('overnightAdjustments');
  if(currentDate!==YESTERDAY){if(section)section.remove();return}
  if(!section){section=document.createElement('section');section.id='overnightAdjustments';section.className='box';page.insertBefore(section,page.firstElementChild)}
  const total=field=>rows.reduce((sum,row)=>sum+n(row[field]),0);
  section.innerHTML='<div class="boxTitle">零点核账与凌晨回加（仅昨天）</div><div class="hint">不管几点实盘，先固定零点口径：昨天销量只取昨天 00:00:00–23:59:59；实盘后发生的“00点后已结账”和“开台已拿酒”只加回零点库存，不会改写昨天销售。</div><div class="rowBtns"><button class="btn" type="button">打开美团导出昨天完整销量</button><button class="btn" type="button">打开美团查询今天00点后已结账</button></div><div class="grid2"><div class="field"><label>快速粘贴：00点后至实盘时已结账</label><textarea id="afterSalesPaste" placeholder="听可乐 2&#10;青岛 1"></textarea><button class="btn blue" type="button">写入已结账回加</button></div><div class="field"><label>快速粘贴：实盘时仍开台已拿酒</label><textarea id="openTablePaste" placeholder="百威 1&#10;力波白啤 2"></textarea><button class="btn blue" type="button">写入开台取酒回加</button></div></div><div id="overnightPasteResult" class="result">实盘公式：零点核账余量 = 实物剩余 + 00点后已结账 + 开台已拿酒。再用“期初 + 进货 − 昨天销量 − 零点核账余量”检查漏单。</div><div class="result">当前零点核账余量 = 实物剩余 '+total('actual')+' + 过0点已结账 '+total('afterSales')+' + 未结账桌已拿酒 '+total('openTable')+' = '+rows.reduce((sum,row)=>sum+reconciledActual(row),0)+' 瓶</div><div style="overflow:auto"><table><thead><tr><th>品名</th><th>实物剩余</th><th>00点后已结账</th><th>未结账桌已拿酒</th><th>零点核账余量</th></tr></thead><tbody>'+rows.map((row,index)=>'<tr><td>'+escapeOvernight(row.name)+'</td><td>'+n(row.actual)+'</td><td><input inputmode="numeric" value="'+n(row.afterSales)+'" data-overnight="afterSales" data-index="'+index+'"></td><td><input inputmode="numeric" value="'+n(row.openTable)+'" data-overnight="openTable" data-index="'+index+'"></td><td class="auto">'+reconciledActual(row)+'</td></tr>').join('')+'</tbody></table></div>';
  const buttons=section.querySelectorAll('button');buttons[0].addEventListener('click',()=>openMeituanSalesReport('before'));buttons[1].addEventListener('click',()=>openMeituanSalesReport('after'));buttons[2].addEventListener('click',()=>applyOvernightPaste('afterSales'));buttons[3].addEventListener('click',()=>applyOvernightPaste('openTable'));
  section.querySelectorAll('input[data-overnight]').forEach(input=>input.addEventListener('change',event=>updateOvernightAdjustment(Number(event.currentTarget.dataset.index),event.currentTarget.dataset.overnight,event.currentTarget.value)));
}
if(document.getElementById('waterPage'))renderOvernightAdjustments();
