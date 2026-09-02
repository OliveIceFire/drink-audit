const ORDER_STORE='gumei-drink-order-v1';
let orderRows=[];
function loadOrderRows(){
  let saved={};try{saved=JSON.parse(localStorage.getItem(ORDER_STORE)||'{}')}catch(_){}
  orderRows=BASE.map(r=>({name:r.name,caseSize:r.caseSize,best:n(saved[r.name]?.best),ambient:n(saved[r.name]?.ambient)}));
}
function saveOrderRows(){const o={};orderRows.forEach(r=>o[r.name]={best:n(r.best),ambient:n(r.ambient)});localStorage.setItem(ORDER_STORE,JSON.stringify(o));}
function orderCases(r){if(n(r.best)<=n(r.ambient))return 0;return Math.ceil((n(r.best)-n(r.ambient))/n(r.caseSize));}
function updateOrder(i,k,v){orderRows[i][k]=n(v);saveOrderRows();renderOrder();}
function renderOrder(){
  if(!orderRows.length)loadOrderRows();
  orderBody.innerHTML=orderRows.map((r,i)=>`<tr><td>${r.name}</td><td>${r.caseSize}</td><td><input type="number" inputmode="numeric" value="${r.best}" onfocus="if(this.value==='0')this.value=''" onblur="if(this.value==='')this.value='0'" onchange="updateOrder(${i},'best',this.value)"></td><td><input type="number" inputmode="numeric" value="${r.ambient}" onfocus="if(this.value==='0')this.value=''" onblur="if(this.value==='')this.value='0'" onchange="updateOrder(${i},'ambient',this.value)"></td><td class="${orderCases(r)?'orderNeed':''}">${orderCases(r)?orderCases(r)+'件':'—'}</td></tr>`).join('');
  const needs=orderRows.filter(r=>orderCases(r)>0);orderCount.textContent=needs.length;orderCaseTotal.textContent=needs.reduce((s,r)=>s+orderCases(r),0);buildOrderText();
}
function buildOrderText(){
  const needs=orderRows.filter(r=>orderCases(r)>0);const d=new Date();const title=`${d.getMonth()+1}月${d.getDate()}日酒水订货`;
  orderOutput.value=title+(needs.length?'\n\n'+needs.map(r=>`${r.name} ${orderCases(r)}件`).join('\n'):'\n\n今日无需订货');
}
async function copyOrderText(){buildOrderText();try{await navigator.clipboard.writeText(orderOutput.value);toastMsg('订货信息已复制')}catch(_){orderOutput.select();document.execCommand('copy');toastMsg('订货信息已复制')}}
loadOrderRows();