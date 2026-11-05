'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, ArrowDownToLine, Box, CheckCircle2, ChevronDown,
  CircleHelp, Cpu, Droplets, Eye, FlaskConical, Focus, Gauge, Info,
  Layers3, Leaf, Maximize2, Minimize2, RotateCcw, Ruler, ShieldCheck, SlidersHorizontal,
  Sprout, Thermometer, Waves, Wind, X
} from 'lucide-react';
import {
  COMPONENTS, COMPONENT_NUMBERS, DESIGN, displayNumber, ESP32_PINOUT,
  type ComponentId, type ViewMode, type Zone
} from '../lib/design';

const ArchitectureDiagram = dynamic(() => import('./ArchitectureDiagram'), {ssr:false});

const GardenScene = dynamic(() => import('./GardenScene'), {
  ssr: false,
  loading: () => <div className="loading-stage"><div className="loading-orbit"/><strong>Preparando laboratorio 3D...</strong><span>Modelo paramétrico · escala 1:1 en metros</span></div>,
});

type Scenario = 'none' | 'A' | 'B' | 'both' | 'low' | 'custom';
const views: {id:ViewMode;title:string;desc:string}[] = [
  {id:'iso',title:'Isométrica',desc:'Perspectiva general tridimensional'},
  {id:'top',title:'Superior (Cotas)',desc:'Planta superior acotada con medidas'},
  {id:'front',title:'Frontal',desc:'Alzado y perfil hidráulico frontal'},
  {id:'side',title:'Lateral (Raíces)',desc:'Perfil con profundidad radicular'},
  {id:'hydraulic',title:'Red Hidráulica',desc:'Circuito tanque → bomba → válvulas → goteo'},
  {id:'electronic',title:'Gabinete ESP32',desc:'Detalle de conexiones y potencia'},
];
const scenarios:{id:Scenario;title:string;desc:string;badge:string}[] = [
  {id:'none',title:'01. Reposo',desc:'Sin demanda hídrica. Monitoreo continuo; bomba y válvulas apagadas.',badge:'Reposo'},
  {id:'A',title:'02. Riego Lechuga (A)',desc:'Humedad A < 38,1%. Bomba ON y electroválvula A abierta.',badge:'Zona A'},
  {id:'B',title:'03. Riego Tomate (B)',desc:'Humedad B < 34,8%. Bomba ON y electroválvula B abierta.',badge:'Zona B'},
  {id:'both',title:'04. Riego Alternado (A+B)',desc:'Ambas zonas en demanda. Riego secuencial por turnos (TDM) para preservar presión.',badge:'Por turnos'},
  {id:'low',title:'05. Bloqueo Tanque Bajo',desc:'Reserva < 4 L. Interruptor de flotador corta bomba y electroválvulas de inmediato.',badge:'Seguridad'},
];
// 13 componentes en riguroso orden numérico (1 a 13)
const idsLeft:ComponentId[]=[
  'bedA',      // 1
  'bedB',      // 2
  'pipe',      // 3
  'moistureA', // 4
  'moistureB', // 5
  'tank',      // 6
  'float',     // 7
  'pump',      // 8
  'filter',    // 9
  'valveA',    // 10
  'valveB',    // 11
  'esp32',     // 12
  'environment'// 13
];

