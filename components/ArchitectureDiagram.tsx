'use client';

import { ArrowDown, ArrowLeft, ArrowRight, Cpu, Droplets, Leaf, RotateCcw, ShieldCheck, Thermometer, Waves } from 'lucide-react';
import type { ComponentId, Zone } from '../lib/design';

interface Props {
  active: Zone | null;
  tankLow: boolean;
  onSelect: (item: ComponentId) => void;
}

function FlowArrow() { return <div className="flow-down"><ArrowDown size={18}/></div>; }

export default function ArchitectureDiagram({active,tankLow,onSelect}:Props) {
  return <div className="architecture-canvas">
    <header className="architecture-title"><strong>Arquitectura funcional del sistema autónomo</strong><span>Fase 1 · URBANGROW CHALLENGE</span></header>
    <div className="arch-flow">
      <div className="arch-box arch-environment">
        <div className="arch-box-head"><Leaf size={17}/> ENTORNO Y CULTIVOS</div>
        <div className="arch-mini-row"><button onClick={()=>onSelect('bedA')}>Zona A · Lechuga</button><span className="arch-divider"/><button onClick={()=>onSelect('bedB')}>Zona B · Tomate</button></div>
      </div>
      <FlowArrow/>
      <div className="arch-box arch-sensors">
        <div className="arch-box-head"><Waves size={17}/> SENSORES · ADQUISICIÓN</div>
        <div className="arch-mini-row arch-sensor-options">
          <button onClick={()=>onSelect('moistureA')}>Humedad A</button>
          <button onClick={()=>onSelect('moistureB')}>Humedad B</button>
          <button onClick={()=>onSelect('environment')}>Temp. + HR</button>
          <button onClick={()=>onSelect('float')}>Nivel tanque</button>
        </div>
      </div>
      <FlowArrow/>
      <button className="arch-box arch-controller" onClick={()=>onSelect('esp32')}>
        <div className="arch-box-head"><Cpu size={17}/> CONTROLADOR ESP32</div>
        <span>Leer, validar y procesar señales de entrada</span>
      </button>
      <FlowArrow/>
      <div className="arch-box arch-decision">
        <strong>REGLAS DE DECISIÓN</strong>
        <span>Umbrales · Histéresis · Riego por turnos · Seguridad</span>
        <div className={`arch-decision-status ${tankLow?'blocked':active?'running':''}`}>{tankLow?'Bloqueo: nivel insuficiente':active?`Salida habilitada: canal ${active}`:'Sin actuación · monitoreo'}</div>
      </div>
      <div className="arch-split"><span><ArrowLeft size={20}/> CANAL A</span><span>CANAL B <ArrowRight size={20}/></span></div>
      <div className="arch-two-columns">
        <button className={`arch-box arch-output ${active==='A'?'irrigating':''}`} onClick={()=>onSelect('valveA')}>
          <div className="arch-box-head"><Droplets size={17}/> ACTUADOR A</div>
          <span>Electroválvula A</span>
          <strong>{active==='A'?'ABIERTA':'CERRADA'}</strong>
        </button>
        <button className={`arch-box arch-output arch-b ${active==='B'?'irrigating':''}`} onClick={()=>onSelect('valveB')}>
          <div className="arch-box-head"><Droplets size={17}/> ACTUADOR B</div>
          <span>Electroválvula B</span>
          <strong>{active==='B'?'ABIERTA':'CERRADA'}</strong>
        </button>
      </div>
      <div className="arch-double-arrow"><ArrowDown size={18}/><ArrowDown size={18}/></div>
      <div className="arch-two-columns">
        <button className={`arch-box arch-crop ${active==='A'?'irrigating':''}`} onClick={()=>onSelect('bedA')}><strong>GOTEO DE LECHUGA</strong><span>Zona A · Red localizada</span></button>
        <button className={`arch-box arch-crop arch-b ${active==='B'?'irrigating':''}`} onClick={()=>onSelect('bedB')}><strong>GOTEO DE TOMATE</strong><span>Zona B · Red localizada</span></button>
      </div>
      <div className="arch-double-in"><ArrowDown size={18}/><ArrowDown size={18}/></div>
      <div className="arch-box arch-feedback"><RotateCcw size={21}/><span><strong>NUEVA LECTURA Y RETROALIMENTACIÓN</strong><small>Retorno al controlador para verificar nuevas condiciones de riego</small></span></div>
      <div className="arch-loop-note"><RotateCcw size={14}/> El ciclo percibir → decidir → actuar → volver a percibir se repite automáticamente.</div>
    </div>
    <footer className="arch-diagram-footer"><ShieldCheck size={14}/> El nivel insuficiente del tanque prevalece sobre cualquier solicitud de riego.</footer>
  </div>;
}
