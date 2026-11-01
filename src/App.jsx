import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard, CalendarDays, NotebookTabs, ClipboardCheck,
  ChevronRight, ChevronLeft, ArrowRight, CheckCircle2, Info,
  UtensilsCrossed, CalendarRange, X, AlertTriangle, RotateCcw,
  MapPin, Leaf, Check, Plus, ShieldCheck
} from 'lucide-react';
import {
  CAMPUS, WEEKS, DATE_KEYS, DIETS, TYPE_META,
  getMenus, applyDiet, longDate, dateLabel
} from './data.js';

// Esta versión implementa ÚNICAMENTE la Meta 1: consultar, filtrar y elegir un menú.
// Meta 2 (reservar varios días) y Meta 3 (cancelar reservas) quedan pendientes.
const ROUTES = ['inicio', 'minuta', 'planificar', 'reservas'];
const NAV = [
  { id: 'inicio', label: 'Inicio', icon: LayoutDashboard },
  { id: 'minuta', label: 'Minuta', icon: NotebookTabs },
  { id: 'planificar', label: 'Planificar', icon: CalendarRange },
  { id: 'reservas', label: 'Mis reservas', icon: ClipboardCheck },
];

function Initials() {
  return <span className="avatar" aria-hidden="true">FS</span>;
}

function MenuPill({ type }) {
  const info = TYPE_META[type] || TYPE_META.general;
  return <span className={`pill pill-${info.tint}`}>{info.icon} {info.label}</span>;
}

