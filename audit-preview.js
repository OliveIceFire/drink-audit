let pendingAuditImport=null;

function auditPreviewInput(name,field,value){
  return `<input type="number" inputmode="numeric" value="${Number(value)||0}" style="width:62px;min-width:62px;padding:8px 5px;border:1px solid #36516c;border-radius:7px;background:#0b1723;color:#fff;text-align:center;font-size:15px" onchange="updateAuditPreview('${name}','${field}',this.value)">`;
}
function updateAuditPreview(name,field,value){
  if(!pendingAuditImport||!pendingAuditImport[name])return;
  pendingAuditImport[name][field]=Number(value)||0;
}
function renderAuditPreview(parsed){
  pendingAuditImport={};
  AUDIT_ROW_NAMES.forEach(name=>pendingAuditImport[name]=parsed[name]||{start:0,incoming:0,actual:0,sales:0,missing:0});
  let result=document.getElementById('auditImportResult');
  let rowsHtml=AUDIT_ROW_NAMES.map(name=>{let v=pendingAuditImport[name];return `<tr><td style="position:sticky;left:0;background:#0d1c2b;white-space:nowrap;padding:7px">${name}</td><td>${auditPreviewInput(name,'start',v.start)}</td><td>${auditPreviewInput(name,'incoming',v.incoming)}</td><td>${auditPreviewInput(name,'actual',v.actual)}</td><td>${auditPreviewInput(name,'sales',v.sales)}</td><td>${auditPreviewInput(name,'missing',v.missing)}</td></tr>`}).join('');
  result.innerHTML=`<div style="margin-top:12px;font-weight:700;color:#fff">识别预览｜先核对，确认后才写入</div><div style="margin:7px 0;color:#9eb2c7">25个品项都可以直接修改。确认数字正确后再点最下面的按钮。</div><div style="overflow-x:auto;border:1px solid #29445e;border-radius:10px"><table style="border-collapse:collapse;width:100%;font-size:13px"><thead><tr><th style="padding:8px;white-space:nowrap">品名</th><th>初始</th><th>进货</th><th>剩余</th><th>销量</th><th>漏单</th></tr></thead><tbody>${rowsHtml}</tbody></table></div><button class="btn green" style="width:100%;margin-top:12px" onclick="confirmAuditPreview()">确认无误，写入昨天</button>`;
}
async function recognizeYesterdayAudit(){
  if(!auditFiles.length)return toastMsg('先上传昨天的酒水盘点图片');
  let result=document.getElementById('auditImportResult');
  result.textContent='正在识别，完成后先给你预览，不会直接写入…';
  try{
    let parsed=await extractFixedAudit(auditFiles[0],(i,total)=>result.textContent=`正在识别 ${i}/${total}…`);
    renderAuditPreview(parsed);
    toastMsg('识别完成，请先核对');
  }catch(e){console.error(e);result.textContent='识别失败，请重试';toastMsg('识别失败')}
}
function confirmAuditPreview(){
  if(!pendingAuditImport)return toastMsg('请先识别昨天日盘');
  let yRows=saved(YESTERDAY)||draft(YESTERDAY)||defaultForDate(YESTERDAY);
  yRows.forEach(r=>{let v=pendingAuditImport[r.name];if(!v)return;r.start=n(v.start);r.sales=n(v.sales);r.actual=n(v.actual);r.cases=n(r.caseSize)?n(v.incoming)/n(r.caseSize):0});
  localStorage.setItem(key(YESTERDAY),JSON.stringify(yRows));
  localStorage.setItem(draftKey(YESTERDAY),JSON.stringify(yRows));
  let tRows=saved(TODAY)||draft(TODAY)||defaultForDate(TODAY),ym=Object.fromEntries(yRows.map(r=>[r.name,r]));
  tRows.forEach(r=>{if(ym[r.name])r.start=n(ym[r.name].actual)});
  localStorage.setItem(draftKey(TODAY),JSON.stringify(tRows));
  if(saved(TODAY))localStorage.setItem(key(TODAY),JSON.stringify(tRows));
  if(currentDate===YESTERDAY)rows=clone(yRows);else if(currentDate===TODAY)rows=clone(tRows);
  render();updateDateTabs();
  document.getElementById('auditImportResult').innerHTML='<div style="margin-top:10px;color:#63d391;font-weight:700">已确认写入昨天；昨天剩余库存已同步为今天初始库存。</div>';
  pendingAuditImport=null;toastMsg('已写入昨天并同步今天');
}