function useWindowFullscreen() {
  const [full,setFull]=useState(false);
  const toggle = useCallback(async() => {
    const el=document.getElementById('workspace');
    if (!el) return;
    try {
      if (!document.fullscreenElement) await el.requestFullscreen();
      else await document.exitFullscreen();
      setFull(Boolean(document.fullscreenElement));
    } catch {/* el navegador puede impedir la vista completa */}
  },[]);
  useEffect(() => {
    const onChange=()=>setFull(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange',onChange);
    return()=>document.removeEventListener('fullscreenchange',onChange);
  },[]);
  return { full,toggle };
}

function calculateDemand(humidity:number,on:number,off:number,previous:boolean):boolean {
  if(humidity < on) return true;
  if(humidity >= off) return false;
  return previous; // histéresis: conserva estado en banda intermedia
}

export default function UrbanGrowExperience() {
  const [view,setView]=useState<ViewMode>('iso');
  const [representation,setRepresentation]=useState<'3d'|'diagram'>('3d');
  const [selected,setSelected]=useState<ComponentId>('esp32');
  const [labels,setLabels]=useState(true);
  const [dimensions,setDimensions]=useState(true);
  const [network,setNetwork]=useState(true);
  const [sensors,setSensors]=useState(true);
  const [showLegend,setShowLegend]=useState(true);
  const [humidityA,setHumidityA]=useState(32);
  const [humidityB,setHumidityB]=useState(42);
  const [temperature,setTemperature]=useState(28);
  const [rh,setRh]=useState(62);
  const [tankLow,setTankLow]=useState(false);
  const [demands,setDemands]=useState<{A:boolean;B:boolean}>({A:true,B:false});
  const [turn,setTurn]=useState<Zone>('A');
  const [scenario,setScenario]=useState<Scenario>('A');
  const [tab,setTab]=useState<'simulation'|'equipment'>('simulation');
  const [showHelp,setShowHelp]=useState(false);
  const [showCabinetModal,setShowCabinetModal]=useState(false);
  const [pure3D,setPure3D]=useState(false);
  const canvasRef=useRef<HTMLCanvasElement|null>(null);
  const {full,toggle}=useWindowFullscreen();

  function selectView(v: ViewMode) {
    setView(v);
    if (v === 'top') {
      setDimensions(true);
    } else if (v === 'hydraulic') {
      setNetwork(true);
      setSelected('pump');
    } else if (v === 'electronic') {
      setSelected('esp32');
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showCabinetModal) {
          setShowCabinetModal(false);
        } else if (pure3D) {
          setPure3D(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pure3D, showCabinetModal]);

  function changeHumidity(zone:Zone,value:number) {
    setScenario('custom'); // personalizado: el estado es gobernado por lectura e histéresis
    if(zone==='A'){
      setHumidityA(value);
      setDemands(prev=>({...prev,A:calculateDemand(value,DESIGN.lettuce.on,DESIGN.lettuce.off,prev.A)}));
    } else {
      setHumidityB(value);
      setDemands(prev=>({...prev,B:calculateDemand(value,DESIGN.tomato.on,DESIGN.tomato.off,prev.B)}));
    }
  }

  function chooseScenario(id:Scenario) {
    setScenario(id);
    setTurn('A');
    if(id==='none'){
      setHumidityA(52);setHumidityB(52);setDemands({A:false,B:false});setTankLow(false);
    } else if(id==='A'){
      setHumidityA(32);setHumidityB(49);setDemands({A:true,B:false});setTankLow(false);
    } else if(id==='B'){
      setHumidityA(49);setHumidityB(30);setDemands({A:false,B:true});setTankLow(false);
    } else if(id==='both'){
      setHumidityA(32);setHumidityB(30);setDemands({A:true,B:true});setTankLow(false);
    } else {
      setHumidityA(32);setHumidityB(30);setDemands({A:true,B:true});setTankLow(true);
    }
  }

  useEffect(()=>{
    if(!demands.A||!demands.B||tankLow) return;
    const id=window.setInterval(()=>setTurn(old=>old==='A'?'B':'A'),6000);
    return()=>window.clearInterval(id);
  },[demands.A,demands.B,tankLow]);

  const active: Zone|null= tankLow ? null
    : demands.A && demands.B ? turn
    : demands.A ? 'A'
    : demands.B ? 'B' : null;
  const environmentalAlert=temperature>=30 && rh<=45;
  const status = tankLow ? {
    label:'BLOQUEO DE SEGURIDAD',desc:'El tanque no tiene nivel suficiente: bomba y electroválvulas desactivadas.',tone:'danger'
  } : active===null ? {
    label:'EN REPOSO',desc:'No existe solicitud de riego. El sistema continúa adquiriendo datos.',tone:'idle'
  } : demands.A && demands.B ? {
    label:`REGANDO ZONA ${active} · POR TURNOS`,desc:'Las dos zonas solicitan agua. Solo una válvula permanece abierta por turno (6 s ilustrativos).',tone:'active'
  } : {
    label:`REGANDO ZONA ${active}`,desc:`Bomba encendida y electroválvula ${active} abierta. La otra línea permanece cerrada.`,tone:'active'
  };

  const detail = COMPONENTS[selected];
  const canvasReady=useCallback((canvas:HTMLCanvasElement) => {canvasRef.current=canvas;},[]);
  const saveImage=useCallback(()=>{
    const canvas=canvasRef.current;
    if(!canvas) return;
    try {
      const a=document.createElement('a');
      a.href=canvas.toDataURL('image/png');
      a.download='URBANGROW_3D_Boceto_Conceptual.png';
      a.click();
    } catch {window.alert('El navegador no permitió guardar la imagen del lienzo 3D.');}
  },[]);
  const siteArea=useMemo(()=>DESIGN.site.width*DESIGN.site.depth,[]);
  const bedsArea=useMemo(()=>2*DESIGN.bed.width*DESIGN.bed.length,[]);

  return <div className={`app-shell ${pure3D ? 'app-shell--pure3d' : ''}`}>
    {!pure3D && (
      <header className="site-header">
        <div className="brand-wrap">
          <span className="brand-icon"><Sprout size={24} strokeWidth={1.9}/></span>
          <div className="brand-content"><span className="brand-eyebrow">AGROMIND TECH SOLUTIONS / LABORATORIO DIGITAL</span><h1>URBANGROW <span>CHALLENGE</span></h1></div>
        </div>
        <div className="header-right"><span className="course-label">Universidad del Valle · Ingeniería Agrícola</span><span className="phase-chip"><span className="phase-dot"/> FASE 1 · MODELO CONCEPTUAL</span></div>
      </header>
    )}

    <div className={`workspace ${pure3D ? 'workspace--pure3d' : ''}`} id="workspace">
      {!pure3D && (
        <aside className="left-panel">
          <div className="panel-head"><span className="overline">01 / CONTEXTO DEL PROYECTO</span><h2>Huerta autónoma de <em>dos zonas.</em></h2><p>Explora un modelo tridimensional escalado y analiza cómo se interconectan los cultivos, sensores y actuadores.</p></div>
          <div className="metric-pair">
            <div className="mini-metric"><span><Layers3 size={14}/> Zonas</span><strong>02</strong><small>Lechuga y tomate</small></div>
            <div className="mini-metric"><span><Activity size={14}/> Variables</span><strong>05</strong><small>3 tipos de medición</small></div>
          </div>

          <div className="panel-section"><div className="section-caption"><span>02 / GEOMETRÍA CUMPLIMIENTO</span><Ruler size={15}/></div>
            <div className="dim-card"><div><span>Módulo de implantación</span><strong>4,80 × 3,60 m</strong></div><small>{displayNumber(siteArea)} m²</small></div>
            <div className="dim-card"><div><span>Cama A (Lechuga)</span><strong>1,00 × 0,80 × 0,30 m</strong></div><small>0,80 m²</small></div>
            <div className="dim-card"><div><span>Cama B (Tomate)</span><strong>1,00 × 0,80 × 0,30 m</strong></div><small>0,80 m²</small></div>
            <div className="dim-card"><div><span>Prof. Sensor A / B</span><strong>8-12 cm / 15-20 cm</strong></div><small>Radicular</small></div>
            <div className="dim-card"><div><span>Tanque nominal</span><strong>20 L (Reserva 4 L)</strong></div><small>Seguridad</small></div>
            <div className="dim-card"><div><span>ESP32 & Potencia</span><strong>Zona seca frontal</strong></div><small>Gabinete IP</small></div>
          </div>

          <div className="panel-section"><div className="section-caption"><span>03 / CAPAS DE VISUALIZACIÓN</span><Eye size={15}/></div>
            <label className="switch-row"><span><Ruler size={15}/> Mostrar cotas</span><input type="checkbox" checked={dimensions} onChange={e=>setDimensions(e.target.checked)} /><i/></label>
            <label className="switch-row"><span><Eye size={15}/> Pines numéricos en 3D</span><input type="checkbox" checked={labels} onChange={e=>setLabels(e.target.checked)} /><i/></label>
            <label className="switch-row"><span><Layers3 size={15}/> Rótulo de elementos (1-13)</span><input type="checkbox" checked={showLegend} onChange={e=>setShowLegend(e.target.checked)} /><i/></label>
            <label className="switch-row"><span><Waves size={15}/> Redes hidráulicas</span><input type="checkbox" checked={network} onChange={e=>setNetwork(e.target.checked)} /><i/></label>
            <label className="switch-row"><span><Gauge size={15}/> Sensores en campo</span><input type="checkbox" checked={sensors} onChange={e=>setSensors(e.target.checked)} /><i/></label>

            <button
              type="button"
              className="left-pure3d-btn"
              onClick={() => { setRepresentation('3d'); setPure3D(true); }}
              title="Ocultar paneles y ver solo el modelo 3D en pantalla completa"
            >
              <Maximize2 size={14}/>
              <span>Solo 3D en pantalla completa</span>
            </button>
          </div>

          <div className="assumption"><Info size={17}/><span><strong>Hipótesis de diseño.</strong> Las medidas se adoptan para explicar la distribución física. No son medidas tomadas en campo ni un plano constructivo aprobado.</span></div>
        </aside>
      )}

      <main className={`center-panel ${pure3D ? 'center-panel--pure3d' : ''}`}>
        {!pure3D && (
          <div className="stage-toolbar">
            <div className="stage-heading"><span className="overline">EXPLORADOR TÉCNICO / 3D A ESCALA</span><h2>Implantación y funcionamiento</h2></div>
            <div className="toolbar-actions">
              <button
                type="button"
                className="btn-pure3d"
                onClick={() => { setRepresentation('3d'); setPure3D(true); }}
                title="Ocultar paneles laterales (detalles, zonas, medidas y porcentajes) para ver sólo el gráfico 3D en pantalla completa"
              >
                <Maximize2 size={15}/>
                <span>Solo 3D</span>
              </button>
              <div className="presentation-tabs">
                <button className={representation==='3d'?'active':''} onClick={()=>setRepresentation('3d')}>Modelo 3D</button>
                <button className={representation==='diagram'?'active':''} onClick={()=>setRepresentation('diagram')}>Arquitectura</button>
              </div>
              <button title="Guardar imagen PNG" onClick={saveImage} className="round-tool" aria-label="Guardar imagen PNG"><ArrowDownToLine size={17}/></button>
              <button title="Pantalla completa F11" onClick={toggle} className="round-tool" aria-label="Pantalla completa"><Maximize2 size={17}/></button>
              <button title="Ayuda" onClick={()=>setShowHelp(v=>!v)} className="round-tool" aria-label="Ayuda"><CircleHelp size={17}/></button>
            </div>
          </div>
        )}

        <div className={`stage ${pure3D ? 'stage--pure3d' : ''} ${representation==='diagram'?'stage--diagram':''}`}>
          {representation==='diagram' ? <ArchitectureDiagram active={active} tankLow={tankLow} onSelect={setSelected}/> : <GardenScene key={view} view={view} selected={selected} onSelect={setSelected} active={active} labels={labels} dimensions={dimensions} showNetwork={network} showSensors={sensors} tankLow={tankLow} onCanvas={canvasReady}/>}
          {representation==='3d' && !pure3D && <div className="stage-badge"><span className="live-led"/> MAQUETA INTERACTIVA · 1 UNIDAD = 1 METRO</div>}

          {/* Barra de control flotante en Modo Solo 3D */}
          {pure3D && (
            <div className="pure3d-floating-bar">
              <button
                type="button"
                className={`pure3d-floating-btn ${showLegend ? 'active' : ''}`}
                onClick={() => setShowLegend(v => !v)}
                title={showLegend ? 'Ocultar rótulo de elementos' : 'Mostrar rótulo de elementos (1-13)'}
              >
                <Layers3 size={14}/>
                <span>{showLegend ? 'Ocultar rótulo' : 'Rótulo (1-13)'}</span>
              </button>
              <button
                type="button"
                className="pure3d-floating-btn"
                onClick={saveImage}
                title="Guardar captura PNG del modelo 3D"
              >
                <ArrowDownToLine size={14}/>
                <span>Captura</span>
              </button>
              <button
                type="button"
                className="pure3d-floating-btn"
                onClick={toggle}
                title={full ? 'Salir de pantalla completa F11' : 'Pantalla completa de navegador F11'}
              >
                <Maximize2 size={14}/>
                <span>{full ? 'Ventana' : 'F11'}</span>
              </button>
              <button
                type="button"
                className="pure3d-floating-btn pure3d-floating-btn--primary"
                onClick={() => setPure3D(false)}
                title="Restaurar paneles laterales de detalles, medidas y porcentajes (o pulsa Esc)"
              >
                <Minimize2 size={15}/>
                <span>Mostrar paneles</span>
              </button>
            </div>
          )}

          {pure3D && (
            <div className="pure3d-badge">
              <span className="live-led"/>
              <strong>URBANGROW 3D</strong>
              <span>MODO ENFOQUE TOTAL</span>
            </div>
          )}

          {pure3D && (
            <div className="pure3d-status-chip">
              <span className={`status-indicator ${status.tone}`}/>
              <span>{status.label}</span>
            </div>
          )}
          
          {/* Botón flotante para alternar el rótulo en modo normal */}
          {representation==='3d' && !pure3D && (
            <button
              className={`stage-legend-toggle ${showLegend ? 'active' : ''}`}
              onClick={() => setShowLegend(v => !v)}
              title={showLegend ? 'Ocultar rótulo de elementos' : 'Visualizar rótulo de elementos'}
            >
              <Layers3 size={14}/>
              <span>{showLegend ? 'Ocultar rótulo' : 'Visualizar rótulo (1-13)'}</span>
            </button>
          )}

          {/* Rótulo lateral con numeración ordenada de todos los elementos */}
          {representation==='3d' && showLegend && (
            <div className="stage-legend">
              <div className="stage-legend-head">
                <div>
                  <span>RÓTULO DE ELEMENTOS</span>
                  <small>13 Componentes numerados</small>
                </div>
                <button
                  className="stage-legend-close"
                  onClick={() => setShowLegend(false)}
                  title="Ocultar rótulo"
                  aria-label="Ocultar rótulo"
                >
                  <X size={13}/>
                </button>
              </div>
              <div className="stage-legend-list">
                {idsLeft.map(id => {
                  const numData = COMPONENT_NUMBERS[id];
                  return (
                    <button
                      key={id}
                      onClick={() => setSelected(id)}
                      className={`stage-legend-item${selected === id ? ' active' : ''}`}
                    >
                      <span className="stage-legend-badge">{numData.num}</span>
                      <span>{numData.short}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {representation==='3d' && <div className="stage-hint"><Focus size={16}/><div><strong>Arrastra para girar</strong><span>Rueda: acercar · Clic en pin o número: inspeccionar</span></div></div>}
          {representation==='3d' && (
            <div className="views">
              <span>VISTAS TÉCNICAS</span>
              {views.map(item=>(
                <button 
                  key={item.id} 
                  onClick={()=>selectView(item.id)} 
                  className={view===item.id?'selected':''}
                  title={item.desc}
                >
                  {item.title}
                </button>
              ))}
              <button className="reset-view" onClick={()=>selectView('iso')} title="Restablecer vista isométrica"><RotateCcw size={15}/></button>
            </div>
          )}
          {showHelp && <div className="help-popover"><button className="close-help" onClick={()=>setShowHelp(false)} aria-label="Cerrar"><X size={16}/></button><strong>Cómo explorar la maqueta</strong><p>Usa las vistas técnicas predeterminadas o gira el modelo. Selecciona cualquier elemento (1 al 13) para ver su ficha técnica. En el panel derecho puedes probar los 5 modos de funcionamiento de la simulación conceptual. Las gotas animadas representan activación lógica de sectores, no caudales calibrados.</p></div>}
        </div>

        {!pure3D && (
          <>
            <div className="status-bar">
              <div className="status-cluster"><span className={`status-indicator ${status.tone}`}/><div><strong>{status.label}</strong><small>{status.desc}</small></div></div>
              <div className="valve-chips"><span className={active==='A'?'valve-chip on':'valve-chip'}>Válvula A · {active==='A'?'ABIERTA':'CERRADA'}</span><span className={active==='B'?'valve-chip on':'valve-chip'}>Válvula B · {active==='B'?'ABIERTA':'CERRADA'}</span></div>
            </div>
            <div className="architecture-row"><div><span className="overline">LÓGICA DEL SISTEMA</span><strong>Percibir <b>→</b> Procesar <b>→</b> Decidir <b>→</b> Actuar <b>→</b> Verificar</strong></div><div className="arch-note"><ShieldCheck size={17}/><span>Bloqueo seguro por nivel bajo</span></div></div>
            <div className="bottom-meta">UNIVERSIDAD DEL VALLE · SISTEMAS AUTÓNOMOS PROGRAMABLES · FASE 1: CONCEPCIÓN Y DISEÑO CONCEPTUAL · ESCALA 1:1 EN METROS</div>
          </>
        )}
      </main>

      {!pure3D && (
        <aside className="right-panel"><div className="right-tabs"><button onClick={()=>setTab('simulation')} className={tab==='simulation'?'active':''}><SlidersHorizontal size={15}/> Control</button><button onClick={()=>setTab('equipment')} className={tab==='equipment'?'active':''}><Cpu size={15}/> Componentes</button></div>
          {tab==='simulation' ? <>
            <div className="right-block">
              <div className="section-caption"><span>04 / MODOS DE FUNCIONAMIENTO</span><CheckCircle2 size={15}/></div>
              <p className="right-intro">Selecciona una condición operativa. Las zonas se atienden de forma independiente según sus umbrales preliminares.</p>
              
              <div className="scenario-disclaimer">
                <Info size={14}/>
                <span><strong>Simulación conceptual (Fase 1).</strong> Comprueba los 5 modos de funcionamiento. Caudales y tiempos son demostrativos para el informe.</span>
              </div>

              <div className="scenario-grid">
                {scenarios.map(s=>(
                  <button key={s.id} onClick={()=>chooseScenario(s.id)} title={s.desc} className={scenario===s.id?'scenario active':'scenario'}>
                    {s.id==='low'&&<ShieldCheck size={14}/>}
                    <span>{s.title}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="right-block"><div className="section-caption"><span>05 / VARIABLES MONITOREADAS</span><Gauge size={15}/></div>
              <div className="sensor-control"><div className="slider-heading"><span><Leaf size={15}/> Humedad A · lechuga (8-12 cm)</span><strong>{humidityA.toFixed(1).replace('.',',')} %</strong></div><input aria-label="Humedad A" type="range" min="20" max="60" step="0.5" value={humidityA} onChange={e=>changeHumidity('A',Number(e.target.value))}/><div className="slider-foot"><span>Inicio preliminar {displayNumber(DESIGN.lettuce.on,1)} %</span><b className={demands.A?'needs':'ok'}>{demands.A?'SOLICITA RIEGO':'SIN SOLICITUD'}</b></div></div>
              <div className="sensor-control"><div className="slider-heading"><span><Sprout size={15}/> Humedad B · tomate (15-20 cm)</span><strong>{humidityB.toFixed(1).replace('.',',')} %</strong></div><input aria-label="Humedad B" type="range" min="20" max="60" step="0.5" value={humidityB} onChange={e=>changeHumidity('B',Number(e.target.value))}/><div className="slider-foot"><span>Inicio preliminar {displayNumber(DESIGN.tomato.on,1)} %</span><b className={demands.B?'needs':'ok'}>{demands.B?'SOLICITA RIEGO':'SIN SOLICITUD'}</b></div></div>
              <div className="env-grid"><div className="environment-box"><div><Thermometer size={14}/> TEMP.</div><strong>{temperature} °C</strong><input aria-label="Temperatura ambiental" type="range" min="15" max="40" value={temperature} onChange={e=>setTemperature(+e.target.value)}/></div><div className="environment-box"><div><Wind size={14}/> HR</div><strong>{rh} %</strong><input aria-label="Humedad relativa" type="range" min="25" max="95" value={rh} onChange={e=>setRh(+e.target.value)}/></div></div>
              {environmentalAlert && <p className="environment-alert"><Activity size={14}/> Alta demanda ambiental ilustrativa: aumentar la frecuencia de lectura, sin activar riego solo por T y HR.</p>}
              <label className="tank-toggle"><div><ShieldCheck size={18}/><span><strong>Tanque en nivel bajo (&lt; 4 L)</strong><small>Bloqueo prioritario por flotador magnético</small></span></div><input type="checkbox" checked={tankLow} onChange={e=>setTankLow(e.target.checked)}/><i/></label>
            </div>
            <div className="right-block">
              <div className="section-caption"><span>06 / INSPECCIÓN DEL ELEMENTO</span><Box size={15}/></div>
              <TechnicalDetails detail={detail} onOpenCabinet={()=>setShowCabinetModal(true)}/>
            </div>
          </> : <>
            <div className="right-block"><div className="section-caption"><span>CATÁLOGO TÉCNICO · 13 ELEMENTOS</span><Layers3 size={15}/></div><p className="right-intro">Selecciona una pieza de la instalación para consultar su función y criterios de validación.</p>
              <div className="component-list">
                {idsLeft.map(id=>(
                  <button key={id} className={selected===id?'component-option chosen':'component-option'} onClick={()=>setSelected(id)}>
                    <span style={{fontSize:'9px',fontWeight:850,background:selected===id?'#0c765e':'#cadbd1',color:selected===id?'#fff':'#1c4037',borderRadius:'50%',width:18,height:18,display:'grid',placeItems:'center',flexShrink:0}}>
                      {COMPONENTS[id].number}
                    </span>
                    <span>{COMPONENTS[id].title}</span>
                    <ChevronDown size={14}/>
                  </button>
                ))}
              </div>
            </div>
            <div className="right-block">
              <TechnicalDetails detail={detail} onOpenCabinet={()=>setShowCabinetModal(true)}/>
            </div>
          </>}
          <div className="right-bottom"><FlaskConical size={17}/><span>Demostración visual de reglas conceptuales (Fase 1). Sin medición física ni simulación hidráulica calibrada. Las consignas agronómicas se deben validar en Fase 2.</span></div>
        </aside>
      )}
    </div>

    {/* Modal técnico de Detalle de Gabinete ESP32 y Potencia */}
    {showCabinetModal && (
      <CabinetModal 
        onClose={() => setShowCabinetModal(false)} 
        onFocusCabinet={() => { selectView('electronic'); setSelected('esp32'); }}
      />
    )}
  </div>;
}

function TechnicalDetails({
  detail,
  onOpenCabinet
}: {
  detail: typeof COMPONENTS[ComponentId];
  onOpenCabinet: () => void;
}) {
  return <div className="tech-card">
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
      <span className="tech-category">{detail.category}</span>
      <span style={{background:'#0c765e',color:'#fff',fontSize:'10px',fontWeight:850,borderRadius:'50%',width:22,height:22,display:'grid',placeItems:'center'}}>#{detail.number}</span>
    </div>
    <h3>{detail.title}</h3>
    <span className="tech-subtitle">{detail.subtitle}</span>
    <p>{detail.role}</p>
    <div className="tech-spec"><Ruler size={15}/><span>{detail.specification}</span></div>
    <div className="tech-validation"><Info size={15}/><span><strong>Criterio de instalación / diseño:</strong> {detail.validation}</span></div>
    
    {detail.number === 12 && (
      <button 
        type="button" 
        className="btn-open-cabinet-modal" 
        onClick={onOpenCabinet}
        title="Abrir diagrama de conexiones, asignación de pines y circuito de potencia"
      >
        <Cpu size={15}/>
        <span>Ver conexionado y Pinout del ESP32</span>
      </button>
    )}
  </div>;
}

function CabinetModal({
  onClose,
  onFocusCabinet
}: {
  onClose: () => void;
  onFocusCabinet: () => void;
}) {
  return (
    <div className="cabinet-modal-overlay" onClick={onClose}>
      <div className="cabinet-modal-content" onClick={e => e.stopPropagation()}>
        <div className="cabinet-modal-head">
          <div className="cabinet-modal-title-group">
            <span className="overline">DETALLE DE INGENIERÍA · ELEMENTO #12</span>
            <h2>Gabinete ESP32 & Conexiones de Control y Potencia</h2>
            <p>Esquema de distribución, aislamiento galvánico y asignación de pines GPIO para el sistema de riego autónomo.</p>
          </div>
          <button className="cabinet-modal-close" onClick={onClose} aria-label="Cerrar ventana">
            <X size={18}/>
          </button>
        </div>

        <div className="cabinet-modal-body">
          <div className="cabinet-modal-grid">
            <div className="cabinet-spec-box">
              <span className="cabinet-box-badge">01. ARQUITECTURA DE CONTROL</span>
              <h4>Microcontrolador ESP32 DevKit v1</h4>
              <ul>
                <li><strong>Procesador:</strong> Xtensa Dual-Core 32-bit LX6 a 240 MHz.</li>
                <li><strong>Lógica operativa:</strong> Adquisición periódica analógica y digital con filtrado digital de lecturas.</li>
                <li><strong>Protección galvánica:</strong> Aislamiento de señales de control mediante optoacopladores para relés.</li>
                <li><strong>Corte de seguridad:</strong> El sensor de nivel (boya magnética a 4 L) posee prioridad sobre la máquina de estados.</li>
              </ul>
            </div>

            <div className="cabinet-spec-box">
              <span className="cabinet-box-badge">02. ETAPA DE POTENCIA (12V DC)</span>
              <h4>Alimentación y Cargas Inductivas</h4>
              <ul>
                <li><strong>Alimentación general:</strong> Riel de 12V DC (batería / fuente conmutada industrial).</li>
                <li><strong>Conversión lógica:</strong> Convertidor Buck Step-Down (LM2596 / MP1584) 12V → 5V estable.</li>
                <li><strong>Supresión de transitorios:</strong> Diodos flyback 1N4007 en paralelo inverso con solenoide A, solenoide B y motor de bomba.</li>
                <li><strong>Separación física:</strong> Gabinete IP65 ubicado en zona frontal seca sobre pedestal de acero galvanizado.</li>
              </ul>
            </div>
          </div>

          <div className="cabinet-table-wrap">
            <div className="cabinet-table-title">
              <span className="overline">MAPA DE BORNAS Y PINES GPIO</span>
              <h3>Conexiones de Sensores y Actuadores al ESP32</h3>
            </div>
            <div className="cabinet-table-responsive">
              <table className="cabinet-table">
                <thead>
                  <tr>
                    <th>Pin / Borna</th>
                    <th>Tipo</th>
                    <th>Dispositivo conectado</th>
                    <th>Voltaje</th>
                    <th>Función / Protocolo</th>
                  </tr>
                </thead>
                <tbody>
                  {ESP32_PINOUT.map((item, idx) => (
                    <tr key={idx}>
                      <td><span className="pin-code">{item.pin}</span></td>
                      <td><span className={`pin-type-tag pin-type-${item.type.toLowerCase()}`}>{item.type}</span></td>
                      <td><strong>{item.device}</strong></td>
                      <td><span className="pin-volt">{item.voltage}</span></td>
                      <td><small>{item.description}</small></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="cabinet-tech-note">
            <Info size={18}/>
            <div>
              <strong>Decisión de diseño unificada con el informe:</strong>
              <p>Se selecciona un <em>interruptor de flotador vertical con contacto magnético libre de potencial (corte a 4 L)</em> para la protección de la bomba compartida, descartando sensores ultrasónicos debido a su zona muerta de 20-25 cm, la cual resulta incompatible con la altura compacta (38 cm) del tanque de 20 L. Asimismo, el accionamiento de la bomba compartida opera mediante <em>conmutación secuencial por turnos (TDM)</em> entre las electroválvulas A y B para evitar caídas de presión en el cabezal de goteo.</p>
            </div>
          </div>
        </div>

        <div className="cabinet-modal-foot">
          <button className="cabinet-focus-btn" onClick={() => { onFocusCabinet(); onClose(); }}>
            <Focus size={15}/>
            <span>Enfocar Gabinete en Visor 3D</span>
          </button>
          <button className="cabinet-close-btn" onClick={onClose}>
            Entendido / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
