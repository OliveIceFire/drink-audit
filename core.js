const LEGACY_BASE=[{name:'雪花纯生',start:52,cases:0,caseSize:12,sales:7,actual:45},{name:'超级勇闯',start:15,cases:0,caseSize:12,sales:3,actual:12},{name:'百威',start:25,cases:0,caseSize:12,sales:1,actual:24},{name:'喜力',start:15,cases:0,caseSize:12,sales:8,actual:7},{name:'老雪花',start:12,cases:0,caseSize:12,sales:1,actual:11},{name:'青岛',start:42,cases:0,caseSize:12,sales:10,actual:32},{name:'乌毡帽',start:13,cases:0,caseSize:6,sales:0,actual:13},{name:'大窑荔爱',start:38,cases:0,caseSize:12,sales:2,actual:36},{name:'大窑橙诺',start:32,cases:0,caseSize:12,sales:3,actual:29},{name:'北冰洋',start:15,cases:0,caseSize:24,sales:1,actual:14},{name:'听可乐',start:6,cases:2,caseSize:24,sales:7,actual:47},{name:'听雪碧',start:24,cases:0,caseSize:24,sales:1,actual:23},{name:'无糖可乐',start:24,cases:0,caseSize:24,sales:3,actual:21},{name:'王老吉',start:5,cases:2,caseSize:24,sales:6,actual:47},{name:'果粒橙',start:9,cases:0,caseSize:12,sales:1,actual:8},{name:'大可乐',start:14,cases:0,caseSize:12,sales:3,actual:11},{name:'大雪碧',start:15,cases:0,caseSize:12,sales:0,actual:15},{name:'矿泉水',start:29,cases:0,caseSize:24,sales:3,actual:26},{name:'唯怡豆奶',start:9,cases:1,caseSize:20,sales:2,actual:27},{name:'椰子水',start:6,cases:0,caseSize:15,sales:3,actual:3},{name:'光明酸奶',start:8,cases:0,caseSize:12,sales:4,actual:4},{name:'30白啤',start:10,cases:0,caseSize:6,sales:0,actual:10},{name:'力波白啤',start:8,cases:0,caseSize:6,sales:2,actual:6},{name:'小郎酒',start:11,cases:0,caseSize:24,sales:1,actual:10},{name:'古越龙山',start:3,cases:0,caseSize:12,sales:0,actual:3},{name:'LOOK',start:0,cases:0,caseSize:24,sales:0,actual:0}];
function unifiedDrinkName(name){return name==='光明酸奶'?'LOOK':name}
function unifyDrinkRows(source){if(!Array.isArray(source))return source;const result=[],byName=new Map();for(const original of source){const row={...original,name:unifiedDrinkName(original.name)},existing=byName.get(row.name);if(!existing){byName.set(row.name,row);result.push(row);continue}const size=Number(existing.caseSize)||Number(row.caseSize)||1,totalIncoming=(Number(existing.cases)||0)*(Number(existing.caseSize)||0)+(Number(row.cases)||0)*(Number(row.caseSize)||0);for(const field of ['start','sales','actual','afterSales','openTable'])existing[field]=(Number(existing[field])||0)+(Number(row[field])||0);existing.caseSize=size;existing.cases=totalIncoming/size}return result}
const BASE=unifyDrinkRows(LEGACY_BASE);
const STORE='gumei-drink-audit-v15',DUCK_STORE='gumei-duck-audit-v1',LAST_MODULE_KEY='gumei-last-module-v1';
let rows=[],view='daily',currentDate='',duckDate='',duck={made:0,sales:0,after:0,remain:0};
const clone=x=>JSON.parse(JSON.stringify(x)),n=v=>Number(v)||0,incoming=r=>n(r.cases)*n(r.caseSize),theory=r=>n(r.start)+incoming(r)-n(r.sales),reconciledActual=r=>n(r.actual)+n(r.afterSales)+n(r.openTable),missing=r=>theory(r)-reconciledActual(r),key=d=>STORE+'-'+d,draftKey=d=>STORE+'-draft-'+d,duckKey=d=>DUCK_STORE+'-'+d;
function localISO(d=new Date()){let y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`}
const actualEntryKey=d=>STORE+'-actual-entered-'+d;
const savedActualEntryKey=d=>STORE+'-saved-actual-entered-'+d;
function actualEntryNames(d=currentDate){try{return new Set(JSON.parse(localStorage.getItem(actualEntryKey(d))||'[]').map(unifiedDrinkName))}catch{return new Set()}}
function markActualEntered(name){const names=actualEntryNames();names.add(name);localStorage.setItem(actualEntryKey(currentDate),JSON.stringify([...names]))}
function actualEntryCount(d=currentDate){return actualEntryNames(d).size}
function shiftDate(s,days){let d=new Date(s+'T12:00:00');d.setDate(d.getDate()+days);return localISO(d)}
function shortDate(s){let d=new Date(s+'T12:00:00');return `${d.getMonth()+1}月${d.getDate()}日`}
const TODAY=localISO(),YESTERDAY=shiftDate(TODAY,-1);
function switchModule(m){
  if(!['order','water','duck','sync'].includes(m))m='water';
  localStorage.setItem(LAST_MODULE_KEY,m);
  const active=document.activeElement;if(active&&typeof active.blur==='function')active.blur();
  const banner=document.getElementById('activeEntryBanner');if(banner)banner.style.display='none';
  document.querySelectorAll('#tbody tr').forEach(tr=>{tr.style.outline='';tr.style.outlineOffset='';delete tr.dataset.activeEntry});
  document.getElementById('orderPage').classList.toggle('active',m==='order');
  document.getElementById('waterPage').classList.toggle('active',m==='water');
  document.getElementById('duckPage').classList.toggle('active',m==='duck');
  document.getElementById('syncPage').classList.toggle('active',m==='sync');
  document.getElementById('orderModuleBtn').classList.toggle('active',m==='order');
  document.getElementById('waterModuleBtn').classList.toggle('active',m==='water');
  document.getElementById('duckModuleBtn').classList.toggle('active',m==='duck');
  document.getElementById('syncModuleBtn').classList.toggle('active',m==='sync');
  if(m==='duck')openDuckDate(duckDate||TODAY);
  if(m==='order'&&typeof renderOrder==='function')renderOrder();
  if(m==='sync'&&typeof updateSyncStatus==='function')updateSyncStatus();
}
function restoreLastModule(){let m=localStorage.getItem(LAST_MODULE_KEY)||'water';if(!['order','water','duck','sync'].includes(m))m='water';switchModule(m)}
function toastMsg(t){toast.textContent=t;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2200)}
function closeImage(){imgModal.classList.remove('show')}
