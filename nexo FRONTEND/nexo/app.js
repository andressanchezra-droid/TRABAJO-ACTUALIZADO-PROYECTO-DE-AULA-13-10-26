/* ===== Nexo · Sistema de inventario · Lógica ===== */
(function () {
  'use strict';

  /* ---------- Utilidades ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const initials = (name) => name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const norm = (t) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const Store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin espacio */ } }
  };
  const API_URL = `http://${window.location.hostname}:8000/api`;
  const csrfToken = () => document.cookie.split('; ').find((row) => row.startsWith('csrftoken='))?.split('=')[1] || '';
  async function api(path, options = {}) {
    if (!document.cookie.includes('csrftoken=')) await fetch(API_URL + '/auth/csrf/', { credentials: 'include' });
    const response = await fetch(API_URL + path, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': decodeURIComponent(csrfToken()), ...(options.headers || {}) },
      ...options
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'No fue posible completar la operación.');
    return data;
  }

  /* ---------- Iconos (SVG en línea) ---------- */
  const ICONS = {
    logo: '<path d="M12 3 8.5 5v4L12 11l3.5-2V5zM7 11.5l-3.5 2v4L7 19.5l3.5-2v-4zM17 11.5l-3.5 2v4l3.5 2 3.5-2v-4z"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M9.9 4.2A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-2.2 3.2M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a10 10 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/><path d="m2 2 20 20"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    logIn: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="m10 17 5-5-5-5M15 12H3"/>',
    logOut: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    checkCircle: '<circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    refresh: '<path d="M21 12a9 9 0 0 0-15-6.7L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 15 6.7L21 16"/><path d="M16 16h5v5"/>',
    building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/>',
    grid: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
    box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
    boxPlus: '<path d="M20 11V8l-8-5-9 5v8l9 5 2-1"/><path d="m3 8 9 5 8-5M12 13v8M19 15v6M16 18h6"/>',
    users: '<circle cx="9" cy="8" r="4"/><path d="M2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1"/><path d="M16 4a4 4 0 0 1 0 8M22 21v-1a6 6 0 0 0-4-5.6"/>',
    cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h8.1a2 2 0 0 0 2-1.5L21 8H6"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    wallet: '<path d="M20 7H5a2 2 0 0 1 0-4h13v4"/><path d="M3 5v14a2 2 0 0 0 2 2h15V7"/><path d="M16 14h2"/>',
    alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    userPlus: '<circle cx="9" cy="8" r="4"/><path d="M2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1M19 8v6M16 11h6"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>',
    clipboard: '<rect x="5" y="4" width="14" height="18" rx="2"/><path d="M9 2h6v4H9zM9 14l2 2 4-4"/>',
    bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
    lightbulb: '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z"/>',
    mouse: '<rect x="6" y="3" width="12" height="18" rx="6"/><path d="M12 7v4"/>',
    keyboard: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M7 15h10"/>',
    monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
    headphones: '<path d="M3 14v-2a9 9 0 0 1 18 0v2"/><path d="M21 15a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2zM3 15a2 2 0 0 0 2 2h1v-6H5a2 2 0 0 0-2 2z"/>',
    cable: '<path d="M9 2v4M15 2v4M7 6h10v4a5 5 0 0 1-10 0zM12 15v7"/>',
    webcam: '<circle cx="12" cy="10" r="7"/><circle cx="12" cy="10" r="3"/><path d="M7 22h10M12 17v5"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    ban: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
    external: '<path d="M7 17 17 7M8 7h9v9"/>'
  };
  const icon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;
  function paintIcons(root = document) {
    $$('[data-icon]', root).forEach((el) => { if (!el.firstElementChild) el.innerHTML = icon(el.dataset.icon); });
  }

  /* ---------- Datos iniciales ---------- */
  const SEED_USERS = [{ name: 'Ana Martínez', company: 'Nova Comercial', email: 'ana@novacomercial.mx', password: 'Nexo2026Demo', role: 'Administradora' }];
  const SEED_PRODUCTS = [
    { id: 1, name: 'Mouse inalámbrico M240', sku: 'ELE-001', cat: 'Accesorios', stock: 48, min: 10, price: 25, icon: 'mouse', active: true },
    { id: 2, name: 'Teclado compacto K380', sku: 'ELE-002', cat: 'Accesorios', stock: 32, min: 10, price: 39, icon: 'keyboard', active: true },
    { id: 3, name: 'Monitor LED 24 pulgadas', sku: 'ELE-003', cat: 'Pantallas', stock: 6, min: 10, price: 79, icon: 'monitor', active: true },
    { id: 4, name: 'Audífonos Bluetooth H600', sku: 'ELE-004', cat: 'Audio', stock: 0, min: 10, price: 59, icon: 'headphones', active: true },
    { id: 5, name: 'Cable USB-C 1 metro', sku: 'ELE-005', cat: 'Cables', stock: 18, min: 10, price: 18, icon: 'cable', active: true },
    { id: 6, name: 'Webcam Full HD C920', sku: 'ELE-006', cat: 'Accesorios', stock: 24, min: 10, price: 45, icon: 'webcam', active: true }
  ];
  const SEED_SALES = [
    { folio: 'V-1048', cliente: 'Carlos Mendoza', total: 103.24, hora: '10:35', nueva: false },
    { folio: 'V-1047', cliente: 'Laura Gómez', total: 91.64, hora: '10:12', nueva: false },
    { folio: 'V-1046', cliente: 'Público general', total: 52.20, hora: '09:48', nueva: false }
  ];
  const seedTeam = (me) => [
    { name: me.name, email: me.email, role: me.role, status: 'Activo', last: 'Hoy, ' + nowTime() },
    { name: 'Luis Rodríguez', email: 'luis@novacomercial.mx', role: 'Supervisor', status: 'Activo', last: 'Hoy, 10:28' },
    { name: 'Sofía Torres', email: 'sofia@novacomercial.mx', role: 'Vendedora', status: 'Activo', last: 'Hoy, 09:15' },
    { name: 'Diego Pérez', email: 'diego@novacomercial.mx', role: 'Vendedor', status: 'Invitación enviada', last: 'Pendiente' }
  ];
  const BASE_SALES_TODAY = 1284;
  const BASE_SALES_COUNT = 18;
  const WEEK_BASE = [1150, 1290, 1520, 1072, 1210, 1420]; // 6 días anteriores
  const CATEGORIES = ['Accesorios', 'Pantallas', 'Audio', 'Cables'];

  const nowTime = () => new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });

  /* ---------- Estado ---------- */
  const state = {
    users: Store.get('nexo_users', SEED_USERS),
    products: Store.get('nexo_products', SEED_PRODUCTS),
    sales: Store.get('nexo_sales', SEED_SALES),
    team: null,
    session: null,
    page: 'dashboard',
    tab: 'all',
    cart: { 1: 2, 2: 1 }, // igual que el mockup: 2 mouse + 1 teclado
    newImage: null
  };
  const SAMPLE_IMG = { src: 'img/audifonos.png', name: 'auriculares-studio-pro.png', meta: '320 KB · Imagen de ejemplo', sample: true };

  const saveProducts = () => Store.set('nexo_products', state.products);
  const saveSales = () => Store.set('nexo_sales', state.sales);
  const saveTeam = () => Store.set('nexo_team', state.team);
  const saveUsers = () => Store.set('nexo_users', state.users);
  async function loadRemoteData() {
    const [products, sales] = await Promise.all([api('/products/'), api('/sales/')]);
    state.products = products.products;
    state.sales = sales.sales.length ? sales.sales : SEED_SALES;
  }

  const getSession = () => Store.get('nexo_session', null) || (function () { try { return JSON.parse(sessionStorage.getItem('nexo_session')); } catch (e) { return null; } })();

  function status(p) {
    if (p.stock <= 0) return { key: 'out', label: 'Agotado', cls: 'out' };
    if (p.stock <= p.min) return { key: 'low', label: 'Stock bajo', cls: 'low' };
    return { key: 'ok', label: 'Disponible', cls: 'ok' };
  }

  /* ---------- Avisos ---------- */
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 2800);
  }

  /* ---------- Navegación entre vistas ---------- */
  function showView(id) {
    $$('.view').forEach((v) => { v.hidden = v.id !== id; });
    window.scrollTo(0, 0);
  }
  function showAuth(which) {
    $('#login-error').hidden = true;
    $('#register-error').hidden = true;
    showView('view-' + which);
  }

  const TITLES = { dashboard: 'Panel general', inventory: 'Inventario', admin: 'Administración', sales: 'Registro de ventas', add: 'Agregar producto' };
  function go(page) {
    state.page = page;
    $$('.page').forEach((p) => { p.hidden = p.id !== 'page-' + page; });
    $$('.nav-item').forEach((n) => n.classList.toggle('active', n.dataset.page === page));
    $('#crumb').textContent = TITLES[page];
    $('#sidebar').classList.remove('open');
    const render = { dashboard: renderDashboard, inventory: renderInventory, admin: renderAdmin, sales: renderSales, add: renderAdd }[page];
    render();
    window.scrollTo(0, 0);
  }

  /* ---------- Sesión ---------- */
  async function enterApp(user, remember) {
    state.session = { name: user.name, email: user.email, company: user.company, role: user.role };
    if (remember) { Store.set('nexo_session', state.session); sessionStorage.removeItem('nexo_session'); }
    else { sessionStorage.setItem('nexo_session', JSON.stringify(state.session)); localStorage.removeItem('nexo_session'); }

    try {
      const team = await api('/team/');
      state.team = team.team;
    } catch (error) {
      state.team = [];
      toast(error.message);
    }

    $('#company-name').textContent = user.company;
    $('#side-name').textContent = user.name;
    $('#side-role').textContent = user.role;
    $('#side-avatar').textContent = initials(user.name);
    $('#top-date').textContent = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }).replace(/\./g, '');
    showView('app');
    try { await loadRemoteData(); } catch (error) { toast(error.message); }
    go('dashboard');
  }

  function logout() {
    api('/auth/logout/', { method: 'POST' }).catch(() => {});
    localStorage.removeItem('nexo_session');
    sessionStorage.removeItem('nexo_session');
    state.session = null;
    closeModals();
    $('#login-email').value = 'ana@novacomercial.mx';
    $('#login-pass').value = 'Nexo2026Demo';
    showAuth('login');
    toast('Sesión cerrada correctamente');
  }

  /* ---------- 1. Inicio de sesión ---------- */
  $('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $('#login-email').value.trim().toLowerCase();
    const pass = $('#login-pass').value;
    const err = $('#login-error');
    if (!email || !pass) { err.textContent = 'Ingresa tu correo y tu contraseña.'; err.hidden = false; return; }
    api('/auth/login/', { method: 'POST', body: JSON.stringify({ email, password: pass }) })
      .then((result) => { err.hidden = true; enterApp(result.user, $('#login-remember').checked); })
      .catch((error) => { err.textContent = error.message; err.hidden = false; });
  });
  $('#forgot-link').addEventListener('click', (e) => { e.preventDefault(); toast('Te enviaremos un enlace para restablecer tu contraseña'); });

  /* ---------- 2. Registro de cuenta ---------- */
  const passOk = (p) => p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p);
  function updateStrength() {
    const p = $('#reg-pass').value, p2 = $('#reg-pass2').value;
    const box = $('#reg-strength'), txt = $('span', box);
    box.className = 'strength';
    if (!p) { box.classList.add('bad'); txt.textContent = 'Mínimo 8 caracteres, una letra y un número'; return; }
    if (!passOk(p)) { box.classList.add('err'); txt.textContent = 'Débil · usa 8 caracteres, una letra y un número'; return; }
    if (p2 && p !== p2) { box.classList.add('err'); txt.textContent = 'Las contraseñas no coinciden'; return; }
    txt.textContent = 'Contraseña segura · 8 caracteres, una letra y un número';
  }
  $('#reg-pass').addEventListener('input', updateStrength);
  $('#reg-pass2').addEventListener('input', updateStrength);

  $('#register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = $('#reg-name').value.trim(), company = $('#reg-company').value.trim();
    const email = $('#reg-email').value.trim().toLowerCase();
    const p = $('#reg-pass').value, p2 = $('#reg-pass2').value;
    const err = $('#register-error');
    const fail = (m) => { err.textContent = m; err.hidden = false; };
    if (!name || !company || !email || !p || !p2) return fail('Completa todos los campos obligatorios (*).');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Escribe un correo electrónico válido.');
    if (!passOk(p)) return fail('La contraseña debe tener mínimo 8 caracteres, una letra y un número.');
    if (p !== p2) return fail('Las contraseñas no coinciden.');
    if (!$('#reg-terms').checked) return fail('Debes aceptar los Términos de uso y la Política de privacidad.');
    api('/auth/register/', { method: 'POST', body: JSON.stringify({ name, company, email, password: p }) })
      .then((result) => {
        err.hidden = true;
        $('#register-form').reset();
        updateStrength();
        toast('¡Cuenta creada! Bienvenido/a a Nexo');
        enterApp(result.user, true);
      })
      .catch((error) => fail(error.message));
  });

  /* mostrar / ocultar contraseña */
  $$('[data-eye]').forEach((btn) => btn.addEventListener('click', () => {
    const input = $('#' + btn.dataset.eye);
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.innerHTML = icon(show ? 'eye' : 'eyeOff');
  }));
  $$('[data-auth]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); showAuth(a.dataset.auth); }));
  $$('[data-toast]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); toast(a.dataset.toast); }));

  /* ---------- 3. Panel general ---------- */
  function renderDashboard() {
    const s = state.session;
    const first = s.name.split(' ')[0];
    const today = new Date();
    $('#dash-title').textContent = `Hola, ${first}. Todo bajo control.`;
    $('#dash-sub').textContent = `Este es el pulso de ${s.company} hoy, ${today.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }).replace(',', '')}.`;

    const nuevas = state.sales.filter((v) => v.nueva);
    const salesToday = BASE_SALES_TODAY + nuevas.reduce((a, v) => a + v.total, 0);
    const active = state.products.filter((p) => p.active);
    const units = state.products.reduce((a, p) => a + p.stock, 0);
    const value = state.products.reduce((a, p) => a + p.stock * p.price, 0);
    const low = active.filter((p) => status(p).key === 'low').length;
    const out = active.filter((p) => status(p).key === 'out').length;
    const cats = new Set(active.map((p) => p.cat)).size;

    $('#k-sales').textContent = money(salesToday);
    $('#k-sales-sub').textContent = `↗ 12.8% vs. ayer · ${BASE_SALES_COUNT + nuevas.length} ventas`;
    $('#k-active').textContent = active.length;
    $('#k-active-sub').textContent = `${cats} categorías de productos`;
    $('#k-units').textContent = units;
    $('#k-units-sub').textContent = `Valor de venta: ${money(value)}`;
    $('#k-alerts').textContent = low + out;
    $('#k-alerts-sub').textContent = `${low} stock bajo · ${out} agotado${out === 1 ? '' : 's'}`;

    /* gráfica semanal */
    const values = WEEK_BASE.concat([salesToday]);
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    $('#week-total').textContent = money(values.reduce((a, v) => a + v, 0));
    $('#bars').innerHTML = values.map((v, i) => {
      const d = days[(today.getDay() - (6 - i) + 7) % 7];
      const h = Math.min(100, Math.round((v / 2000) * 100));
      return `<div class="bar-col"><div class="bar ${i === 6 ? 'today' : ''}" style="height:${h}%" title="${money(v)}"></div><span>${d}</span></div>`;
    }).join('');

    /* necesitan atención */
    const att = active.filter((p) => status(p).key !== 'ok').slice(0, 3);
    $('#attention').innerHTML = att.length ? att.map((p) => {
      const st = status(p);
      return `<li><div class="att-name">${icon('box')} ${esc(p.name)}</div>
        <div class="att-meta"><span>${p.stock} unidades · mínimo ${p.min}</span><span class="pill ${st.cls}">${st.label}</span></div></li>`;
    }).join('') : '<li class="muted" style="border:0">Todo en orden, no hay productos por reponer.</li>';

    /* últimas ventas */
    $('#recent-sales').innerHTML = state.sales.slice(0, 3).map((v) =>
      `<tr><td><a>${esc(v.folio)}</a></td><td>${esc(v.cliente)}</td><td><b>${money(v.total)}</b></td><td class="muted">${esc(v.hora)}</td></tr>`).join('');
  }

  /* ---------- 4. Inventario ---------- */
  function fillCategorySelect() {
    const sel = $('#inv-cat');
    const current = sel.value;
    const cats = Array.from(new Set(CATEGORIES.concat(state.products.map((p) => p.cat))));
    sel.innerHTML = '<option value="">Todas las categorías</option>' + cats.map((c) => `<option>${esc(c)}</option>`).join('');
    sel.value = cats.includes(current) ? current : '';
  }

  function renderInventory() {
    fillCategorySelect();
    const all = state.products;
    const lowN = all.filter((p) => status(p).key === 'low').length;
    const outN = all.filter((p) => status(p).key === 'out').length;
    const outNames = all.filter((p) => status(p).key === 'out').map((p) => p.name);
    $('#i-total').textContent = all.length;
    $('#i-total-sub').textContent = `${new Set(all.map((p) => p.cat)).size} categorías · 1 almacén`;
    $('#i-units').textContent = all.reduce((a, p) => a + p.stock, 0);
    $('#i-low').textContent = lowN;
    $('#i-out').textContent = outN;
    $('#i-out-sub').textContent = outNames.length ? outNames.slice(0, 1).join('') + (outNames.length > 1 ? ` y ${outNames.length - 1} más` : '') : 'Sin productos agotados';
    $('#c-all').textContent = all.length;
    $('#c-low').textContent = lowN;
    $('#c-out').textContent = outN;
    $$('#inv-tabs .tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === state.tab));

    const q = norm($('#inv-search').value.trim());
    const cat = $('#inv-cat').value;
    const rows = all.filter((p) => {
      if (state.tab !== 'all' && status(p).key !== state.tab) return false;
      if (cat && p.cat !== cat) return false;
      return !q || norm(p.name).includes(q) || norm(p.sku).includes(q);
    });
    $('#inv-body').innerHTML = rows.length ? rows.map((p) => {
      const st = status(p);
      const thumb = p.image ? `<img src="${p.image}" alt="">` : icon(p.icon || 'box');
      return `<tr>
        <td><div class="prod-cell"><span class="thumb">${thumb}</span><div><strong>${esc(p.name)}</strong><small>${esc(p.sku)}</small></div></div></td>
        <td class="muted">${esc(p.cat)}</td>
        <td><b>${p.stock} uds.</b></td>
        <td>${money(p.price)}</td>
        <td><span class="pill ${st.cls}">${st.label}</span>${p.active ? '' : ' <span class="pill gray">Inactivo</span>'}</td>
        <td><button class="icon-btn" data-del="${p.id}" aria-label="Eliminar producto" title="Eliminar producto">${icon('trash')}</button></td>
      </tr>`;
    }).join('') : '<tr class="empty-row"><td colspan="6">No se encontraron productos.</td></tr>';
  }

  $('#inv-tabs').addEventListener('click', (e) => {
    const t = e.target.closest('.tab'); if (!t) return;
    state.tab = t.dataset.tab; renderInventory();
  });
  $('#inv-search').addEventListener('input', renderInventory);
  $('#inv-cat').addEventListener('change', renderInventory);
  $('#inv-body').addEventListener('click', (e) => {
    const b = e.target.closest('[data-del]'); if (!b) return;
    const p = state.products.find((x) => x.id === +b.dataset.del);
    if (p && confirm(`¿Eliminar "${p.name}" del inventario?`)) {
      api(`/products/${p.id}/delete/`, { method: 'DELETE' }).then(() => {
        state.products = state.products.filter((x) => x.id !== p.id);
        delete state.cart[p.id];
        renderInventory(); toast('Producto eliminado');
      }).catch((error) => toast(error.message));
    }
  });

  /* ---------- 5. Administración ---------- */
  function renderAdmin() {
    $('#team-title').textContent = `Equipo de ${state.session.company}`;
    const active = state.team.filter((m) => m.status === 'Activo').length;
    const pend = state.team.length - active;
    $('#team-sub').textContent = `${state.team.length} usuarios · ${active} activos · ${pend} invitación${pend === 1 ? '' : 'es'} pendiente${pend === 1 ? '' : 's'}`;
    const q = norm($('#team-search').value.trim());
    const rows = state.team.filter((m) => !q || norm(m.name).includes(q) || norm(m.email).includes(q));
    $('#team-body').innerHTML = rows.length ? rows.map((m) => {
      const me = m.email === state.session.email;
      return `<tr>
        <td><div class="user-cell"><span class="avatar">${esc(initials(m.name))}</span><div><strong>${esc(m.name)}${me ? ' (tú)' : ''}</strong><small>${esc(m.email)}</small></div></div></td>
        <td><span class="pill gray">${esc(m.role)}</span></td>
        <td><span class="pill ${m.status === 'Activo' ? 'ok' : 'low'}">${esc(m.status)}</span></td>
        <td class="muted">${esc(m.last)}</td>
      </tr>`;
    }).join('') : '<tr class="empty-row"><td colspan="4">No se encontraron usuarios.</td></tr>';
  }
  $('#team-search').addEventListener('input', renderAdmin);

  $('#open-invite').addEventListener('click', () => {
    $('#invite-form').reset(); $('#invite-error').hidden = true; openModal('invite-modal'); $('#inv-name').focus();
  });
  $('#invite-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#inv-name').value.trim(), email = $('#inv-email').value.trim().toLowerCase(), role = $('#inv-role').value;
    const err = $('#invite-error');
    const fail = (m) => { err.textContent = m; err.hidden = false; };
    if (!name || !email) return fail('Completa el nombre y el correo.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Escribe un correo electrónico válido.');
    if (state.team.some((m) => m.email.toLowerCase() === email)) return fail('Ese correo ya está en el equipo.');
    api('/team/create/', { method: 'POST', body: JSON.stringify({ name, email, role }) }).then((result) => {
      state.team.push(result.member);
      closeModals(); renderAdmin(); toast(`Invitación enviada a ${email}`);
    }).catch((error) => fail(error.message));
  });

  /* ---------- 6. Registro de ventas ---------- */
  const nextFolio = () => 'V-' + (Math.max.apply(null, state.sales.map((v) => parseInt(v.folio.slice(2), 10))) + 1);

  function renderSales() {
    $('#s-date').value = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
    $('#s-folio').textContent = 'Folio ' + nextFolio();
    renderProductGrid();
    renderCart();
  }

  function renderProductGrid() {
    const q = norm($('#s-search').value.trim());
    const list = state.products.filter((p) => p.active && (!q || norm(p.name).includes(q) || norm(p.sku).includes(q)));
    $('#product-grid').innerHTML = list.length ? list.map((p) => {
      const out = p.stock <= 0;
      return `<button type="button" class="p-tile" data-add="${p.id}" ${out ? 'disabled' : ''}>
        <div class="t-top">${icon(p.icon || 'box')}${icon(out ? 'ban' : 'plus')}</div>
        <strong>${esc(p.name)}</strong>
        <div class="t-bot"><b>${money(p.price)}</b>${out ? '<span class="red">Agotado</span>' : `<span>${p.stock} disponibles</span>`}</div>
      </button>`;
    }).join('') : '<p class="muted" style="grid-column:1/-1">No hay productos que coincidan.</p>';
  }

  function renderCart() {
    const ids = Object.keys(state.cart).map(Number).filter((id) => state.products.some((p) => p.id === id));
    state.cart = ids.reduce((o, id) => { o[id] = state.cart[id]; return o; }, {});
    let units = 0, subtotal = 0;
    const html = ids.map((id) => {
      const p = state.products.find((x) => x.id === id), q = state.cart[id];
      units += q; subtotal += q * p.price;
      return `<div class="cart-item">
        <div class="cart-info"><strong>${esc(p.name)}</strong><small>${esc(p.sku)} · ${money(p.price)} / unidad</small></div>
        <div class="qty"><button type="button" data-dec="${id}" aria-label="Menos">${icon('minus')}</button><span>${q}</span><button type="button" data-inc="${id}" aria-label="Más">${icon('plus')}</button></div>
        <div class="cart-price">${money(q * p.price)}</div>
        <button type="button" class="icon-btn" data-rm="${id}" aria-label="Quitar">${icon('trash')}</button>
      </div>`;
    }).join('');
    $('#cart-list').innerHTML = html || '<p class="cart-empty">Aún no agregas productos. Elige uno de la lista de arriba.</p>';
    $('#cart-sub').textContent = `${ids.length} producto${ids.length === 1 ? '' : 's'} · ${units} unidad${units === 1 ? '' : 'es'}`;
    const iva = subtotal * 0.16;
    $('#s-sub').textContent = money(subtotal);
    $('#s-iva').textContent = money(iva);
    $('#s-total').textContent = money(subtotal + iva);
    $('#sale-error').hidden = true;
  }

  $('#s-search').addEventListener('input', renderProductGrid);
  $('#product-grid').addEventListener('click', (e) => {
    const b = e.target.closest('[data-add]'); if (!b) return;
    const p = state.products.find((x) => x.id === +b.dataset.add);
    const cur = state.cart[p.id] || 0;
    if (cur >= p.stock) return toast(`Solo hay ${p.stock} unidades de ${p.name}`);
    state.cart[p.id] = cur + 1; renderCart();
  });
  $('#cart-list').addEventListener('click', (e) => {
    const inc = e.target.closest('[data-inc]'), dec = e.target.closest('[data-dec]'), rm = e.target.closest('[data-rm]');
    if (inc) {
      const id = +inc.dataset.inc, p = state.products.find((x) => x.id === id);
      if (state.cart[id] >= p.stock) return toast(`Solo hay ${p.stock} unidades disponibles`);
      state.cart[id]++;
    } else if (dec) {
      const id = +dec.dataset.dec; state.cart[id]--; if (state.cart[id] <= 0) delete state.cart[id];
    } else if (rm) { delete state.cart[+rm.dataset.rm]; } else return;
    renderCart();
  });
  $('#cancel-sale').addEventListener('click', () => { state.cart = {}; renderCart(); toast('Venta cancelada'); });
  $('#confirm-sale').addEventListener('click', () => {
    const ids = Object.keys(state.cart).map(Number);
    if (!ids.length) { const er = $('#sale-error'); er.textContent = 'Agrega al menos un producto para registrar la venta.'; er.hidden = false; return; }
    let subtotal = 0;
    ids.forEach((id) => {
      const p = state.products.find((x) => x.id === id);
      subtotal += state.cart[id] * p.price;
    });
    const folio = nextFolio();
    state.sales.unshift({ folio, cliente: $('#s-client').value, total: +(subtotal * 1.16).toFixed(2), hora: nowTime(), nueva: true });
    api('/sales/create/', { method: 'POST', body: JSON.stringify({
      customer: $('#s-client').value, items: ids.map((id) => ({ id, quantity: state.cart[id] }))
    }) }).then((result) => {
      state.products = state.products.map((product) => {
        const sold = state.cart[product.id] || 0;
        return sold ? { ...product, stock: product.stock - sold } : product;
      });
      state.sales.unshift(result.sale);
      state.cart = {};
      toast(`Venta ${result.sale.folio} registrada. Stock actualizado.`);
      renderSales();
    }).catch((error) => toast(error.message));
  });

  /* ---------- 7. Agregar producto ---------- */
  function renderImage() {
    const box = $('#img-box'), img = state.newImage;
    box.innerHTML = img ? `<img src="${img.src}" alt="Vista previa del producto">` : `${icon('upload')}<small>Sin imagen</small>`;
    $('#file-row').hidden = !img;
    if (img) { $('#file-name').textContent = img.name; $('#file-meta').textContent = img.meta; }
    $('#img-change').lastChild.textContent = img ? ' Cambiar imagen' : ' Subir imagen';
  }
  function resetAddForm() {
    $('#add-form').reset();
    $('#p-cat').value = 'Audio';
    $('#add-error').hidden = true;
    state.newImage = Object.assign({}, SAMPLE_IMG);
    renderImage();
  }
  function renderAdd() { if (!state.newImage && !$('#p-name').value) resetAddForm(); else renderImage(); }

  $('#img-change').addEventListener('click', () => $('#img-input').click());
  $('#img-remove').addEventListener('click', () => { state.newImage = null; renderImage(); });
  $('#img-input').addEventListener('change', (e) => {
    const f = e.target.files[0]; if (!f) return;
    const er = $('#add-error');
    if (!/^image\/(png|jpeg)$/.test(f.type)) { er.textContent = 'La imagen debe ser JPG o PNG.'; er.hidden = false; return; }
    if (f.size > 5 * 1024 * 1024) { er.textContent = 'La imagen supera el máximo de 5 MB.'; er.hidden = false; return; }
    er.hidden = true;
    const reader = new FileReader();
    reader.onload = () => {
      const im = new Image();
      im.onload = () => { // se reduce para no llenar el almacenamiento del navegador
        const max = 320, ratio = Math.min(1, max / Math.max(im.width, im.height));
        const c = document.createElement('canvas'); c.width = Math.round(im.width * ratio); c.height = Math.round(im.height * ratio);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        state.newImage = { src: c.toDataURL('image/jpeg', 0.8), name: f.name, meta: Math.max(1, Math.round(f.size / 1024)) + ' KB · Imagen cargada' };
        renderImage();
      };
      im.src = reader.result;
    };
    reader.readAsDataURL(f);
    e.target.value = '';
  });

  $('#add-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#p-name').value.trim(), sku = $('#p-sku').value.trim().toUpperCase();
    const price = parseFloat($('#p-price').value), cost = parseFloat($('#p-cost').value);
    const stock = parseInt($('#p-stock').value, 10), min = parseInt($('#p-min').value, 10);
    const er = $('#add-error');
    const fail = (m) => { er.textContent = m; er.hidden = false; };
    if (!name || !sku || isNaN(cost) || isNaN(price) || isNaN(stock) || isNaN(min)) return fail('Completa todos los campos obligatorios (*).');
    if (cost < 0 || price < 0 || stock < 0 || min < 0) return fail('Los precios y el stock no pueden ser negativos.');
    if (state.products.some((p) => p.sku.toUpperCase() === sku)) return fail('Ya existe un producto con ese código SKU.');
    const id = Math.max(0, ...state.products.map((p) => p.id)) + 1;
    const productData = {
      name, sku, cat: $('#p-cat').value, stock, min, price, cost,
      desc: $('#p-desc').value.trim(), active: $('#p-state').value === 'Activo',
      icon: 'box', image: state.newImage ? state.newImage.src : null
    };
    api('/products/create/', { method: 'POST', body: JSON.stringify(productData) }).then((result) => {
      state.products.push(result.product);
      state.newImage = null;
      $('#add-form').reset();
      toast(`Producto "${name}" guardado en el inventario`);
      go('inventory');
    }).catch((error) => fail(error.message));
  });
  $('#add-cancel').addEventListener('click', () => { resetAddForm(); go('inventory'); });

  /* ---------- 8. Modales (cerrar sesión / invitar) ---------- */
  function openModal(id) { $('#' + id).hidden = false; }
  function closeModals() { $$('.modal-backdrop').forEach((m) => { m.hidden = true; }); }

  $('#open-logout').addEventListener('click', () => {
    const s = state.session;
    $('#m-name').textContent = s.name;
    $('#m-email').textContent = s.email;
    $('#m-avatar').textContent = initials(s.name);
    $('#logout-text').textContent = `Saldrás de tu cuenta de ${s.company}. Para volver a gestionar el inventario, tendrás que iniciar sesión de nuevo.`;
    openModal('logout-modal');
  });
  $('#confirm-logout').addEventListener('click', logout);
  $$('[data-close]').forEach((b) => b.addEventListener('click', closeModals));
  $$('.modal-backdrop').forEach((m) => m.addEventListener('mousedown', (e) => { if (e.target === m) closeModals(); }));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModals(); });

  /* ---------- Navegación general ---------- */
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-page]');
    if (t && state.session) { e.preventDefault(); go(t.dataset.page); }
  });
  $('#menu-btn').addEventListener('click', () => $('#sidebar').classList.toggle('open'));

  /* ---------- Arranque ---------- */
  paintIcons();
  showAuth('login');
})();
