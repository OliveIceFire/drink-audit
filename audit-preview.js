let pendingRemainingImport=null;
const PASTE_ROW_NAMES=BASE.map(row=>row.name);
const PHOTO_ZONE_KEY=(typeof STORE==='undefined'?'drink-audit':STORE)+'-photo-zone-check-v1';
const PHOTO_ZONES=['冷藏展示柜','常温货架/收银台','库房整箱酒水','30白啤/椰子水专放','散放/其他酒水'];
function photoZoneChecks(){try{const value=JSON.parse(localStorage.getItem(PHOTO_ZONE_KEY+'-'+currentDate)||'{}');return value&&typeof value==='object'?value:{}}catch{return {}}}
function renderPhotoZoneChecks(){const state=document.getElementById('photoZoneState');if(!state)return;const checks=photoZoneChecks(),done=PHOTO_ZONES.filter(zone=>checks[zone]?.count>0);state.innerHTML='<div class="result">照片覆盖：'+done.length+'/'+PHOTO_ZONES.length+' 个分区。照片只作为盘点留证，最终数量仍以“实物剩余”录入为准。</div><div class="tablewrap"><table class="sheet"><thead><tr><th>拍摄分区</th><th>状态</th><th>补拍</th></tr></thead><tbody>'+PHOTO_ZONES.map((zone,index)=>{const item=checks[zone],status=item?.count?'已留证 '+item.count+' 张':'未留证';return '<tr><td>'+zone+'</td><td class="'+(item?.count?'':'orderNeed')+'">'+status+'</td><td><label class="btn" for="photoZone'+index+'">选择照片<input id="photoZone'+index+'" type="file" accept="image/*" multiple hidden></label></td></tr>'}).join('')+'</tbody></table></div>';
  PHOTO_ZONES.forEach((zone,index)=>state.querySelector('#photoZone'+index).addEventListener('change',event=>recordPhotoZone(zone,event.target)));
}
function recordPhotoZone(zone,input){const count=input.files?.length||0;if(!count)return;const checks=photoZoneChecks();checks[zone]={count,checkedAt:new Date().toISOString()};localStorage.setItem(PHOTO_ZONE_KEY+'-'+currentDate,JSON.stringify(checks));renderPhotoZoneChecks();toastMsg(zone+'已留证 '+count+' 张')}

(function mountFeishuPasteImporter(){
  const oldInput=document.getElementById('auditImportImg');
  const section=oldInput?.closest('section.box');
  if(!section)return;
  section.innerHTML=`<div class="boxTitle">导入昨日剩余库存</div>
  <div class="hint">飞书兼容：直接在飞书表格里复制昨天“剩余库存”这一列，然后粘贴到这里。系统按当前26个统一品项顺序对应，确认后写入昨天，并自动同步为今天初始库存。</div>
  <textarea id="yesterdayRemainingPaste" class="orderOutput" placeholder="例如直接从飞书复制这一列：&#10;45&#10;12&#10;24&#10;7&#10;11&#10;……"></textarea>
  <div class="rowBtns"><button class="btn blue" onclick="previewYesterdayRemainingPaste()">识别并预览</button></div>
  <div id="auditImportResult" class="result"></div>
  <div class="boxTitle" style="margin-top:18px">实盘分区照片留证</div>
  <div class="hint">按冷藏柜、货架、库房等固定分区拍照，防止手工盘点漏看角落。系统只记录本次是否已留证和照片张数，不上传或替代人工计数。</div>
  <div id="photoZoneState"></div>`;
  renderPhotoZoneChecks();
})();

function parseFeishuRemainingPaste(text){
  text=(text||'').replace(/\r/g,'').trim();
  if(!text)return [];
  let lines=text.split('\n').map(s=>s.trim()).filter(Boolean);

  let single=[];
  for(let line of lines){
    let cells=line.split('\t').map(x=>x.trim()).filter(x=>x!=='');
    if(cells.length===1&&/^-?\d+(?:\.\d+)?$/.test(cells[0]))single.push(Number(cells[0]));
  }
  if(single.length>=PASTE_ROW_NAMES.length)return single.slice(0,PASTE_ROW_NAMES.length);

  let rows=lines.map(line=>line.split('\t').map(x=>x.trim()));
  let headerIndex=rows.findIndex(r=>r.some(c=>/剩余库存|剩余|余量/.test(c)));
  if(headerIndex>=0){
    let header=rows[headerIndex],col=header.findIndex(c=>/剩余库存|剩余|余量/.test(c));
    let values=[];
    for(let i=headerIndex+1;i<rows.length;i++){
      let r=rows[i],cell=r[col];
      if(cell!=null&&/^-?\d+(?:\.\d+)?$/.test(cell))values.push(Number(cell));
    }
    if(values.length>=PASTE_ROW_NAMES.length)return values.slice(0,PASTE_ROW_NAMES.length);
  }

  let byName={};
  for(let row of rows){
    let joined=row.join(' '),m=matchOcrName(joined);if(!m)continue;
    let nums=row.filter(c=>/^-?\d+(?:\.\d+)?$/.test(c)).map(Number);
    if(nums.length)byName[m[0]]=nums[nums.length-1];
  }
  if(Object.keys(byName).length){return PASTE_ROW_NAMES.map(name=>byName[name]??null)}

  return [...text.matchAll(/(?:^|\s)(-?\d+(?:\.\d+)?)(?=\s|$)/g)].map(m=>Number(m[1])).slice(0,PASTE_ROW_NAMES.length);
}

