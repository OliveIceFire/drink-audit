function escapeOverview(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))}
function savedRowsForOverview(date){try{const value=localStorage.getItem(key(date));return value?JSON.parse(value):null}catch{return null}}
function consecutiveVarianceDays(name){const dates=(typeof savedBusinessDates==='function'?savedBusinessDates():[]).filter(date=>date<currentDate).reverse();let days=0;for(const date of dates){const row=savedRowsForOverview(date)?.find(item=>item?.name===name);if(!row||missing(row)===0)break;days++}return days}
function renderManagementOverview(){
  const page=document.getElementById('syncPage');if(!page)return;
  let section=document.getElementById('managementOverview');
  if(!section){section=document.createElement('section');section.id='managementOverview';section.className='box';page.appendChild(section)}
  const entered=typeof actualEntryCount==='function'?actualEntryCount():0;
  const sales=rows.reduce((sum,row)=>sum+n(row.sales),0);
  const afterSales=rows.reduce((sum,row)=>sum+n(row.afterSales),0);
  const openTables=rows.reduce((sum,row)=>sum+n(row.openTable),0);
  const adjustments=afterSales+openTables;
  const anomalies=rows.map(row=>({...row,variance:missing(row),reconciled:reconciledActual(row),streak:1+consecutiveVarianceDays(row.name)})).filter(row=>row.variance!==0).sort((a,b)=>b.streak-a.streak||Math.abs(b.variance)-Math.abs(a.variance));
  const repeated=anomalies.filter(row=>row.streak>=2);
  const sourceRecord=typeof salesImportRecord==='function'?salesImportRecord(currentDate):null;
  const corrections=typeof salesCorrectionRecords==='function'?salesCorrectionRecords(currentDate):[];
  const business=typeof businessAnalysisRecord==='function'?(businessAnalysisRecord(currentDate)||businessAnalysisRecord(YESTERDAY)):null;
  const salesSource=sourceRecord?('美团销量 '+(sourceRecord.items??'?')+' 项 / '+(sourceRecord.total??'?')+' 瓶'):'尚未导入完整美团销量';
  const tips=[];
  if(entered<rows.length)tips.push('还有 '+(rows.length-entered)+' 个品项未明确实盘，暂不能提交。');
  if(adjustments)tips.push('凌晨回加 '+adjustments+' 瓶：已结账 '+afterSales+'，未结账桌 '+openTables+'。');
  if(anomalies.length)tips.push('发现 '+anomalies.length+' 个差异品项，优先核对差异绝对值最大的项目。');
  if(repeated.length)tips.push('连续异常：'+repeated.slice(0,3).map(row=>row.name+' '+row.streak+' 日').join('、')+'，建议指定负责人追踪。');
  if(corrections.length)tips.push('本日存在 '+corrections.length+' 条销量人工覆盖记录，复核时请同时查看来源明细。');
  if(business)tips.push('已读取美团完整经营报表：'+business.items+' 个品项，销售额 ¥'+business.sales.toFixed(2)+'，优惠 ¥'+business.discount.toFixed(2)+'。');
  if(!anomalies.length&&entered===rows.length)tips.push('本日已完成实盘确认，暂无库存差异。');
  const rowsHtml=anomalies.slice(0,8).map(row=>'<tr><td>'+escapeOverview(row.name)+'</td><td>'+row.sales+'</td><td>'+n(row.actual)+'</td><td>'+n(row.afterSales)+n(row.openTable)+'</td><td>'+row.reconciled+'</td><td class="bad">'+row.variance+'</td><td class="'+(row.streak>=2?'bad':'')+'">'+(row.streak>=2?row.streak+' 日':'—')+'</td></tr>').join('');
  const insightTable=(title,items,field)=>'<div class="boxTitle" style="margin-top:16px">'+title+'</div><div class="tablewrap"><table class="sheet"><thead><tr><th>品项</th><th>销量</th><th>销售额</th><th>销售收入</th><th>优惠</th></tr></thead><tbody>'+items.map(item=>'<tr><td>'+escapeOverview(item.name)+'</td><td>'+item.quantity+'</td><td>¥'+item.sales.toFixed(2)+'</td><td>¥'+item.income.toFixed(2)+'</td><td class="'+(item.discount?'bad':'')+'">¥'+item.discount.toFixed(2)+'</td></tr>').join('')+'</tbody></table></div>';
  const businessHtml=business?'<div class="boxTitle" style="margin-top:16px">美团整店销售分析（'+escapeOverview(business.businessDate)+'）</div><div class="summary"><div class="card">销售品项<strong>'+business.items+'</strong></div><div class="card">销售数量<strong>'+business.quantity+'</strong></div><div class="card">销售额<strong>¥'+business.sales.toFixed(0)+'</strong></div><div class="card">实收<strong>¥'+business.income.toFixed(0)+'</strong></div><div class="card">优惠<strong>¥'+business.discount.toFixed(0)+'</strong></div></div>'+insightTable('销售额 TOP 5',business.topSales,'sales')+insightTable('优惠金额 TOP 5（优先复核）',business.topDiscount,'discount'):'';
  section.innerHTML='<div class="boxTitle">管理端总览</div><div class="summary"><div class="card">已盘点<strong>'+entered+'/'+rows.length+'</strong></div><div class="card">昨日销量<strong>'+sales+'</strong></div><div class="card">凌晨回加<strong>'+adjustments+'</strong></div><div class="card">异常品项<strong>'+anomalies.length+'</strong></div><div class="card">连续异常<strong>'+repeated.length+'</strong></div><div class="card">销量更正<strong>'+corrections.length+'</strong></div><div class="card">销售来源<strong style="font-size:13px">'+salesSource+'</strong></div></div><div class="hint">'+tips.map(escapeOverview).join(' ')+'</div>'+(anomalies.length?'<div class="tablewrap"><table class="sheet"><thead><tr><th>优先核对品项</th><th>昨日销量</th><th>实物</th><th>凌晨回加</th><th>核账余量</th><th>差异</th><th>连续异常</th></tr></thead><tbody>'+rowsHtml+'</tbody></table></div>':'')+businessHtml+'<div class="rowBtns"><button class="btn" type="button">刷新总览</button></div>';
  section.querySelector('button').addEventListener('click',renderManagementOverview);
}
renderManagementOverview();
