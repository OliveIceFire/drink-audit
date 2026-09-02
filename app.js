yesterdayText.textContent=shortDate(YESTERDAY);todayText.textContent=shortDate(TODAY);duckYesterdayText.textContent=shortDate(YESTERDAY);duckTodayText.textContent=shortDate(TODAY);addEventListener('resize',render);openDate(TODAY);openDuckDate(TODAY);

let activeEntryBanner=document.getElementById('activeEntryBanner');
if(!activeEntryBanner){
  activeEntryBanner=document.createElement('div');
  activeEntryBanner.id='activeEntryBanner';
  Object.assign(activeEntryBanner.style,{
    position:'fixed',top:'12px',left:'50%',transform:'translateX(-50%)',
    zIndex:'9999',display:'none',padding:'10px 16px',borderRadius:'999px',
    background:'#1768e7',color:'#fff',fontSize:'16px',fontWeight:'800',
    boxShadow:'0 8px 28px rgba(0,0,0,.35)',whiteSpace:'nowrap',
    maxWidth:'92vw',overflow:'hidden',textOverflow:'ellipsis',pointerEvents:'none'
  });
  document.body.appendChild(activeEntryBanner);
}
function showActiveEntry(el){
  const tr=el.closest('tr');
  if(!tr)return;
  const name=tr.cells?.[0]?.textContent?.trim()||'';
  const td=el.closest('td');
  const idx=td?td.cellIndex:-1;
  let field='录入';
  const th=document.querySelector(`#thead th:nth-child(${idx+1})`);
  if(th&&th.textContent.trim())field=th.textContent.trim();
  activeEntryBanner.textContent=`正在盘点：${name} · ${field}`;
  activeEntryBanner.style.display='block';
  tr.dataset.activeEntry='1';
  tr.style.outline='2px solid #1768e7';
  tr.style.outlineOffset='-2px';
}
function hideActiveEntry(el){
  const tr=el.closest('tr');
  if(tr){delete tr.dataset.activeEntry;tr.style.outline='';tr.style.outlineOffset='';}
  setTimeout(()=>{
    const a=document.activeElement;
    if(!(a instanceof HTMLInputElement)||!a.closest('#tbody'))activeEntryBanner.style.display='none';
  },80);
}

document.addEventListener('focusin',e=>{
  const el=e.target;
  if(!(el instanceof HTMLInputElement))return;
  if(el.inputMode!=='numeric'&&el.type!=='number')return;
  if(el.closest('#tbody'))showActiveEntry(el);
  if(el.value==='0'){
    el.value='';
  }else{
    setTimeout(()=>{try{el.select()}catch(_){}},0);
  }
});

document.addEventListener('focusout',e=>{
  const el=e.target;
  if(!(el instanceof HTMLInputElement))return;
  if(el.inputMode!=='numeric'&&el.type!=='number')return;
  if(el.value==='')el.value='0';
  if(el.closest('#tbody'))hideActiveEntry(el);
});