function previewYesterdayRemainingPaste(){
  let box=document.getElementById('yesterdayRemainingPaste'),result=document.getElementById('auditImportResult'),text=(box?.value||'').trim();
  if(!text)return toastMsg('先粘贴昨天的剩余库存');
  let vals=parseFeishuRemainingPaste(text);
  let valid=vals.filter(v=>v!==null&&v!==undefined&&!Number.isNaN(v)).length;
  if(valid!==PASTE_ROW_NAMES.length){
    result.innerHTML=`<div style="color:#ffb25f;font-weight:700">识别到 ${valid}/${PASTE_ROW_NAMES.length} 个数字。</div><div style="margin-top:6px;color:#9eb2c7">请从飞书只复制“剩余库存”这一列，保持26行顺序不变，再粘贴一次。</div>`;
    return toastMsg(`只识别到 ${valid} 个，暂不写入`);
  }
  pendingRemainingImport={};
  PASTE_ROW_NAMES.forEach((name,i)=>pendingRemainingImport[name]=Number(vals[i])||0);
  let body=PASTE_ROW_NAMES.map(name=>`<tr><td style="padding:7px;white-space:nowrap">${name}</td><td><input type="number" inputmode="numeric" value="${pendingRemainingImport[name]}" style="width:78px;padding:8px 5px;border:1px solid #36516c;border-radius:7px;background:#0b1723;color:#fff;text-align:center;font-size:15px" onchange="pendingRemainingImport['${name}']=Number(this.value)||0"></td></tr>`).join('');
  result.innerHTML=`<div style="margin-top:12px;font-weight:700;color:#fff">昨日剩余库存预览</div><div style="margin:7px 0;color:#9eb2c7">按飞书顺序对应26个统一品项。这里可以直接改数字，确认后才写入。</div><div style="max-height:440px;overflow:auto;border:1px solid #29445e;border-radius:10px"><table style="border-collapse:collapse;width:100%;font-size:14px"><thead><tr><th style="padding:8px">品名</th><th>昨日剩余</th></tr></thead><tbody>${body}</tbody></table></div><button class="btn green" style="width:100%;margin-top:12px" onclick="confirmYesterdayRemainingPaste()">确认写入昨天，并同步今天初始库存</button>`;
  toastMsg('26项已识别，请核对');
}

function confirmYesterdayRemainingPaste(){
  if(!pendingRemainingImport)return toastMsg('请先识别昨天剩余库存');
  let yRows=saved(YESTERDAY)||draft(YESTERDAY)||defaultForDate(YESTERDAY);
  yRows.forEach(r=>{if(Object.prototype.hasOwnProperty.call(pendingRemainingImport,r.name))r.actual=n(pendingRemainingImport[r.name])});
  localStorage.setItem(key(YESTERDAY),JSON.stringify(yRows));
  localStorage.setItem(draftKey(YESTERDAY),JSON.stringify(yRows));
  localStorage.setItem(actualEntryKey(YESTERDAY),JSON.stringify(PASTE_ROW_NAMES));

  let tRows=saved(TODAY)||draft(TODAY)||defaultForDate(TODAY),ym=Object.fromEntries(yRows.map(r=>[r.name,r]));
  tRows.forEach(r=>{if(ym[r.name])r.start=reconciledActual(ym[r.name])});
  localStorage.setItem(draftKey(TODAY),JSON.stringify(tRows));
  if(saved(TODAY))localStorage.setItem(key(TODAY),JSON.stringify(tRows));

  if(currentDate===YESTERDAY)rows=clone(yRows);else if(currentDate===TODAY)rows=clone(tRows);
  render();updateDateTabs();
  document.getElementById('auditImportResult').innerHTML='<div style="margin-top:10px;color:#63d391;font-weight:700">已写入昨天剩余库存；并自动同步为今天初始库存。</div>';
  pendingRemainingImport=null;
  toastMsg('昨天剩余已导入，今天初始已同步');
}
