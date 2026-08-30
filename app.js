const savedTheme = localStorage.getItem('qareeb-theme');
const systemDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
const initialTheme = savedTheme || (systemDark ? 'dark' : 'light');
document.documentElement.dataset.theme = initialTheme;
document.querySelector('meta[name="theme-color"]').content = initialTheme === 'dark' ? '#101a18' : '#f7f7f2';
window.addEventListener('DOMContentLoaded', () => window.AndroidApp?.setDark(initialTheme === 'dark'));

const $ = selector => document.querySelector(selector);
let pendingInvite = JSON.parse(localStorage.getItem('qareeb-pending-invite') || 'null');
let locationWatch = null;
let lastLocation = null;

function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

function toArabicNumber(value) {
  return String(value).replace(/\d/g, digit => '٠١٢٣٤٥٦٧٨٩'[digit]);
}

function renderFamily() {
  const hasPerson = Boolean(pendingInvite);
  $('#emptyState').hidden = hasPerson;
  $('#familyContent').hidden = !hasPerson;
  $('#memberCount').textContent = hasPerson ? '١' : '٠';
  $('#familyTitle').textContent = hasPerson ? 'دعوة واحدة معلّقة' : 'ابدأ بإضافة عائلتك';
  if (!hasPerson) return;
  const initial = pendingInvite.name.trim().charAt(0) || '؟';
  $('#pendingName').textContent = pendingInvite.name;
  $('#memberStrip').innerHTML = `<div class="member-card selected pending-member">
    <span class="avatar-wrap waiting"><span class="avatar avatar-new">${initial}</span></span>
    <span class="member-copy"><strong>${pendingInvite.name.replace(/[<>]/g, '')}</strong><small><i></i> بانتظار الموافقة</small></span>
    <button class="remove-person" id="removePersonBtn" aria-label="حذف الدعوة">×</button>
  </div>`;
  $('#removePersonBtn').addEventListener('click', () => {
    if (!confirm('هل تريد حذف هذه الدعوة؟')) return;
    pendingInvite = null;
    localStorage.removeItem('qareeb-pending-invite');
    renderFamily();
    toast('تم حذف الدعوة');
  });
}

function showInvite() {
  $('#modalBackdrop').hidden = false;
  $('#inviteResult').hidden = true;
  setTimeout(() => $('#inviteName').focus(), 50);
}

$('#themeBtn').addEventListener('click', () => {
  const dark = document.documentElement.dataset.theme !== 'dark';
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  localStorage.setItem('qareeb-theme', dark ? 'dark' : 'light');
  document.querySelector('meta[name="theme-color"]').content = dark ? '#101a18' : '#f7f7f2';
  window.AndroidApp?.setDark(dark);
  $('#themeBtn').setAttribute('aria-label', dark ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن');
  toast(dark ? 'تم تفعيل الوضع الداكن' : 'تم تفعيل الوضع الفاتح');
});

$('#searchInput').addEventListener('input', event => {
  if (!pendingInvite) return;
  const visible = pendingInvite.name.includes(event.target.value.trim());
  $('#memberStrip').style.display = visible ? 'flex' : 'none';
});

$('#myLocationBtn').addEventListener('click', () => {
  if (!navigator.geolocation) return toast('تحديد الموقع غير مدعوم على هذا الجهاز');
  if (locationWatch !== null) navigator.geolocation.clearWatch(locationWatch);
  $('#accuracyBadge').hidden = false;
  $('#accuracyText').textContent = 'جارٍ الاتصال بالأقمار الصناعية…';
  toast('جارٍ تحديد موقعك بأعلى دقة…');
  const started = Date.now();
  locationWatch = navigator.geolocation.watchPosition(position => {
    const { latitude, longitude, accuracy } = position.coords;
    lastLocation = { latitude, longitude, accuracy };
    const meters = Math.max(1, Math.round(accuracy));
    $('#accuracyText').textContent = `دقة ${toArabicNumber(meters)} متر`;
    $('#accuracyBadge').classList.toggle('excellent', meters <= 20);
    $('#mapFrame').src = `https://maps.google.com/maps?q=${latitude},${longitude}&z=${meters <= 30 ? 18 : 16}&output=embed`;
    if (meters <= 15 || Date.now() - started > 20000) {
      navigator.geolocation.clearWatch(locationWatch);
      locationWatch = null;
      toast(meters <= 20 ? 'تم تحديد موقعك بدقة ممتازة' : `تم تحديد موقعك بدقة ${toArabicNumber(meters)} متر`);
    }
  }, error => {
    $('#accuracyBadge').hidden = true;
    locationWatch = null;
    toast(error.code === 1 ? 'اسمح بالوصول إلى الموقع الدقيق من إعدادات الهاتف' : 'تعذر تحديد الموقع، جرّب في مكان مفتوح');
  }, { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 });
});

$('#fitBtn').addEventListener('click', () => {
  if (lastLocation) $('#mapFrame').src = `https://maps.google.com/maps?q=${lastLocation.latitude},${lastLocation.longitude}&z=16&output=embed`;
  else toast('حدّد موقعك أولاً من زر الموقع');
});

$('#addMemberBtn').addEventListener('click', showInvite);
$('#emptyAddBtn').addEventListener('click', showInvite);
$('#modalClose').addEventListener('click', () => $('#modalBackdrop').hidden = true);
$('#modalBackdrop').addEventListener('click', event => { if (event.target === $('#modalBackdrop')) $('#modalBackdrop').hidden = true; });
document.addEventListener('keydown', event => { if (event.key === 'Escape') $('#modalBackdrop').hidden = true; });

$('#createInviteBtn').addEventListener('click', () => {
  const name = $('#inviteName').value.trim();
  const phone = $('#invitePhone').value.trim();
  if (!name) return toast('اكتب اسم الشخص أولاً');
  if (phone && phone.replace(/\D/g, '').length < 8) return toast('تأكد من رقم الهاتف');
  const token = Math.random().toString(36).slice(2, 8).toUpperCase();
  pendingInvite = { name, phone, token, createdAt: Date.now() };
  localStorage.setItem('qareeb-pending-invite', JSON.stringify(pendingInvite));
  $('#inviteCode').textContent = `qareeb.app/join/${token}`;
  $('#inviteResult').hidden = false;
  renderFamily();
});

async function shareInvite() {
  if (!pendingInvite) return;
  const url = `https://qareeb.app/join/${pendingInvite.token}`;
  const text = `${pendingInvite.name}، أدعوك لمشاركة موقعك معي بأمان عبر تطبيق قريب.`;
  try {
    if (navigator.share) await navigator.share({ title: 'دعوة قريب', text, url });
    else { await navigator.clipboard.writeText(`${text} ${url}`); toast('تم نسخ الدعوة'); }
  } catch (error) { if (error.name !== 'AbortError') toast('الدعوة جاهزة للمشاركة'); }
}

$('#copyInviteBtn').addEventListener('click', shareInvite);
$('#shareAgainBtn').addEventListener('click', shareInvite);
$('#privacyBtn').addEventListener('click', () => toast('الموقع لا يظهر إلا بعد موافقة الشخص بشكل صريح'));
$('#notificationsBtn').addEventListener('click', () => toast('لا توجد إشعارات جديدة'));
$('#placesBtn').addEventListener('click', () => toast('أضف شخصاً أولاً لإنشاء المناطق الآمنة'));
$('#alertsBtn').addEventListener('click', () => toast('لا توجد تنبيهات'));
$('#settingsBtn').addEventListener('click', () => toast('دقة GPS العالية تعمل فقط عند طلب موقعك لتوفير البطارية'));

renderFamily();
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