function formatWeek(index) {
  const days = WEEKS[index];
  if (!days) return '';
  return `${dateLabel(days[0], { day: 'numeric', month: 'short' })} — ${dateLabel(days[4], { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

function SectionHead({ kicker, title, description }) {
  return <div className="section-head"><div><div className="eyebrow">{kicker}</div><h1>{title}</h1><p>{description}</p></div></div>;
}

function EmptyState({ icon: Icon = CalendarDays, title, description, action }) {
  return <div className="empty-state"><div className="empty-icon"><Icon size={25}/></div><h3>{title}</h3><p>{description}</p>{action}</div>;
}

function DietBar({ diet, onDiet }) {
  return <div className="diet-bar" role="group" aria-label="Filtrar por necesidad alimentaria">
    {DIETS.map(item => <button
      key={item.id}
      className={`diet-button ${diet === item.id ? 'selected' : ''}`}
      aria-pressed={diet === item.id}
      onClick={() => onDiet(item.id)}
    >{item.label}</button>)}
  </div>;
}

function MealCard({ menu, selected, onPick }) {
  const type = TYPE_META[menu.type];
  return <article className={`meal-card ${selected ? 'is-selected' : ''}`}>
    <div className="meal-top">
      <div className={`meal-symbol meal-${type.tint}`}>{type.icon}</div>
      <div className="meal-meta">
        <MenuPill type={menu.type}/>
        {selected && <span className="selected-indicator"><Check size={14}/> Elegido</span>}
      </div>
    </div>
    <h3>{menu.title}</h3>
    <p className="meal-detail">{menu.detail}</p>
    <div className="allergen-note">
      {menu.allergens.length > 0
        ? `Ingredientes declarados con: ${menu.allergens.join(', ')}.`
        : 'Sin alérgenos destacados en la ficha de ejemplo.'}
    </div>
    <button
      type="button"
      className={`btn ${selected ? 'btn-soft' : 'btn-outline'} meal-action`}
      onClick={() => onPick(menu)}
    >{selected
      ? <><Check size={17}/> Quitar elección</>
      : <><Plus size={17}/> Elegir este menú</>}
    </button>
  </article>;
}

function WeekControls({ week, setWeek }) {
  return <div className="week-controls" aria-label="Navegación por semanas">
    <button className="icon-button" disabled={week === 0} onClick={() => setWeek(week - 1)} aria-label="Semana anterior"><ChevronLeft size={20}/></button>
    <span>{formatWeek(week)}</span>
    <button className="icon-button" disabled={week === WEEKS.length - 1} onClick={() => setWeek(week + 1)} aria-label="Semana siguiente"><ChevronRight size={20}/></button>
  </div>;
}

function DateStrip({ week, date, onDate }) {
  return <div className="date-strip" role="group" aria-label="Días disponibles">
    {WEEKS[week].map(key => <button
      key={key}
      className={`date-button ${key === date ? 'active' : ''}`}
      aria-pressed={key === date}
      onClick={() => onDate(key)}
    >
      <span className="date-weekday">{dateLabel(key, { weekday: 'short' }).replace('.', '')}</span>
      <span className="date-number">{dateLabel(key, { day: 'numeric' })}</span>
      <span className="date-month">{dateLabel(key, { month: 'short' }).replace('.', '')}</span>
    </button>)}
  </div>;
}

function TopBar({ campus, setCampus, onReset }) {
  return <header className="topbar">
    <div className="topbar-trail"><span>Servicios universitarios</span><ChevronRight size={14}/><strong>Casino de alimentación</strong></div>
    <div className="topbar-actions">
      <label className="campus-picker">
        <MapPin size={16}/>
        <span className="sr-only">Campus seleccionado</span>
        <select value={campus} onChange={e => setCampus(e.target.value)}>
          {CAMPUS.map(c => <option key={c} value={c}>Campus {c}</option>)}
        </select>
      </label>
      <button className="reset-button" onClick={onReset} title="Reiniciar selección de prueba"><RotateCcw size={16}/><span>Reiniciar demo</span></button>
      <Initials/>
    </div>
  </header>;
}

function PendingGoal({ number, title, description, onBack }) {
  return <>
    <SectionHead kicker={`META ${number} · PENDIENTE`} title={title} description={description}/>
    <EmptyState
      icon={CalendarRange}
      title="Pendiente de implementación"
      description={`La Meta ${number} será implementada por otro integrante del equipo.`}
      action={<button className="btn btn-primary" onClick={onBack}>Volver a la minuta <ArrowRight size={17}/></button>}
    />
  </>;
}

export default function App() {
  const [active, setActive] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return ROUTES.includes(hash) ? hash : 'inicio';
  });
  const [campus, setCampus] = useState(CAMPUS[0]);
  const [week, setWeek] = useState(0);
  const [selectedDate, setSelectedDate] = useState(DATE_KEYS[0]);
  const [diet, setDiet] = useState('todos');
  const [chosenMenu, setChosenMenu] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const change = () => {
      const hash = window.location.hash.replace('#', '');
      if (ROUTES.includes(hash)) setActive(hash);
    };
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(id);
  }, [toast]);

  const selectedMeals = applyDiet(getMenus(selectedDate, campus), diet);

  function navigate(page) {
    setActive(page);
    if (window.location.hash !== `#${page}`) window.location.hash = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function switchWeek(nextWeek) {
    setWeek(nextWeek);
    setSelectedDate(WEEKS[nextWeek][0]);
  }

  function chooseMenu(menu) {
    if (chosenMenu?.id === menu.id) {
      setChosenMenu(null);
      setToast('Elección retirada. Puedes elegir otra alternativa.');
    } else {
      setChosenMenu(menu);
      setToast(`Menú elegido: ${menu.title}. La reserva aún no está implementada.`);
    }
  }

  function changeCampus(value) {
    setCampus(value);
    setChosenMenu(null);
  }

  function resetDemo() {
    setCampus(CAMPUS[0]);
    setWeek(0);
    setSelectedDate(DATE_KEYS[0]);
    setDiet('todos');
    setChosenMenu(null);
    setToast('Consulta y filtros reiniciados.');
    navigate('inicio');
  }

  return <div className="app-shell">
    <aside className="sidebar" aria-label="Navegación principal">
      <div className="brand"><span className="brand-mark"><UtensilsCrossed size={23}/></span><div className="brand-name">Casino <strong>USM</strong><span>Planificación de almuerzos</span></div></div>
      <div className="sidebar-caption">TU ESPACIO</div>
      <nav className="side-nav">
        {NAV.map(item => {
          const Icon = item.icon;
          return <button key={item.id} className={`side-link ${active === item.id ? 'active' : ''}`} aria-current={active === item.id ? 'page' : undefined} onClick={() => navigate(item.id)}>
            <Icon size={19}/><span>{item.label}</span>
          </button>;
        })}
      </nav>
      <div className="sidebar-bottom"><div className="side-profile"><Initials/><div><strong>Federico Santa María</strong><span>Docente · Usuario de prueba</span></div></div></div>
    </aside>
    <div className="main-area">
      <TopBar campus={campus} setCampus={changeCampus} onReset={resetDemo}/>
      <main className="page-content">
        {active === 'inicio' && <>
          <section className="home-actions-card" aria-label="Accesos directos de inicio">
            <div className="home-actions-row">
              <button className="btn home-btn-secondary" onClick={() => navigate('planificar')}>Planificar mi semana <ArrowRight size={18}/></button>
              <button className="btn home-btn-primary" onClick={() => navigate('minuta')}>Explorar minuta</button>
            </div>
          </section>
          <div className="stats-grid">
            <div className="stat-card"><span className="stat-icon blue"><NotebookTabs size={20}/></span><div><strong>{getMenus(selectedDate, campus).length}</strong><span>Alternativas en el día</span></div></div>
            <div className="stat-card"><span className="stat-icon green"><CheckCircle2 size={20}/></span><div><strong>{chosenMenu ? '1' : '0'}</strong><span>Menús elegidos</span></div></div>
            <div className="stat-card"><span className="stat-icon amber"><ShieldCheck size={20}/></span><div><strong>1/3</strong><span>Metas implementadas</span></div></div>
          </div>
          <div className="home-split">
            <section className="panel">
              <div className="panel-title"><div><div className="eyebrow">META 1</div><h2>Tu elección alimentaria</h2></div><button className="text-action" onClick={() => navigate('minuta')}>Ver minuta <ArrowRight size={16}/></button></div>
              {chosenMenu ? <div className="next-booking"><div className="booking-calendar"><strong>{dateLabel(chosenMenu.date, { day: 'numeric' })}</strong><span>{dateLabel(chosenMenu.date, { month: 'short' })}</span></div><div className="next-booking-body"><strong>{chosenMenu.title}</strong><span><MapPin size={15}/> Campus {chosenMenu.campus}</span><span><CheckCircle2 size={15}/> Menú elegido (sin reserva)</span></div></div>
                : <EmptyState title="Todavía no has elegido un menú" description="Consulta la minuta y elige la opción más adecuada para ti." action={<button className="btn btn-primary" onClick={() => navigate('minuta')}>Explorar minuta</button>}/>}
            </section>
            <section className="panel">
              <div className="panel-title"><div><div className="eyebrow">SIGUIENTES METAS</div><h2>Funciones por integrar</h2></div></div>
              <div className="step-list">
                <button onClick={() => navigate('minuta')}><span>01</span><div><strong>Elegir un menú adecuado</strong><small>Funcionalidad disponible.</small></div><ChevronRight size={17}/></button>
                <button onClick={() => navigate('planificar')}><span>02</span><div><strong>Reservar varios días</strong><small>Pendiente de implementación.</small></div><ChevronRight size={17}/></button>
                <button onClick={() => navigate('reservas')}><span>03</span><div><strong>Cancelar reservas individuales</strong><small>Pendiente de implementación.</small></div><ChevronRight size={17}/></button>
              </div>
            </section>
          </div>
        </>}

        {active === 'minuta' && <>
          <SectionHead kicker="META 1 · ELECCIÓN INFORMADA" title="Minuta de almuerzos" description="Consulta los menús, revisa ingredientes y elige un almuerzo compatible con tus necesidades alimentarias."/>
          <section className="panel controls-panel">
            <div className="controls-row">
              <div><div className="control-label">Semana de atención</div><WeekControls week={week} setWeek={switchWeek}/></div>
              <div className="selection-tip"><MapPin size={17}/> Campus {campus}</div>
            </div>
            <DateStrip week={week} date={selectedDate} onDate={setSelectedDate}/>
            <div className="filter-block"><div className="control-label">Filtrar alternativas</div><DietBar diet={diet} onDiet={setDiet}/></div>
          </section>
          <div className="menu-result-head"><div><span className="eyebrow">MENÚS DE EJEMPLO</span><h2>{longDate(selectedDate)}</h2></div><span className="result-count">{selectedMeals.length} {selectedMeals.length === 1 ? 'alternativa' : 'alternativas'}</span></div>
          {selectedMeals.length
            ? <div className="meals-grid">{selectedMeals.map(menu => <MealCard key={menu.id} menu={menu} selected={chosenMenu?.id === menu.id} onPick={chooseMenu}/>)}</div>
            : <EmptyState icon={Leaf} title="Sin alternativas para este filtro" description="Prueba otra categoría o cambia el día seleccionado." action={<button className="btn btn-outline" onClick={() => setDiet('todos')}>Ver todos los menús</button>}/>}
          <div className="disclaimer"><AlertTriangle size={17}/><p>*Los datos alimentarios son ficticios. La etiqueta «Sin gluten» se basa en ingredientes declarados y no garantiza ausencia de trazas ni aptitud médica.</p></div>
          {chosenMenu && <div className="cta-bottom"><div><strong>Menú elegido: {chosenMenu.title}</strong><span>{longDate(chosenMenu.date)} · Campus {chosenMenu.campus}. Esta elección no constituye una reserva.</span></div><button className="btn btn-outline" onClick={() => setChosenMenu(null)}><X size={16}/> Quitar elección</button></div>}
        </>}

        {/* TODO - COMPAÑERO: implementar aquí la Meta 2 (reservar varios días). */}
        {active === 'planificar' && <PendingGoal
          number="2"
          title="Planifica tus almuerzos"
          description="La reserva de varios días se integrará en esta sección."
          onBack={() => navigate('minuta')}
        />}

        {/* TODO - COMPAÑERO: implementar aquí la Meta 3 (gestionar y cancelar reservas). */}
        {active === 'reservas' && <PendingGoal
          number="3"
          title="Mis reservas"
          description="La gestión y cancelación de reservas se integrará en esta sección."
          onBack={() => navigate('minuta')}
        />}
      </main>
    </div>
    <nav className="mobile-nav" aria-label="Navegación móvil">
      {NAV.map(item => {
        const Icon = item.icon;
        return <button key={item.id} className={active === item.id ? 'active' : ''} onClick={() => navigate(item.id)} aria-current={active === item.id ? 'page' : undefined}><Icon size={21}/><span>{item.label}</span></button>;
      })}
    </nav>
    {toast && <div className="toast" role="status"><Info size={20}/><span>{toast}</span><button onClick={() => setToast(null)} aria-label="Cerrar mensaje"><X size={16}/></button></div>}
  </div>;
}
