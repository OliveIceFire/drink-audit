yesterdayText.textContent=shortDate(YESTERDAY);todayText.textContent=shortDate(TODAY);duckYesterdayText.textContent=shortDate(YESTERDAY);duckTodayText.textContent=shortDate(TODAY);addEventListener('resize',render);openDate(TODAY);openDuckDate(TODAY);

let activeEntryBanner=document.getElementById('activeEntryBanner');
if(!activeEntryBanner){
  activeEntryBanner=document.createElement('div');
  activeEntryBanner.id='activeEntryBanner';
  Object.assign(activeEntryBanner.style,{
    position:'fixed',left:'12px',right:'12px',transform:'none',
    zIndex:'2147483647',display:'none',padding:'12px 14px',borderRadius:'12px',
    background:'#1768e7',color:'#fff',fontSize:'17px',fontWeight:'800',
    boxShadow:'0 8px 28px rgba(0,0,0,.45)',whiteSpace:'nowrap',
    overflow:'hidden',textOverflow:'ellipsis',pointerEvents:'none',textAlign:'center'
  });
  document.body.appendChild(activeEntryBanner);
}
function positionActiveEntryBanner(){
  if(activeEntryBanner.style.display==='none')return;
  const vv=window.visualViewport;
  const top=(vv?vv.offsetTop:window.scrollY)+10;
  activeEntryBanner.style.top=top+'px';
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
  positionActiveEntryBanner();
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

if(window.visualViewport){
  visualViewport.addEventListener('resize',positionActiveEntryBanner);
  visualViewport.addEventListener('scroll',positionActiveEntryBanner);
}
window.addEventListener('scroll',positionActiveEntryBanner,{passive:true});

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