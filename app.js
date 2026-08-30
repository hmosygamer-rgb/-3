const members = {
  sara: { name: 'سارة', location: 'المنزل', address: 'شارع النيل، الدقي', battery: '٨٢٪', coords: [30.0444,31.2357] },
  omar: { name: 'عمر', location: 'في الطريق', address: 'كوبري قصر النيل، القاهرة', battery: '٦٤٪', coords: [30.0468,31.2287] },
  mama: { name: 'ماما', location: 'نادي الجزيرة', address: 'الزمالك، القاهرة', battery: '٢١٪', coords: [30.0603,31.2197] }
};
let selected = 'sara';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const toast = (message) => { const el=$('#toast'); el.textContent=message; el.classList.add('show'); clearTimeout(window.toastTimer); window.toastTimer=setTimeout(()=>el.classList.remove('show'),2600); };

function selectMember(id){
  selected=id; const m=members[id];
  $$('.member-card').forEach(c=>c.classList.toggle('selected',c.dataset.member===id));
  $$('.person-pin').forEach(c=>c.classList.toggle('active',c.dataset.member===id));
  $('.activity-card .eyebrow').textContent=`آخر تحديثات ${m.name}`;
  $('.place-card h2').textContent=m.location;
  $('.place-card > div:nth-child(2) > span').textContent=m.address;
  $('#mapFrame').src=`https://maps.google.com/maps?q=${m.coords.join(',')}&z=14&output=embed`;
}
$$('[data-member]').forEach(el=>el.addEventListener('click',()=>selectMember(el.dataset.member)));

$('#searchInput').addEventListener('input',e=>{
  const q=e.target.value.trim();
  $$('.member-card').forEach(card=>{const hit=card.textContent.includes(q);card.style.display=!q||hit?'flex':'none';});
  const match=Object.entries(members).find(([,m])=>m.name.includes(q)); if(match) selectMember(match[0]);
});
$('#fitBtn').addEventListener('click',()=>{ $('#mapFrame').src='https://maps.google.com/maps?q=30.048,31.23&z=13&output=embed'; toast('تم عرض جميع أفراد العائلة'); });
$('#routeBtn').addEventListener('click',()=>{const m=members[selected];window.open(`https://www.google.com/maps/dir/?api=1&destination=${m.coords.join(',')}`,'_blank','noopener');});
$('#myLocationBtn').addEventListener('click',()=>{
  if(!navigator.geolocation){toast('الموقع غير مدعوم على هذا الجهاز');return;}
  toast('جارٍ تحديد موقعك…');
  navigator.geolocation.getCurrentPosition(pos=>{const {latitude,longitude}=pos.coords;$('#mapFrame').src=`https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`;toast('تم تحديد موقعك بدقة');},()=>toast('اسمح بالوصول إلى الموقع من إعدادات المتصفح'),{enableHighAccuracy:false,timeout:8000,maximumAge:300000});
});

const modal=$('#modalBackdrop');
$('#addMemberBtn').addEventListener('click',()=>{modal.hidden=false;$('#inviteName').focus();});
$('#modalClose').addEventListener('click',()=>modal.hidden=true);
modal.addEventListener('click',e=>{if(e.target===modal)modal.hidden=true;});
document.addEventListener('keydown',e=>{if(e.key==='Escape')modal.hidden=true;});
$('#createInviteBtn').addEventListener('click',()=>{
  const name=$('#inviteName').value.trim(); if(!name){toast('اكتب اسم فرد العائلة أولاً');return;}
  const token=Math.random().toString(36).slice(2,8).toUpperCase();
  $('#inviteCode').textContent=`qareeb.app/join/${token}`; $('#inviteResult').hidden=false;
});
$('#copyInviteBtn').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('#inviteCode').textContent);toast('تم نسخ رابط الدعوة');}catch{toast('الرابط جاهز للمشاركة');}});

$('#privacyBtn').addEventListener('click',()=>toast('المواقع مشفّرة ولا تظهر إلا لأفراد العائلة الموافقين'));
$('#notificationsBtn').addEventListener('click',()=>{toast('وصلت سارة إلى المنزل بأمان');document.querySelector('.has-dot').classList.remove('has-dot');});
$('#historyBtn').addEventListener('click',()=>toast('هذا هو سجل نشاط اليوم بالكامل'));
$('#placesBtn').addEventListener('click',()=>toast('لديك منطقتان آمنتان: المنزل والجامعة'));
$('#alertsBtn').addEventListener('click',()=>toast('لا توجد تنبيهات غير مقروءة'));
$('#settingsBtn').addEventListener('click',()=>toast('وضع توفير البطارية مفعّل'));

if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
