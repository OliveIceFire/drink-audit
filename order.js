const ORDER_STORE='gumei-drink-order-v2';
const DEFAULT_BEST={
  '雪花纯生':48,'超级勇闯':36,'百威':36,'喜力':30,'老雪花':48,'青岛':42,
  '大窑荔爱':42,'大窑橙诺':54,'北冰洋':36,'听可乐':30,'听雪碧':30,'无糖可乐':30,
  '王老吉':30,'果粒橙':20,'大可乐':20,'大雪碧':20,'矿泉水':24,'唯怡豆奶':44,
  '椰子水':15,'30白啤':18,'力波白啤':18,'LOOK':15
};
const SPECIAL_ORDER_NAMES=new Set(['30白啤','椰子水']);
let orderRows=[];
function loadOrderRows(){
  let saved={};try{saved=JSON.parse(localStorage.getItem(ORDER_STORE)||'{}')}catch(_){}
  orderRows=BASE.filter(r=>r.name!=='光明酸奶').map(r=>({
    name:r.name,
    caseSize:r.caseSize,
    best:saved[r.name]?.best!=null?n(saved[r.name].best):n(DEFAULT_BEST[r.name]),
    current:saved[r.name]?.current!=null?n(saved[r.name].current):0
  }));
}
function saveOrderRows(){const o={};orderRows.forEach(r=>o[r.name]={best:n(r.best),current:n(r.current)});localStorage.setItem(ORDER_STORE,JSON.stringify(o));}
function orderCases(r){if(n(r.best)<=n(r.current))return 0;return Math.ceil((n(r.best)-n(r.current))/n(r.caseSize));}
function updateOrder(i,k,v){orderRows[i][k]=n(v);saveOrderRows();renderOrder();}
function renderOrder(){
  if(!orderRows.length)loadOrderRows();
  const body=document.getElementById('orderBody'),count=document.getElementById('orderCount'),caseTotal=document.getElementById('orderCaseTotal');
  body.innerHTML=orderRows.map((r,i)=>`<tr><td>${r.name}</td><td>${r.caseSize}</td><td><input type="number" inputmode="numeric" value="${r.best}" onfocus="if(this.value==='0')this.value=''" onblur="if(this.value==='')this.value='0'" onchange="updateOrder(${i},'best',this.value)"></td><td><input type="number" inputmode="numeric" value="${r.current}" onfocus="if(this.value==='0')this.value=''" onblur="if(this.value==='')this.value='0'" onchange="updateOrder(${i},'current',this.value)"></td><td class="${orderCases(r)?'orderNeed':''}">${orderCases(r)?orderCases(r)+'件':'—'}</td></tr>`).join('');
  const needs=orderRows.filter(r=>orderCases(r)>0);count.textContent=needs.length;caseTotal.textContent=needs.reduce((s,r)=>s+orderCases(r),0);buildOrderText();
}
function orderTextFor(needs,title){return title+(needs.length?'\n\n'+needs.map(r=>`${r.name} ${orderCases(r)}件`).join('\n'):'\n\n今日无需订货')}
function buildOrderText(){
  const needs=orderRows.filter(r=>orderCases(r)>0),d=new Date(),date=`${d.getMonth()+1}月${d.getDate()}日`;
  const normal=needs.filter(r=>!SPECIAL_ORDER_NAMES.has(r.name));
  const special=needs.filter(r=>SPECIAL_ORDER_NAMES.has(r.name));
  document.getElementById('orderOutput').value=orderTextFor(normal,`${date}酒水订货`);
  document.getElementById('specialOrderOutput').value=orderTextFor(special,`${date}30公里、椰子水订货`);
}
async function copyTextFrom(id,msg){buildOrderText();const out=document.getElementById(id);try{await navigator.clipboard.writeText(out.value);toastMsg(msg)}catch(_){out.select();document.execCommand('copy');toastMsg(msg)}}
function copyOrderText(){return copyTextFrom('orderOutput','酒水订货信息已复制')}
function copySpecialOrderText(){return copyTextFrom('specialOrderOutput','30公里、椰子水订货已复制')}
loadOrderRows();