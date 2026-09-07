let pendingRemainingImport=null;

function parseFeishuRemainingPaste(text){
  text=(text||'').replace(/\r/g,'').trim();
  if(!text)return [];
  let lines=text.split('\n').map(s=>s.trim()).filter(Boolean);

  // 1) 飞书直接复制“剩余库存”单列：一行一个数字。
  let single=[];
  for(let line of lines){
    let cells=line.split('\t').map(x=>x.trim()).filter(x=>x!=='');
    if(cells.length===1&&/^-?\d+(?:\.\d+)?$/.test(cells[0]))single.push(Number(cells[0]));
  }
  if(single.length>=AUDIT_ROW_NAMES.length)return single.slice(0,AUDIT_ROW_NAMES.length);

  // 2) 兼容粘贴整块飞书表格。优先找“剩余库存”表头所在列。
  let rows=lines.map(line=>line.split('\t').map(x=>x.trim()));
  let headerIndex=rows.findIndex(r=>r.some(c=>/剩余库存|剩余|余量/.test(c)));
  if(headerIndex>=0){
    let header=rows[headerIndex],col=header.findIndex(c=>/剩余库存|剩余|余量/.test(c));
    let values=[];
    for(let i=headerIndex+1;i<rows.length;i++){
      let r=rows[i],cell=r[col];
      if(cell!=null&&/^-?\d+(?:\.\d+)?$/.test(cell))values.push(Number(cell));
    }
    if(values.length>=AUDIT_ROW_NAMES.length)return values.slice(0,AUDIT_ROW_NAMES.length);
  }

  // 3) 兼容“品名 + 剩余库存”两列粘贴。
  let byName={};
  for(let row of rows){
    let joined=row.join(' '),m=matchOcrName(joined);if(!m)continue;
    let nums=row.filter(c=>/^-?\d+(?:\.\d+)?$/.test(c)).map(Number);
    if(nums.length)byName[m[0]]=nums[nums.length-1];
  }
  if(Object.keys(byName).length){return AUDIT_ROW_NAMES.map(name=>byName[name]??null)}

  // 4) 最后兜底：从整段文本按顺序抽取数字。
  return [...text.matchAll(/(?:^|\s)(-?\d+(?:\.\d+)?)(?=\s|$)/g)].map(m=>Number(m[1])).slice(0,AUDIT_ROW_NAMES.length);
}

function previewYesterdayRemainingPaste(){
  let box=document.getElementById('yesterdayRemainingPaste'),result=document.getElementById('auditImportResult'),text=(box?.value||'').trim();
  if(!text)return toastMsg('先粘贴昨天的剩余库存');
  let vals=parseFeishuRemainingPaste(text);
  let valid=vals.filter(v=>v!==null&&v!==undefined&&!Number.isNaN(v)).length;
  if(valid!==AUDIT_ROW_NAMES.length){
    result.innerHTML=`<div style="color:#ffb25f;font-weight:700">识别到 ${valid}/${AUDIT_ROW_NAMES.length} 个数字。</div><div style="margin-top:6px;color:#9eb2c7">请从飞书只复制“剩余库存”这一列，保持25行顺序不变，再粘贴一次。</div>`;
    return toastMsg(`只识别到 ${valid} 个，暂不写入`);
  }
  pendingRemainingImport={};
  AUDIT_ROW_NAMES.forEach((name,i)=>pendingRemainingImport[name]=Number(vals[i])||0);
  let body=AUDIT_ROW_NAMES.map(name=>`<tr><td style="padding:7px;white-space:nowrap">${name}</td><td><input type="number" inputmode="numeric" value="${pendingRemainingImport[name]}" style="width:78px;padding:8px 5px;border:1px solid #36516c;border-radius:7px;background:#0b1723;color:#fff;text-align:center;font-size:15px" onchange="pendingRemainingImport['${name}']=Number(this.value)||0"></td></tr>`).join('');
  result.innerHTML=`<div style="margin-top:12px;font-weight:700;color:#fff">昨日剩余库存预览</div><div style="margin:7px 0;color:#9eb2c7">按飞书顺序对应25个品项。这里可以直接改数字，确认后才写入。</div><div style="max-height:440px;overflow:auto;border:1px solid #29445e;border-radius:10px"><table style="border-collapse:collapse;width:100%;font-size:14px"><thead><tr><th style="padding:8px">品名</th><th>昨日剩余</th></tr></thead><tbody>${body}</tbody></table></div><button class="btn green" style="width:100%;margin-top:12px" onclick="confirmYesterdayRemainingPaste()">确认写入昨天，并同步今天初始库存</button>`;
  toastMsg('25项已识别，请核对');
}

function confirmYesterdayRemainingPaste(){
  if(!pendingRemainingImport)return toastMsg('请先识别昨天剩余库存');
  let yRows=saved(YESTERDAY)||draft(YESTERDAY)||defaultForDate(YESTERDAY);
  yRows.forEach(r=>{if(Object.prototype.hasOwnProperty.call(pendingRemainingImport,r.name))r.actual=n(pendingRemainingImport[r.name])});
  localStorage.setItem(key(YESTERDAY),JSON.stringify(yRows));
  localStorage.setItem(draftKey(YESTERDAY),JSON.stringify(yRows));

  let tRows=saved(TODAY)||draft(TODAY)||defaultForDate(TODAY),ym=Object.fromEntries(yRows.map(r=>[r.name,r]));
  tRows.forEach(r=>{if(ym[r.name])r.start=n(ym[r.name].actual)});
  localStorage.setItem(draftKey(TODAY),JSON.stringify(tRows));
  if(saved(TODAY))localStorage.setItem(key(TODAY),JSON.stringify(tRows));

  if(currentDate===YESTERDAY)rows=clone(yRows);else if(currentDate===TODAY)rows=clone(tRows);
  render();updateDateTabs();
  document.getElementById('auditImportResult').innerHTML='<div style="margin-top:10px;color:#63d391;font-weight:700">已写入昨天剩余库存；并自动同步为今天初始库存。</div>';
  pendingRemainingImport=null;
  toastMsg('昨天剩余已导入，今天初始已同步');
}