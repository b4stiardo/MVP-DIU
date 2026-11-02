import React, { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard, CalendarDays, NotebookTabs, ClipboardCheck, BellRing,
  ChevronRight, ChevronLeft, ArrowRight, CheckCircle2, Info, UtensilsCrossed,
  CalendarRange, X, AlertTriangle, RotateCcw, MapPin, Clock3, Leaf,
  Check, ShieldCheck, Trash2, Plus, CheckCheck, CalendarX2
} from 'lucide-react';
import {
  CAMPUS, WEEKS, DATE_KEYS, DIETS, TYPE_META, INITIAL_RESERVATIONS,
  getMenus, getMenuById, applyDiet, shortDate, longDate, dateLabel
} from './data.js';

const STORAGE_KEY = 'casino-usm-mvp-v1';
const ROUTES = ['inicio', 'minuta', 'planificar', 'reservas'];
const NAV = [
  { id: 'inicio', label: 'Inicio', icon: LayoutDashboard },
  { id: 'minuta', label: 'Minuta', icon: NotebookTabs },
  { id: 'planificar', label: 'Planificar', icon: CalendarRange },
  { id: 'reservas', label: 'Mis reservas', icon: ClipboardCheck },
];
function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const val = JSON.parse(raw);
      if (Array.isArray(val.reservations) && Array.isArray(val.history)) return val;
    }
  } catch { /* El prototipo funciona igualmente sin almacenamiento persistente. */ }
  return { reservations: INITIAL_RESERVATIONS, history: [] };
}
function Initials() { return <span className="avatar" aria-hidden="true">FS</span>; }
function MenuPill({ type }) {
  const info = TYPE_META[type] || TYPE_META.general;
  return <span className={`pill pill-${info.tint}`}>{info.icon} {info.label}</span>;
}
function formatWeek(index) {
  const days = WEEKS[index];
  if (!days) return '';
  return `${dateLabel(days[0], { day: 'numeric', month: 'short' })} — ${dateLabel(days[4], { day: 'numeric', month: 'short', year: 'numeric' })}`;
}
function SectionHead({ kicker, title, description, action }) {
  return <div className="section-head"><div><div className="eyebrow">{kicker}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}
