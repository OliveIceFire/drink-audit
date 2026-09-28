// Cloud adapter. Keep service-role keys out of browser code.
const cloudConfig=window.DRINK_AUDIT_CLOUD||null;
const CLOUD_SESSION_KEY='drink-audit-cloud-session-v1';
const escapeCloudText=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function cloudSession(){try{return JSON.parse(localStorage.getItem(CLOUD_SESSION_KEY)||'null')}catch{return null}}
function cloudAuthenticated(){return Boolean(cloudSession()?.access_token&&cloudSession()?.user?.id)}
function cloudAccessToken(){return cloudSession()?.access_token||cloudConfig?.anonKey}
function setCloudSession(session){localStorage.setItem(CLOUD_SESSION_KEY,JSON.stringify(session))}
function cloudReady(){return Boolean(cloudConfig?.url&&cloudConfig?.anonKey&&cloudConfig?.storeId);}
async function legacyCloudRequest(path,options={}){
  if(!cloudReady())throw Error('cloud_not_configured');
  const response=await fetch(`${cloudConfig.url}/rest/v1/${path}`,{...options,headers:{apikey:cloudConfig.anonKey,Authorization:`Bearer ${cloudConfig.anonKey}`,'Content-Type':'application/json',...(options.headers||{})}});
  if(!response.ok)throw Error(`cloud_${response.status}`);
  return response.status===204?null:response.json();
}
async function legacyUploadAuditToCloud(){
  if(!cloudReady())return false;
  const stamp=new Date().toISOString();
  const audit=await cloudRequest('drink_audits?on_conflict=store_id,business_date',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify({store_id:cloudConfig.storeId,business_date:currentDate,status:'submitted',submitted_at:stamp,updated_at:stamp})});
  const auditId=audit?.[0]?.id;if(!auditId)throw Error('audit_create_failed');
  const products=await cloudRequest('drink_products?select=id,canonical_name&active=eq.true');
  const ids=new Map(products.map(product=>[product.canonical_name,product.id]));
  const lines=rows.map(row=>({audit_id:auditId,product_id:ids.get(row.name),opening_quantity:n(row.start),receipt_quantity:incoming(row),sales_quantity:n(row.sales),actual_remaining:n(row.actual),after_midnight_sales_quantity:n(row.afterSales),open_table_quantity:n(row.openTable)})).filter(line=>line.product_id);
  if(lines.length!==rows.length)throw Error('product_mapping_missing');
  await cloudRequest('drink_audit_lines?on_conflict=audit_id,product_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates'},body:JSON.stringify(lines)});
  await cloudRequest('audit_events',{method:'POST',body:JSON.stringify({audit_id:auditId,event_type:'employee_submitted',payload:{items:lines.length,business_date:currentDate}})});
  return true;
}
async function cloudRequest(path,options={}){
  if(!cloudReady())throw Error('cloud_not_configured');
  const response=await fetch(cloudConfig.url+'/rest/v1/'+path,{...options,headers:{apikey:cloudConfig.anonKey,Authorization:'Bearer '+cloudAccessToken(),'Content-Type':'application/json',...(options.headers||{})}});
  if(!response.ok)throw Error('cloud_'+response.status);
  return response.status===204?null:response.json();
}
async function signInCloud(){
  const state=document.getElementById('cloudAuthState'),email=document.getElementById('cloudEmail')?.value.trim(),password=document.getElementById('cloudPassword')?.value;
  if(!cloudReady()){state.textContent='管理员尚未配置云端门店。';return}
  if(!email||!password){state.textContent='请输入员工邮箱和密码。';return}
  try{
    const response=await fetch(cloudConfig.url+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:cloudConfig.anonKey,'Content-Type':'application/json'},body:JSON.stringify({email,password})});
    if(!response.ok)throw Error('sign_in_failed');
    const session=await response.json();setCloudSession(session);
    document.getElementById('cloudPassword').value='';
    state.textContent='已登录：'+(session.user?.email||email)+'。可提交所属门店盘查。';updateSyncStatus?.();
  }catch{state.textContent='登录失败：请核对账号、密码及门店权限。'}
}
function signOutCloud(){localStorage.removeItem(CLOUD_SESSION_KEY);document.getElementById('cloudAuthPanel')?.remove();installCloudAuthPanel();updateSyncStatus?.()}
function installCloudAuthPanel(){
  const page=document.getElementById('syncPage');if(!page||document.getElementById('cloudAuthPanel'))return;
  const section=document.createElement('section');section.id='cloudAuthPanel';section.className='box';
  if(!cloudReady()){section.innerHTML='<div class="boxTitle">员工云端登录</div><div class="hint">云端尚未由管理员配置。当前仍可下载数据包离线传递。</div><div id="cloudAuthState" class="result">未配置门店、项目地址和浏览器安全公钥。</div>'}
  else if(cloudAuthenticated()){const email=cloudSession()?.user?.email||'已登录员工';section.innerHTML='<div class="boxTitle">员工云端登录</div><div class="hint">当前账号仅能访问被授权的门店数据。</div><div id="cloudAuthState" class="result">已登录：'+escapeCloudText(email)+'</div><div class="rowBtns"><button class="btn" type="button">退出登录</button></div>';section.querySelector('button').addEventListener('click',signOutCloud)}
  else{section.innerHTML='<div class="boxTitle">员工云端登录</div><div class="hint">使用管理员创建并授权的员工账号登录。密码只发送给 Supabase 身份服务，不会保存到本机。</div><div class="grid2"><div class="field"><label>员工邮箱</label><input id="cloudEmail" type="email" autocomplete="username" inputmode="email"></div><div class="field"><label>密码</label><input id="cloudPassword" type="password" autocomplete="current-password"></div></div><div class="rowBtns"><button class="btn green" type="button">登录并同步</button></div><div id="cloudAuthState" class="result">未登录：提交盘查前需要员工身份验证。</div>';section.querySelector('button').addEventListener('click',signInCloud)}
  page.insertBefore(section,page.firstElementChild);
}
async function uploadAuditToCloud(){
  if(!cloudReady())return false;
  if(!cloudAuthenticated())throw Error('cloud_auth_required');
  const stamp=new Date().toISOString(),userId=cloudSession().user.id;
  const audit=await cloudRequest('drink_audits?on_conflict=store_id,business_date',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify({store_id:cloudConfig.storeId,business_date:currentDate,status:'submitted',submitted_by:userId,submitted_at:stamp,updated_at:stamp})});
  const auditId=audit?.[0]?.id;if(!auditId)throw Error('audit_create_failed');
  const products=await cloudRequest('drink_products?select=id,canonical_name&active=eq.true');
  const ids=new Map(products.map(product=>[product.canonical_name,product.id]));
  const lines=rows.map(row=>({audit_id:auditId,product_id:ids.get(row.name),opening_quantity:n(row.start),receipt_quantity:incoming(row),sales_quantity:n(row.sales),actual_remaining:n(row.actual),after_midnight_sales_quantity:n(row.afterSales),open_table_quantity:n(row.openTable)})).filter(line=>line.product_id);
  if(lines.length!==rows.length)throw Error('product_mapping_missing');
  await cloudRequest('drink_audit_lines?on_conflict=audit_id,product_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates'},body:JSON.stringify(lines)});
  await cloudRequest('audit_events',{method:'POST',body:JSON.stringify({audit_id:auditId,event_type:'employee_submitted',actor_id:userId,payload:{items:lines.length,business_date:currentDate}})});
  return true;
}
// Keep the Meituan text importer optional so existing offline pages remain usable.
const meituanSalesScript=document.createElement('script');
meituanSalesScript.src='sales-import.js?v=20260928e';
document.head.appendChild(meituanSalesScript);
const managementScript=document.createElement('script');
managementScript.src='management.js?v=20260928c';
document.head.appendChild(managementScript);
const overnightScript=document.createElement('script');
overnightScript.src='overnight.js?v=20260928a';
document.head.appendChild(overnightScript);
installCloudAuthPanel();
