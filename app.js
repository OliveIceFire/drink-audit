yesterdayText.textContent=shortDate(YESTERDAY);todayText.textContent=shortDate(TODAY);duckYesterdayText.textContent=shortDate(YESTERDAY);duckTodayText.textContent=shortDate(TODAY);addEventListener('resize',render);openDate(TODAY);openDuckDate(TODAY);

document.addEventListener('focusin',e=>{
  const el=e.target;
  if(!(el instanceof HTMLInputElement))return;
  if(el.inputMode!=='numeric'&&el.type!=='number')return;
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
});