function EmptyState({ icon: Icon = CalendarDays, title, description, action }) {
  return <div className="empty-state"><div className="empty-icon"><Icon size={25} /></div><h3>{title}</h3><p>{description}</p>{action}</div>;
}
function DietBar({ diet, onDiet, compact = false }) {
  return <div className={`diet-bar ${compact ? 'compact-diets' : ''}`} role="group" aria-label="Filtrar por necesidad alimentaria">
    {DIETS.map(item => <button key={item.id} className={`diet-button ${diet === item.id ? 'selected' : ''}`} aria-pressed={diet === item.id} onClick={() => onDiet(item.id)}>{item.label}</button>)}
  </div>;
}
function MealCard({ menu, actionLabel, selected = false, disabled = false, onPick, highlight = false }) {
  const type = TYPE_META[menu.type];
  return <article className={`meal-card ${selected ? 'is-selected' : ''} ${highlight ? 'is-highlighted' : ''}`}>
    <div className="meal-top"><div className={`meal-symbol meal-${type.tint}`}>{type.icon}</div><div className="meal-meta"><MenuPill type={menu.type} />{selected && <span className="selected-indicator"><Check size={14} /> Seleccionado</span>}</div></div>
    <h3>{menu.title}</h3><p className="meal-detail">{menu.detail}</p>
    <div className="allergen-note">{menu.allergens.length > 0 ? `Ingredientes declarados con: ${menu.allergens.join(', ')}.` : 'Sin alérgenos destacados en la ficha de ejemplo.'}</div>
    <button type="button" disabled={disabled} className={`btn ${selected ? 'btn-soft' : 'btn-outline'} meal-action`} onClick={() => onPick(menu)}>
      {selected ? <><Check size={17} /> Quitar selección</> : <><Plus size={17} /> {actionLabel}</>}
    </button>
  </article>;
}
function WeekControls({ week, setWeek }) {
  return <div className="week-controls" aria-label="Navegación por semanas"><button className="icon-button" disabled={week === 0} onClick={() => setWeek(week - 1)} aria-label="Semana anterior"><ChevronLeft size={20} /></button><span>{formatWeek(week)}</span><button className="icon-button" disabled={week === WEEKS.length - 1} onClick={() => setWeek(week + 1)} aria-label="Semana siguiente"><ChevronRight size={20} /></button></div>;
}
function DateStrip({ week, date, onDate }) {
  return <div className="date-strip" role="group" aria-label="Días disponibles">{WEEKS[week].map(key => <button key={key} className={`date-button ${key === date ? 'active' : ''}`} aria-pressed={key === date} onClick={() => onDate(key)}><span className="date-weekday">{dateLabel(key, { weekday: 'short' }).replace('.', '')}</span><span className="date-number">{dateLabel(key, { day: 'numeric' })}</span><span className="date-month">{dateLabel(key, { month: 'short' }).replace('.', '')}</span></button>)}</div>;
}
function ConfirmationModal({ reservation, onClose, onConfirm }) {
  const menu = getMenuById(reservation.menuId);
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="modal" role="dialog" aria-modal="true" aria-labelledby="cancel-dialog-title">
      <button className="modal-dismiss icon-button" onClick={onClose} aria-label="Cerrar"><X size={20} /></button>
      <div className="modal-symbol"><CalendarX2 size={27} /></div>
      <h2 id="cancel-dialog-title">¿Cancelar este almuerzo?</h2>
      <p>Solo se cancelará la fecha seleccionada. Tus otras reservas seguirán activas.</p>
      <div className="modal-order"><strong>{longDate(reservation.date)}</strong><span>{menu?.title ?? 'Almuerzo'} · Campus {reservation.campus}</span></div>
      <div className="modal-actions"><button className="btn btn-outline" onClick={onClose}>Conservar reserva</button><button className="btn btn-danger" onClick={() => onConfirm(reservation)}><Trash2 size={17} /> Confirmar cancelación</button></div>
      <small>Reglas y plazos de cancelación no implementados; deben validarse con el casino real.</small>
    </section>
  </div>;
}
function ResetModal({ onClose, onConfirm }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="reset-title"><button className="modal-dismiss icon-button" onClick={onClose} aria-label="Cerrar"><X size={20} /></button><div className="modal-symbol"><RotateCcw size={27}/></div><h2 id="reset-title">¿Reiniciar demostración?</h2><p>Se borrarán las reservas que realizaste durante la prueba y volverá a aparecer la reserva inicial de ejemplo.</p><div className="modal-actions"><button className="btn btn-outline" onClick={onClose}>Volver</button><button className="btn btn-primary" onClick={onConfirm}>Sí, reiniciar</button></div></section></div>;
}
function TopBar({ campus, setCampus, reset }) {
  return <header className="topbar"><div className="topbar-trail"><span>Servicios universitarios</span><ChevronRight size={14}/><strong>Casino de alimentación</strong></div><div className="topbar-actions"><label className="campus-picker"><MapPin size={16}/><span className="sr-only">Campus seleccionado</span><select value={campus} onChange={(e) => setCampus(e.target.value)}>{CAMPUS.map(c => <option key={c} value={c}>Campus {c}</option>)}</select></label><button className="reset-button" onClick={reset} title="Reiniciar datos de prueba"><RotateCcw size={16}/><span>Reiniciar demo</span></button><Initials /></div></header>;
}
export default function App() {
  const [active, setActive] = useState(() => { const url = window.location.hash.replace('#', ''); return ROUTES.includes(url) ? url : 'inicio'; });
  const [campus, setCampus] = useState(CAMPUS[0]);
  const [week, setWeek] = useState(0);
  const [selectedDate, setSelectedDate] = useState(DATE_KEYS[0]);
  const [diet, setDiet] = useState('todos');
  const [draft, setDraft] = useState({});
  const [saved, setSaved] = useState(loadSaved);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [planError, setPlanError] = useState('');

  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); } catch { /* demo sin persistencia */ } }, [saved]);
  useEffect(() => {
    const change = () => { const hash = window.location.hash.replace('#', ''); if (ROUTES.includes(hash)) setActive(hash); };
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);
  useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(null), 5600); return () => clearTimeout(id); }, [toast]);
  useEffect(() => { if (cancelTarget || resetOpen) { const onKey = e => { if (e.key === 'Escape') { setCancelTarget(null); setResetOpen(false); } }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); } }, [cancelTarget, resetOpen]);

  const reservations = [...saved.reservations].sort((a, b) => a.date.localeCompare(b.date));
  const bookedDates = new Set(reservations.map(r => r.date));
  const nextReservation = reservations[0] || null;
  const selectedMeals = applyDiet(getMenus(selectedDate, campus), diet);
  const draftEntries = Object.values(draft).sort((a, b) => a.date.localeCompare(b.date));
  const canReserve = draftEntries.length > 0;
  const toastMessage = msg => setToast(msg);
  function navigate(page) { setActive(page); if (window.location.hash !== `#${page}`) window.location.hash = page; window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function switchWeek(newWeek) { setWeek(newWeek); setSelectedDate(WEEKS[newWeek][0]); setPlanError(''); }
  function togglePick(menu) {
    setPlanError('');
    if (bookedDates.has(menu.date)) { setPlanError('Ya tienes una reserva para esa fecha. Puedes cancelarla desde Mis reservas.'); return; }
    setDraft(old => { const next = { ...old }; if (next[menu.date]?.id === menu.id) delete next[menu.date]; else next[menu.date] = menu; return next; });
  }
  function bookAll() {
    if (!canReserve) { setPlanError('Selecciona al menos un menú.'); return; }
    const duplicates = draftEntries.filter(menu => bookedDates.has(menu.date));
    if (duplicates.length) { setPlanError('Una o más fechas ya tienen reservas. Revisa tu selección.'); return; }
    const newRes = draftEntries.map((menu, index) => ({ id: `RES-${Date.now()}-${index + 1}`, menuId: menu.id, date: menu.date, campus: menu.campus, createdAt: new Date().toISOString() }));
    setSaved(old => ({ ...old, reservations: [...old.reservations, ...newRes] }));
    setDraft({}); setPlanError('');
    toastMessage(`${newRes.length} ${newRes.length === 1 ? 'almuerzo reservado' : 'almuerzos reservados'} correctamente. Puedes revisar o cancelar fechas individuales.`);
    navigate('reservas');
  }
  function cancelReservation(reservation) {
    setSaved(old => ({ reservations: old.reservations.filter(r => r.id !== reservation.id), history: [{ ...reservation, canceledAt: new Date().toISOString() }, ...old.history] }));
    setCancelTarget(null);
    toastMessage(`Reserva del ${shortDate(reservation.date)} cancelada. Las demás siguen activas.`);
  }
  function resetDemo() {
    setSaved({ reservations: INITIAL_RESERVATIONS, history: [] }); setDraft({}); setDiet('todos'); setWeek(0); setSelectedDate(DATE_KEYS[0]); setCampus(CAMPUS[0]); setHistoryOpen(false); setResetOpen(false); setPlanError('');
    toastMessage('Datos reiniciados. Hay una reserva de ejemplo el jueves 5 de noviembre.');
    navigate('inicio');
  }
  function chooseFromMinuta(menu) { togglePick(menu); if (!bookedDates.has(menu.date)) toastMessage('Menú agregado a tu planificación. Puedes elegir otros días antes de confirmar.'); }
  const totalDraft = draftEntries.length;

  return <div className="app-shell">
    <aside className="sidebar" aria-label="Navegación principal">
      <div className="brand"><span className="brand-mark"><UtensilsCrossed size={23}/></span><div className="brand-name">Casino <strong>USM</strong><span>Planificación de almuerzos</span></div></div>
      <div className="sidebar-caption">TU ESPACIO</div>
      <nav className="side-nav">{NAV.map(item => { const Icon = item.icon; return <button key={item.id} className={`side-link ${active === item.id ? 'active' : ''}`} aria-current={active === item.id ? 'page' : undefined} onClick={() => navigate(item.id)}><Icon size={19}/><span>{item.label}</span>{item.id === 'planificar' && totalDraft > 0 && <b className="nav-count">{totalDraft}</b>}</button>; })}</nav>
      <div className="sidebar-bottom"><div className="side-profile"><Initials/><div><strong>Federico Santa María</strong><span>Docente · Usuario de prueba</span></div></div></div>
    </aside>
    <div className="main-area">
      <TopBar campus={campus} setCampus={setCampus} reset={() => setResetOpen(true)} />
      <main className="page-content">
        {active === 'inicio' && <>
          <section className="home-actions-card" aria-label="Accesos directos de inicio"><div className="home-actions-row"><button className="btn home-btn-secondary" onClick={() => navigate('planificar')}>Planificar mi semana <ArrowRight size={18}/></button><button className="btn home-btn-primary" onClick={() => navigate('minuta')}>Explorar minuta</button></div></section>
          <div className="stats-grid"><div className="stat-card"><span className="stat-icon blue"><ClipboardCheck size={20}/></span><div><strong>{reservations.length}</strong><span>Reservas activas</span></div></div><div className="stat-card"><span className="stat-icon green"><CalendarRange size={20}/></span><div><strong>{totalDraft}</strong><span>Almuerzos por confirmar</span></div></div><div className="stat-card"><span className="stat-icon amber"><ShieldCheck size={20}/></span><div><strong>3</strong><span>Metas del MVP</span></div></div></div>
          <div className="home-split"><section className="panel"><div className="panel-title"><div><div className="eyebrow">SIGUIENTE ALMUERZO</div><h2>Tu próxima reserva</h2></div><button className="text-action" onClick={() => navigate('reservas')}>Ver mis reservas <ArrowRight size={16}/></button></div>{nextReservation ? <div className="next-booking"><div className="booking-calendar"><strong>{dateLabel(nextReservation.date, { day: 'numeric' })}</strong><span>{dateLabel(nextReservation.date, { month: 'short' })}</span></div><div className="next-booking-body"><strong>{getMenuById(nextReservation.menuId)?.title}</strong><span><MapPin size={15}/> Campus {nextReservation.campus}</span><span><CheckCircle2 size={15}/> Reserva confirmada (simulada)</span></div></div> : <EmptyState title="Todavía no tienes reservas" description="Elige un menú y reserva tus próximos almuerzos." action={<button className="btn btn-primary" onClick={() => navigate('planificar')}>Crear reserva</button>} />}</section>
          <section className="panel"><div className="panel-title"><div><div className="eyebrow">TRES PASOS</div><h2>Todo en un solo lugar</h2></div></div><div className="step-list"><button onClick={() => navigate('minuta')}><span>01</span><div><strong>Encuentra un menú adecuado</strong><small>Revisa alternativas y sus ingredientes.</small></div><ChevronRight size={17}/></button><button onClick={() => navigate('planificar')}><span>02</span><div><strong>Reserva varios días</strong><small>Confirma toda tu planificación de una vez.</small></div><ChevronRight size={17}/></button><button onClick={() => navigate('reservas')}><span>03</span><div><strong>Cambia tus planes con libertad</strong><small>Cancela solo el día que no ocuparás.</small></div><ChevronRight size={17}/></button></div></section></div>
        </>}
        {active === 'minuta' && <>
          <SectionHead kicker="META 1 · ELECCIÓN INFORMADA" title="Minuta de almuerzos" description="Explora las alternativas disponibles y elige un almuerzo según tus necesidades alimentarias." action={<button className="btn btn-outline desktop-action" onClick={() => navigate('planificar')}><CalendarRange size={18}/> Ver planificación {totalDraft > 0 ? `(${totalDraft})` : ''}</button>}/>
          <section className="panel controls-panel"><div className="controls-row"><div><label className="control-label">Semana de atención</label><WeekControls week={week} setWeek={switchWeek}/></div><div className="selection-tip"><MapPin size={17}/> Campus {campus}</div></div><DateStrip week={week} date={selectedDate} onDate={setSelectedDate}/><div className="filter-block"><div className="control-label">Filtrar alternativas</div><DietBar diet={diet} onDiet={setDiet}/></div></section>
          <div className="menu-result-head"><div><span className="eyebrow">MENÚS DE EJEMPLO</span><h2>{longDate(selectedDate)}</h2></div><span className="result-count">{selectedMeals.length} {selectedMeals.length === 1 ? 'alternativa' : 'alternativas'}</span></div>
          {bookedDates.has(selectedDate) && <div className="inline-notice good"><CheckCircle2 size={19}/> Ya tienes un almuerzo reservado para esta fecha. Si necesitas cancelarlo, puedes ir a <button onClick={() => navigate('reservas')}>Mis reservas</button>.</div>}
          {selectedMeals.length ? <div className="meals-grid">{selectedMeals.map(menu => <MealCard key={menu.id} menu={menu} actionLabel="Elegir este menú" selected={draft[selectedDate]?.id === menu.id} disabled={bookedDates.has(selectedDate)} onPick={chooseFromMinuta}/>)}</div> : <EmptyState icon={Leaf} title="Sin alternativas para este filtro" description="Prueba otra categoría o cambia el día seleccionado." action={<button className="btn btn-outline" onClick={() => setDiet('todos')}>Ver todos los menús</button>} />}
          {totalDraft > 0 && <div className="cta-bottom"><div><strong>{totalDraft} {totalDraft === 1 ? 'menú seleccionado' : 'menús seleccionados'}</strong><span>Puedes continuar agregando fechas.</span></div><button className="btn btn-primary" onClick={() => navigate('planificar')}>Ir a planificación <ArrowRight size={18}/></button></div>}
        </>}
        {active === 'planificar' && <>
          <SectionHead kicker="META 2 · PLANIFICACIÓN FLEXIBLE" title="Planifica tus almuerzos" description="Elige un menú para cada día que necesites. Confirma todas las fechas juntas, sin repetir el proceso."/>
          <div className="plan-layout"><div className="plan-main"><section className="panel"><div className="plan-section-title"><div><span className="eyebrow">PASO 1</span><h2>Selecciona un día</h2></div><WeekControls week={week} setWeek={switchWeek}/></div><div className="day-list">{WEEKS[week].map(key => { const reservation = reservations.find(r => r.date === key); const picked = draft[key]; return <button key={key} className={`day-row ${selectedDate === key ? 'active' : ''}`} onClick={() => setSelectedDate(key)}><span className="day-circle">{dateLabel(key, { day: 'numeric' })}</span><span className="day-info"><strong>{dateLabel(key, { weekday: 'long' })}</strong><small>{dateLabel(key, { day: 'numeric', month: 'long' })}</small></span><span className={`day-status ${reservation ? 'reserved' : picked ? 'picked' : ''}`}>{reservation ? 'Reservado' : picked ? 'Seleccionado' : 'Sin elegir'}</span><ChevronRight size={16}/></button>; })}</div></section>
            <section className="panel choice-panel"><div className="plan-section-title"><div><span className="eyebrow">PASO 2</span><h2>Elige tu almuerzo</h2><p>{longDate(selectedDate)} · Campus {campus}</p></div></div>
              {bookedDates.has(selectedDate) ? <div className="inline-notice good"><CheckCircle2 size={19}/><div>Ya tienes una reserva activa para este día. <button onClick={() => navigate('reservas')}>Ver mis reservas</button> para gestionarla.</div></div> : <>
                <DietBar diet={diet} onDiet={setDiet} compact/>
                <div className="plan-meals">{selectedMeals.map(menu => <MealCard key={menu.id} menu={menu} actionLabel="Seleccionar para este día" selected={draft[selectedDate]?.id === menu.id} onPick={togglePick}/>)}{selectedMeals.length === 0 && <EmptyState title="No hay opciones con ese filtro" description="Elige otra categoría para este día." action={<button className="btn btn-outline" onClick={() => setDiet('todos')}>Quitar filtro</button>}/>}</div>
              </>}
            </section></div>
            <aside className="panel summary-panel"><span className="eyebrow">PASO 3</span><h2>Resumen de tu semana</h2><p>Revisa los días seleccionados antes de confirmar.</p><div className="summary-count"><CalendarDays size={20}/><strong>{totalDraft}</strong><span>{totalDraft === 1 ? 'almuerzo por reservar' : 'almuerzos por reservar'}</span></div>
              {totalDraft > 0 ? <div className="draft-items">{draftEntries.map(menu => <div className="draft-row" key={menu.id}><span className="draft-date">{shortDate(menu.date)}</span><div><strong>{menu.title}</strong><small>{TYPE_META[menu.type].label} · {menu.campus}</small></div><button className="icon-button remove-btn" aria-label={`Quitar menú del ${shortDate(menu.date)}`} onClick={() => togglePick(menu)}><X size={17}/></button></div>)}</div> : <div className="summary-empty"><CalendarDays size={29}/><span>Aún no has seleccionado fechas. Elige uno o más menús para comenzar.</span></div>}
              {planError && <div className="inline-notice error" role="alert"><AlertTriangle size={17}/>{planError}</div>}
              <button className="btn btn-primary confirm-all" disabled={!canReserve} onClick={bookAll}><CheckCheck size={19}/> Confirmar {totalDraft} {totalDraft === 1 ? 'reserva' : 'reservas'}</button>
              <div className="summary-foot"><ShieldCheck size={16}/><span>No hay cobros ni reservas reales. Este flujo es una simulación funcional.</span></div>
            </aside></div>
        </>}
        {active === 'reservas' && <>
          <SectionHead kicker="META 3 · CONTROL ANTE IMPREVISTOS" title="Mis reservas" description="Consulta tus almuerzos confirmados y cancela una fecha sin modificar las demás." action={<button className="btn btn-primary desktop-action" onClick={() => navigate('planificar')}><Plus size={18}/> Nueva reserva</button>}/>
          <div className="reservation-summary"><div className="reservation-summary-icon"><ClipboardCheck size={23}/></div><div><strong>{reservations.length} {reservations.length === 1 ? 'reserva activa' : 'reservas activas'}</strong><span>Cada almuerzo se gestiona de manera independiente.</span></div><CheckCircle2 size={22} className="summary-check"/></div>
          {reservations.length ? <div className="reservation-list">{reservations.map(res => { const menu = getMenuById(res.menuId); return <article className="reservation-card" key={res.id}><div className="reservation-date"><strong>{dateLabel(res.date, { day: 'numeric' })}</strong><span>{dateLabel(res.date, { month: 'short' })}</span></div><div className="reservation-info"><div className="reservation-tags"><span className="pill pill-green"><CheckCircle2 size={14}/> Confirmada</span>{menu && <MenuPill type={menu.type}/>}</div><h3>{menu?.title ?? 'Almuerzo reservado'}</h3><p><CalendarDays size={15}/>{longDate(res.date)} <span className="dot-divider">·</span> <MapPin size={15}/> Campus {res.campus}</p><small>Código {res.id}</small></div><div className="reservation-actions"><button className="btn btn-outline danger-outline" onClick={() => setCancelTarget(res)}><Trash2 size={16}/> Cancelar este día</button></div></article>; })}</div> : <EmptyState icon={ClipboardCheck} title="No tienes almuerzos reservados" description="Planifica uno o varios días para ver aquí tus reservas." action={<button className="btn btn-primary" onClick={() => navigate('planificar')}>Planificar almuerzos <ArrowRight size={17}/></button>}/>}
          <div className="history-section"><button className="history-toggle" onClick={() => setHistoryOpen(!historyOpen)} aria-expanded={historyOpen}><span><Clock3 size={20}/> Historial de cancelaciones <span className="history-counter">{saved.history.length}</span></span>{historyOpen ? <ChevronLeft size={18} className="rotate-down"/> : <ChevronRight size={18}/>}</button>{historyOpen && <div className="history-content">{saved.history.length ? saved.history.map(item => <div className="history-item" key={item.id}><CalendarX2 size={19}/><div><strong>{getMenuById(item.menuId)?.title ?? 'Almuerzo'}</strong><span>{shortDate(item.date)} · {item.campus} · Cancelada (simulada)</span></div></div>) : <p>Aún no hay cancelaciones registradas en esta demostración.</p>}</div>}</div>
        </>}
      </main>
    </div>
    <nav className="mobile-nav" aria-label="Navegación móvil">{NAV.map(item => { const Icon = item.icon; return <button key={item.id} className={active === item.id ? 'active' : ''} onClick={() => navigate(item.id)} aria-current={active === item.id ? 'page' : undefined}><Icon size={21}/><span>{item.label}</span></button>; })}</nav>
    {toast && <div className="toast" role="status"><CheckCircle2 size={20}/><span>{toast}</span><button onClick={() => setToast(null)} aria-label="Cerrar mensaje"><X size={16}/></button></div>}
    {cancelTarget && <ConfirmationModal reservation={cancelTarget} onClose={() => setCancelTarget(null)} onConfirm={cancelReservation}/>}
    {resetOpen && <ResetModal onClose={() => setResetOpen(false)} onConfirm={resetDemo}/>}
  </div>;
}