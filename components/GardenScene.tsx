'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Canvas, ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Html, Line, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { ComponentId, ViewMode, Zone } from '../lib/design';
import { DESIGN } from '../lib/design';

interface SceneProps {
  view: ViewMode;
  selected: ComponentId;
  onSelect: (id: ComponentId) => void;
  active: Zone | null;
  labels: boolean;
  dimensions: boolean;
  showNetwork: boolean;
  showSensors: boolean;
  tankLow: boolean;
  onCanvas: (el: HTMLCanvasElement) => void;
}

type P = [number, number, number];
const INK = '#102e30';
const TEAL = '#17bfa3';
const WATER = '#30bdec';
const PIPE = '#203f43';
const SOIL = '#392a21';
const WOOD = '#956443';

function CameraDirector({ view }: { view: ViewMode }) {
  const { camera } = useThree();
  const orbit = useRef<any>(null);
  useEffect(() => {
    const viewpoints: Record<ViewMode, P> = {
      iso: [6.2, 5.5, 6.8],
      top: [0.01, 8.8, 0.01],
      front: [0, 2.2, 7.5],
      side: [7.8, 2.2, 0],
      hydraulic: [-0.65, 1.85, 2.65],
      electronic: [1.40, 0.95, 1.95],
    };
    const targets: Record<ViewMode, P> = {
      iso: [0, 0.27, 0],
      top: [0, 0, 0],
      front: [0, 0.40, 0.5],
      side: [0, 0.35, 0],
      hydraulic: [-0.65, 0.35, 1.05],
      electronic: [1.40, 0.58, 1.15],
    };
    const p = viewpoints[view] || viewpoints.iso;
    const t = targets[view] || targets.iso;
    camera.position.set(...p);
    camera.lookAt(...t);
    if (orbit.current) {
      orbit.current.target.set(...t);
      orbit.current.update();
    }
    camera.updateProjectionMatrix();
  }, [view, camera]);
  return (
    <OrbitControls
      ref={orbit}
      makeDefault
      enableDamping
      dampingFactor={0.085}
      enablePan
      maxPolarAngle={Math.PI / 2.06}
      minPolarAngle={0.02}
      minDistance={0.8}
      maxDistance={22.0}
      target={[0, 0.27, 0]}
    />
  );
}

function Selected({ id, selected, onSelect, children }: {
  id: ComponentId;
  selected: ComponentId;
  onSelect: (id: ComponentId) => void;
  children: React.ReactNode;
}) {
  function choose(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation();
    onSelect(id);
  }
  return (
    <group onClick={choose} onPointerOver={(e) => {e.stopPropagation(); document.body.style.cursor = 'pointer';}} onPointerOut={() => {document.body.style.cursor = 'auto';}}>
      {children}
    </group>
  );
}

/**
 * Badge o Pin numérico 3D para identificación limpia sin interferir con la visualización.
 * Muestra el número dentro de un círculo con estilo pill y una línea indicadora.
 */
function NumberPin({num, position, visible, selected=false, offset=[0,.35,0], onClick}: {
  num: number; position: P; visible: boolean; selected?: boolean; offset?: P; onClick?: () => void;
}) {
  const anchor: P = [position[0], position[1], position[2]];
  const pinPos: P = [anchor[0]+offset[0], anchor[1]+offset[1], anchor[2]+offset[2]];
  if (!visible) return null;
  const strokeColor = selected ? '#00e5a3' : '#144c42';
  return (
    <group>
      <Line points={[pinPos, anchor]} color={strokeColor} lineWidth={1.5} transparent opacity={.85} depthTest={false} renderOrder={12}/>
      <mesh position={anchor} renderOrder={13}>
        <sphereGeometry args={[.018, 10, 10]}/>
        <meshBasicMaterial color={strokeColor} depthTest={false}/>
      </mesh>
      <Html position={pinPos} distanceFactor={8.5} style={{pointerEvents: onClick ? 'auto' : 'none'}} zIndexRange={[30,0]}>
        <div 
          onClick={onClick}
          className={`scene-pin${selected ? ' scene-pin--active' : ''}`}
          title={`Elemento #${num}`}
        >
          <span>{num}</span>
        </div>
      </Html>
    </group>
  );
}

function Tag({title, subtitle, position, visible, selected=false, offset=[0,.5,0], num}: {
  title: string; subtitle?: string; position: P; visible: boolean; selected?: boolean; offset?: P; num?: number;
}) {
  const anchor: P = [position[0], position[1]-.15, position[2]];
  const label: P = [anchor[0]+offset[0], anchor[1]+offset[1], anchor[2]+offset[2]];
  const head = useMemo(()=>{
    const dir = new THREE.Vector3(anchor[0]-label[0], anchor[1]-label[1], anchor[2]-label[2]).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0), dir);
    const p = new THREE.Vector3(...anchor).addScaledVector(dir,-.03);
    return {q, p: p.toArray() as P};
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[...anchor,...label]);
  if (!visible) return null;
  const color = selected ? '#b0f9c9' : '#0f3b37';
  return (
    <group>
      <Line points={[label, anchor]} color={color} lineWidth={1.4} transparent opacity={.85} depthTest={false} renderOrder={10}/>
      <mesh position={head.p} quaternion={head.q} renderOrder={10}>
        <coneGeometry args={[.022,.06,10]}/>
        <meshBasicMaterial color={color} transparent opacity={.9} depthTest={false}/>
      </mesh>
      <mesh position={label} renderOrder={10}>
        <sphereGeometry args={[.012,8,8]}/>
        <meshBasicMaterial color={color} depthTest={false}/>
      </mesh>
      <Html position={label} distanceFactor={9} style={{pointerEvents:'none'}} zIndexRange={[20,0]}>
        <div className={`scene-label${selected ? ' scene-label--active' : ''}`}>
          {num !== undefined && <span className="scene-label-badge">{num}</span>}
          <div className="scene-label-body">
            <strong>{title}</strong>{subtitle && <small>{subtitle}</small>}
          </div>
        </div>
      </Html>
    </group>
  );
}

function Box({pos,size,color,metalness=0,roughness=.75,opacity=1,cast=true}: {
  pos:P;size:P;color:string;metalness?:number;roughness?:number;opacity?:number;cast?:boolean;
}) {
  return (
    <mesh castShadow={cast} receiveShadow position={pos}>
      <boxGeometry args={size}/>
      <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} transparent={opacity<1} opacity={opacity}/>
    </mesh>
  );
}

function Cylinder({pos,radius,height,color,rotation,metalness=0,opacity=1}: {
  pos:P;radius:number;height:number;color:string;rotation?:P;metalness?:number;opacity?:number;
}) {
  return (
    <mesh castShadow receiveShadow position={pos} rotation={rotation}>
      <cylinderGeometry args={[radius,radius,height,18]}/>
      <meshStandardMaterial color={color} metalness={metalness} roughness={.5} opacity={opacity} transparent={opacity<1}/>
    </mesh>
  );
}

function Tube({points,color=PIPE,radius=.025,glow=false,opacity=1}: {
  points:P[];color?:string;radius?:number;glow?:boolean;opacity?:number;
}) {
  const curve = new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)), false, 'catmullrom', .1);
  return <mesh castShadow>
    <tubeGeometry args={[curve,Math.max(12,points.length*10),radius,8,false]}/>
    <meshStandardMaterial color={color} metalness={.23} roughness={.36} emissive={glow?color:'#000000'} emissiveIntensity={glow ? .30 : 0} opacity={opacity} transparent={opacity<1}/>
  </mesh>;
}

function Dimension({start,end,label,position}: {start:P;end:P;label:string;position:P}) {
  const a = new THREE.Vector3(...start), b = new THREE.Vector3(...end);
  const dir = b.clone().sub(a).normalize();
  const perpendicular = new THREE.Vector3(-dir.z,0,dir.x).multiplyScalar(.075);
  const tick1 = a.clone().sub(perpendicular), tick2=a.clone().add(perpendicular);
  const tick3=b.clone().sub(perpendicular), tick4=b.clone().add(perpendicular);
  return <group>
    <Line points={[start,end]} color="#0f9984" lineWidth={2.1}/>
    <Line points={[tick1.toArray() as P,tick2.toArray() as P]} color="#0f9984" lineWidth={2}/>
    <Line points={[tick3.toArray() as P,tick4.toArray() as P]} color="#0f9984" lineWidth={2}/>
    <Html center position={position} distanceFactor={10} style={{pointerEvents:'none'}}><span className="dim-label">{label}</span></Html>
  </group>;
}

/* ------------------------------------------------------------------ */
/* Vegetación procedural: hojas reales (curvas, onduladas, con nervio) */
/* Cada planta se fusiona en 1-2 geometrías para mantener el rendimiento */
/* ------------------------------------------------------------------ */

function rng(seed:number) {
  let s = seed|0;
  return () => {
    s = (s + 0x6D2B79F5)|0;
    let t = Math.imul(s ^ (s>>>15), 1|s);
    t = (t + Math.imul(t ^ (t>>>7), 61|t)) ^ t;
    return ((t ^ (t>>>14))>>>0) / 4294967296;
  };
}
const T = (x:number,y:number,z:number) => new THREE.Matrix4().makeTranslation(x,y,z);
const RX = (a:number) => new THREE.Matrix4().makeRotationX(a);
const RY = (a:number) => new THREE.Matrix4().makeRotationY(a);
const RZ = (a:number) => new THREE.Matrix4().makeRotationZ(a);
const mul = (...ms:THREE.Matrix4[]) => ms.reduce((a,b)=>a.multiply(b), new THREE.Matrix4());

/** Quita UVs y (opcionalmente) pinta un color uniforme por vértice para poder fusionar. */
function prep(g:THREE.BufferGeometry, color?:string) {
  g.deleteAttribute('uv');
  if (color) {
    const c = new THREE.Color(color), n = g.attributes.position.count, a = new Float32Array(n*3);
    for (let i=0;i<n;i++) { a[i*3]=c.r; a[i*3+1]=c.g; a[i*3+2]=c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(a,3));
  }
  return g;
}

interface LeafOpts {
  length:number; width:number; segL?:number; segW?:number;
  cup?:number; droop?:number; ruffle?:number; ruffleFreq?:number;
  serration?:number; serrFreq?:number; peak?:number; sharp?:number;
  base:string; tip:string; rib?:string; edge?:string; seed?:number;
}

/** Hoja a lo largo de +Z, con cara superior hacia +Y. */
function leafGeometry(o:LeafOpts) {
  const segL=o.segL??12, segW=o.segW??8, seed=o.seed??0;
  const p = Math.log(.5)/Math.log(o.peak??.5);
  const sharp = o.sharp??.7;
  const cB=new THREE.Color(o.base), cT=new THREE.Color(o.tip), cR=new THREE.Color(o.rib??o.base), cE=new THREE.Color(o.edge??o.tip);
  const c=new THREE.Color();
  const pos:number[]=[], col:number[]=[], idx:number[]=[];
  for (let i=0;i<=segL;i++) {
    const u=i/segL;
    let w = Math.pow(Math.max(0,Math.sin(Math.PI*Math.pow(u,p))), sharp);
    if (o.serration) w *= 1 - o.serration*(.5+.5*Math.sin(u*(o.serrFreq??6)*Math.PI*2+seed));
    const hw = Math.max(.04,w)*o.width/2;
    for (let j=0;j<=segW;j++) {
      const v=j/segW*2-1, av=Math.abs(v);
      let y = (o.cup??0)*v*v*hw - (o.droop??0)*u*u*o.length;
      if (o.ruffle) y += o.ruffle*av*av*hw*Math.sin(u*(o.ruffleFreq??4)*Math.PI*2 + seed + v*2.3)*(.35+u);
      y -= .25*hw*Math.max(0,1-av*6); // surco del nervio central
      pos.push(v*hw, y, u*o.length);
      c.copy(cB).lerp(cT,Math.pow(u,.7)).lerp(cR,Math.max(0,1-av*5)*(1-u*.5)*.7).lerp(cE,av*av*av*.45);
      col.push(c.r,c.g,c.b);
    }
  }
  for (let i=0;i<segL;i++) for (let j=0;j<segW;j++) {
    const a=i*(segW+1)+j, b=a+segW+1;
    idx.push(a,b,a+1, b,b+1,a+1);
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function merge(parts:THREE.BufferGeometry[]) {
  const g = mergeGeometries(parts,false)!;
  parts.forEach(p=>p.dispose());
  g.computeBoundingSphere();
  return g;
}

/** Lechuga de hoja suelta: roseta de 4 coronas de hojas rizadas. */
function buildLettuce(seed:number) {
  const r=rng(seed), parts:THREE.BufferGeometry[]=[];
  const rings=[
    {n:8,len:.20,wid:.17,elev:.40,droop:.30,off:.022,y:.015,base:'#d4eaa0',tip:'#3d8424',ruffle:.65},
    {n:7,len:.17,wid:.15,elev:.78,droop:.22,off:.016,y:.025,base:'#dcefab',tip:'#4c9a2d',ruffle:.6},
    {n:5,len:.13,wid:.12,elev:1.06,droop:.12,off:.010,y:.035,base:'#e5f4b5',tip:'#6bb53b',ruffle:.5},
    {n:4,len:.09,wid:.085,elev:1.28,droop:.05,off:.005,y:.045,base:'#eef8c6',tip:'#9ad257',ruffle:.4},
  ];
  rings.forEach((ring,ri)=>{
    for (let k=0;k<ring.n;k++) {
      const ang = k/ring.n*Math.PI*2 + ri*.9 + (r()-.5)*.35;
      const g = leafGeometry({
        length:ring.len*(.85+r()*.3), width:ring.wid*(.85+r()*.3), segL:14, segW:10,
        cup:.55, droop:ring.droop, ruffle:ring.ruffle, ruffleFreq:3.5+r()*2,
        peak:.62, sharp:.55, base:ring.base, tip:ring.tip, rib:'#eef7d2', seed:r()*10,
      });
      parts.push(g.applyMatrix4(mul(T(0,ring.y,0),RY(ang),T(0,0,ring.off),RX(-(ring.elev+(r()-.5)*.15)),RZ((r()-.5)*.3))));
    }
  });
  parts.push(prep(new THREE.CylinderGeometry(.016,.022,.05,8).translate(0,.02,0),'#cfe59a'));
  return merge(parts);
}

/** Hoja compuesta de tomate: peciolo arqueado con foliolos dentados. */
function compoundLeaf(len:number, r:()=>number) {
  const parts:THREE.BufferGeometry[]=[];
  const P=(t:number)=>new THREE.Vector3(0,len*(.42*t-.62*t*t),t*len);
  const curve=new THREE.CatmullRomCurve3([0,.25,.5,.75,1].map(P));
  parts.push(prep(new THREE.TubeGeometry(curve,16,.0035,5,false),'#5f8f36'));
  const k=len/.2;
  const add=(t:number,side:number,size:number)=>{
    const p=P(t), slope=Math.atan(.42-1.24*t);
    const g=leafGeometry({
      length:.075*size*k, width:.044*size*k, segL:10, segW:6, cup:.35, droop:.18,
      peak:.38, sharp:.8, serration:.14, serrFreq:4.5,
      base:'#7fae4e', tip:'#2f6d27', rib:'#a9cf78', edge:'#2a5f22', seed:r()*9,
    });
    const yaw = side===0 ? 0 : side*(1.05+(r()-.5)*.3);
    parts.push(g.applyMatrix4(mul(T(p.x,p.y,p.z),RY(yaw),RX(-slope*.5+.25),RZ(side*.25))));
  };
  [[.28,.85],[.52,1],[.76,1.05]].forEach(([t,s])=>{add(t,1,s);add(t,-1,s);});
  [.40,.64].forEach(t=>{add(t,1,.4);add(t,-1,.4);});
  add(1,0,1.15);
  return merge(parts);
}

function fruitGeometry(rr:number, color:string, shoulder:string) {
  const g=new THREE.SphereGeometry(rr,18,14);
  const p=g.attributes.position, n=p.count, col=new Float32Array(n*3);
  const cb=new THREE.Color(color), cs=new THREE.Color(shoulder), c=new THREE.Color();
  for (let i=0;i<n;i++) {
    const x=p.getX(i), y=p.getY(i), z=p.getZ(i), yn=y/rr;
    const lobe=1+.05*Math.cos(5*Math.atan2(z,x))*(1-yn*yn); // gajos del tomate
    p.setXYZ(i,x*lobe,y*.84,z*lobe);
    c.copy(cb).lerp(cs,Math.max(0,(yn-.35)/.65)*.45);
    col[i*3]=c.r; col[i*3+1]=c.g; col[i*3+2]=c.b;
  }
  g.deleteAttribute('uv');
  g.setAttribute('color',new THREE.BufferAttribute(col,3));
  g.computeVertexNormals();
  return g;
}

/** Tomatera entutorada: tallo, tutor, hojas compuestas en filotaxis y racimos. */
function buildTomato(seed:number) {
  const r=rng(seed), leaves:THREE.BufferGeometry[]=[], fruits:THREE.BufferGeometry[]=[];
  const H=.74;
  const stem=new THREE.CatmullRomCurve3(Array.from({length:8},(_,k)=>new THREE.Vector3(Math.sin(k*1.3+seed)*.014,k/7*H,Math.cos(k*1.1+seed)*.014)));
  leaves.push(prep(new THREE.TubeGeometry(stem,48,.011,7,false),'#5d8f34'));
  leaves.push(prep(new THREE.CylinderGeometry(.009,.009,.88,8).translate(.05,.44,-.03),'#c6a467'));
  [.2,.42,.62].forEach(y=>leaves.push(prep(new THREE.TorusGeometry(.03,.004,6,14).rotateX(Math.PI/2).translate(.025,y,-.015),'#efe6c8')));
  const truss: Record<number,{colors:string[];shoulder:string;size:number}> = {
    1:{colors:['#d42e1c','#d9381f','#c92a1a','#e0462a'],shoulder:'#e8752e',size:1.15},
    3:{colors:['#e2562a','#ee8a34','#d8401f'],shoulder:'#f2b04a',size:1},
    5:{colors:['#9cc552','#b5d160','#8fbd4a'],shoulder:'#d6e48a',size:.8},
  };
  const nodes=7;
  for (let i=0;i<nodes;i++) {
    const t=i/(nodes-1), y=.08+t*(H-.16);
    const sp=stem.getPoint(y/H);
    const ang=i*2.4+seed+(r()-.5)*.3;
    leaves.push(compoundLeaf(.22-t*.08,r).applyMatrix4(mul(T(sp.x,sp.y,sp.z),RY(ang))));
    const tr=truss[i];
    if (!tr) continue;
    const a2=ang+Math.PI+(r()-.5)*.6, dir=new THREE.Vector3(Math.sin(a2),0,Math.cos(a2));
    const q=sp.clone().addScaledVector(dir,.06).add(new THREE.Vector3(0,-.03,0));
    leaves.push(prep(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([sp,sp.clone().addScaledVector(dir,.035).add(new THREE.Vector3(0,.005,0)),q]),8,.003,5,false),'#5f8f36'));
    tr.colors.forEach((col,k)=>{
      const rr=(.028+r()*.01)*tr.size, b=k*2.1+r()*.5;
      const center=q.clone().add(new THREE.Vector3(Math.sin(b)*.035,-.045-k*.014,Math.cos(b)*.035));
      fruits.push(fruitGeometry(rr,col,tr.shoulder).translate(center.x,center.y,center.z));
      const top=center.clone().add(new THREE.Vector3(0,rr*.84,0));
      leaves.push(prep(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([q,q.clone().lerp(top,.5).add(new THREE.Vector3(0,.01,0)),top]),6,.0022,4,false),'#5f8f36'));
      for (let s=0;s<5;s++) {
        const sep=leafGeometry({length:rr*1.05,width:rr*.38,segL:5,segW:3,peak:.3,sharp:1,droop:.3,base:'#6aa63a',tip:'#3b7a26'});
        leaves.push(sep.applyMatrix4(mul(T(top.x,top.y,top.z),RY(s/5*Math.PI*2+b),RX(.25))));
      }
    });
  }
  const apex=stem.getPoint(1);
  for (let s=0;s<4;s++) {
    const g=leafGeometry({length:.05,width:.028,segL:8,segW:5,cup:.4,droop:.1,peak:.38,sharp:.8,serration:.12,serrFreq:4,base:'#9cc96a',tip:'#4f8f30',seed:r()*9});
    leaves.push(g.applyMatrix4(mul(T(apex.x,apex.y-.01,apex.z),RY(s*1.7+seed),RX(-1.05))));
  }
  return {foliage:merge(leaves), fruit:merge(fruits)};
}

const LEAF_MATS = ['#ffffff','#eefbe0','#fff8e2'].map(c=>new THREE.MeshStandardMaterial({color:c,vertexColors:true,side:THREE.DoubleSide,roughness:.68,metalness:0}));
const FRUIT_MAT = new THREE.MeshPhysicalMaterial({vertexColors:true,roughness:.3,clearcoat:.6,clearcoatRoughness:.2});
const lettuceCache: THREE.BufferGeometry[] = [];
const tomatoCache: {foliage:THREE.BufferGeometry;fruit:THREE.BufferGeometry}[] = [];

function Lettuce({pos,index}: {pos:P;index:number}) {
  const variant=index%3;
  const geo=useMemo(()=>lettuceCache[variant] ??= buildLettuce(11+variant*37),[variant]);
  return <mesh geometry={geo} material={LEAF_MATS[index%LEAF_MATS.length]} position={[pos[0],pos[1]+.03,pos[2]]}
    rotation={[0,index*1.7,0]} scale={.88+(index%4)*.05} castShadow receiveShadow/>;
}

function Tomato({pos,index}: {pos:P;index:number}) {
  const variant=index%3;
  const g=useMemo(()=>tomatoCache[variant] ??= buildTomato(5+variant*23),[variant]);
  return <group position={[pos[0],pos[1]+.05,pos[2]]} rotation={[0,(index%4)*.58+index*.9,0]} scale={.95+(index%3)*.05}>
    <mesh geometry={g.foliage} material={LEAF_MATS[0]} castShadow receiveShadow/>
    <mesh geometry={g.fruit} material={FRUIT_MAT} castShadow/>
  </group>;
}

function AnimatedDrop({x,y,z,phase,active}: {x:number;y:number;z:number;phase:number;active:boolean}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({clock}) => {
    if (!ref.current) return;
    const t = (clock.elapsedTime*1.12 + phase) % 1;
    ref.current.position.y = y - .02 - t*.23;
    ref.current.scale.setScalar(.75 + Math.sin(t*Math.PI)*.34);
  });
  if (!active) return null;
  return <mesh ref={ref} position={[x,y,z]}>
    <sphereGeometry args={[.027,9,9]}/>
    <meshStandardMaterial color="#5cdefd" emissive="#24c7ff" emissiveIntensity={.9} transparent opacity={.95}/>
  </mesh>;
}

function RaisedBed({zone,selected,onSelect,labels,showNetwork,active}: {
  zone:Zone;selected:ComponentId;onSelect:(id:ComponentId)=>void;
  labels:boolean;showNetwork:boolean;active:boolean;
}) {
  const isA=zone==='A';
  const id = isA?'bedA':'bedB';
  const x=isA?-0.8:0.8;
  const z=-0.35;
  const h=DESIGN.bed.lettuceHeight; // 0.30 m exacto según informe
  const w=DESIGN.bed.width; // 0.80 m
  const len=DESIGN.bed.length; // 1.00 m
  return <group position={[x,0,z]}>
    <Selected id={id} selected={selected} onSelect={onSelect}>
      {/* Plinto de apoyo nivelado */}
      <Box pos={[0,.025,0]} size={[w+.06,.05,len+.06]} color={selected===id?'#b7e7b1':'#a8a395'}/>
      
      {/* Sustrato orgánico rico a cota de 0,27 m (0,30 m prof.) */}
      <Box pos={[0,h-.03,0]} size={[w-.06,.06,len-.06]} color={SOIL}/>
      
      {/* Muros laterales de madera con tablones machihembrados y remates */}
      {[-1,1].map(side=> <group key={side}>
        <Box pos={[side*(w/2-.025),h/2,0]} size={[.05,h,len]} color={WOOD}/>
        {[.07,.15,.23].map(yy=><Box key={yy} pos={[side*(w/2-.05),yy,0]} size={[.01,.008,len-.04]} color="#b27f54"/>)}
        {/* Postes cantoneros estructurales de refuerzo */}
        {[-len/2+.04,len/2-.04].map(zz=><Cylinder key={zz} pos={[side*(w/2-.055),h/2,zz]} radius={.016} height={h} color="#536361" metalness={.4}/>)}
      </group>)}
      
      {/* Testeros frontal y posterior */}
      {[-1,1].map(side=> <group key={side}>
        <Box pos={[0,h/2,side*(len/2-.025)]} size={[w,h,.05]} color="#7a4e32"/>
        {[.07,.15,.23].map(yy=><Box key={yy} pos={[0,yy,side*(len/2-.05)]} size={[w-.04,.008,.01]} color="#b27f54"/>)}
      </group>)}

      {/* Plantas de cultivo con espaciamiento agronómico en marco de plantación */}
      {isA ? Array.from({length:6},(_,i)=>{
        const row=i%2, col=Math.floor(i/2);
        return <Lettuce key={i} index={i} pos={[(row-.5)*.36,h-.03,-.32+col*.32]}/>;
      }): Array.from({length:4},(_,i)=>{
        const row=i%2, col=Math.floor(i/2);
        return <Tomato key={i} index={i} pos={[(row-.5)*.38,h-.03,-.25+col*.50]}/>;
      })}

      {selected===id && (
        <mesh position={[0,.029,0]} rotation={[-Math.PI/2,0,0]}>
          <planeGeometry args={[w+.15,len+.15]}/>
          <meshBasicMaterial color={TEAL} wireframe transparent opacity={.55}/>
        </mesh>
      )}
    </Selected>

    {/* Líneas de goteo superficiales con emisores y animación de gotas */}
    {showNetwork && <Selected id="pipe" selected={selected} onSelect={onSelect}>
      {[-.18,.18].map((dx,i)=><group key={i}>
        <Tube points={[[dx,h+.04,.48],[dx,h+.04,-.48]]} radius={.013} color={active?WATER:PIPE} glow={active}/>
        {Array.from({length:5},(_,idx)=>{
          const zz=.40-idx*.20;
          return <group key={idx}>
            <Cylinder pos={[dx,h+.04,zz]} radius={.022} height={.028} color="#142c32" metalness={.3}/>
            <AnimatedDrop x={dx} y={h+.035} z={zz} phase={(idx*.2+i*.5)%1} active={active}/>
          </group>;
        })}
      </group>)}
      {/* Cabezal distribuidor en T de la cama */}
      <Tube points={[[0,h+.04,.48],[-.18,h+.04,.48]]} radius={.015} color={active?WATER:PIPE} glow={active}/>
      <Tube points={[[0,h+.04,.48],[.18,h+.04,.48]]} radius={.015} color={active?WATER:PIPE} glow={active}/>
      <Cylinder pos={[0,h+.04,.48]} radius={.022} height={.035} color="#27484e" rotation={[Math.PI/2,0,0]}/>
    </Selected>}

    {/* Marcadores 1 y 2 sin superposición */}
    <NumberPin 
      num={isA?1:2} 
      position={[0,h+.28,0]} 
      offset={[isA?-0.48:0.48, 0.32, -0.15]} 
      visible={labels} 
      selected={selected===id} 
      onClick={()=>onSelect(id)}
    />
  </group>;
}

function MoistureProbe({zone,selected,onSelect,labels,visible}: {
  zone:Zone;selected:ComponentId;onSelect:(id:ComponentId)=>void;labels:boolean;visible:boolean;
}) {
  if (!visible) return null;
  const a=zone==='A';
  const id=a?'moistureA':'moistureB';
  const x=a?-0.8:0.8;
  const z=-0.2;
  const h=DESIGN.bed.lettuceHeight; // 0.30 m
  const probeDepth = a ? 0.10 : 0.18; // 8-12 cm en A (somero lechuga), 15-20 cm en B (medio-profundo tomate)
  return <group position={[x + (a ? 0.16 : -0.16), h, z]}>
    <Selected id={id} selected={selected} onSelect={onSelect}>
      {/* Estrato de sustrato húmedo radicular visible en corte */}
      <Cylinder pos={[0,-probeDepth/2,0]} radius={.045} height={probeDepth} color={a?'#2d5045':'#40352b'} opacity={.35}/>
      
      {/* Hoja sensora capacitiva de PCB insertada verticalmente a profundidad requerida */}
      <Box pos={[0,-probeDepth/2,0]} size={[.024, probeDepth, .008]} color="#d9c4a0" metalness={.3}/>
      {/* Extremo sensor ahusado para inserción en tierra */}
      <Box pos={[0,-probeDepth+.01,0]} size={[.018, .02, .008]} color="#c2ac84"/>
      
      {/* Electrónica superior sellada con recubrimiento epoxi impermeable */}
      <Box pos={[0,.04,0]} size={[.065,.055,.035]} color={selected===id?'#5cf2c3':'#e8bb67'}/>
      <Cylinder pos={[0,.072,0]} radius={.007} height={.018} color="#2d3b44"/>
      
      {/* Cable sensor apantallado tricolor canalizado hacia el gabinete */}
      <Tube points={[[0,.08,0],[a?.05:-.05,.12,.03],[a?.12:-.12,.04,.10]]} color="#d5a660" radius={.0045}/>
    </Selected>

    {/* Marcadores 4 y 5 perfectamente diferenciados */}
    <NumberPin 
      num={a?4:5} 
      position={[0,.12,0]} 
      offset={[a?-0.30:0.30, 0.34, 0.05]} 
      visible={labels} 
      selected={selected===id} 
      onClick={()=>onSelect(id)}
    />
  </group>;
}

function EnvironmentalSensor({selected,onSelect,labels,visible}: {
  selected:ComponentId;onSelect:(id:ComponentId)=>void;labels:boolean;visible:boolean;
}) {
  if (!visible) return null;
  return <group position={[0,0,.55]}>
    <Selected id="environment" selected={selected} onSelect={onSelect}>
      {/* Mástil soporte frontal de aluminio anodizado */}
      <Cylinder pos={[0,.55,0]} radius={.016} height={1.10} color="#cbd6cc" metalness={.45}/>
      {/* Brida de anclaje inferior */}
      <Cylinder pos={[0,.02,0]} radius={.06} height={.04} color="#55655d" metalness={.3}/>
      
      {/* Garita meteorológica con 5 platos ranurados superpuestos (radiation shield) para evitar insolación directa y gotas */}
      {Array.from({length:5},(_,i)=>(
        <group key={i} position={[0, 1.05 + i * 0.035, 0]}>
          <Cylinder pos={[0,0,0]} radius={.09 - i*.003} height={.012} color="#ffffff" metalness={.1}/>
          <Cylinder pos={[0,-.008,0]} radius={.065} height={.008} color="#e5eae6"/>
        </group>
      ))}
      
      {/* Sensor SHT31 alojado dentro del abrigo ventilado */}
      <Box pos={[0,1.12,0]} size={[.035,.035,.015]} color={selected==='environment'?TEAL:'#2a5f82'}/>
      <Cylinder pos={[0,1.12,0]} radius={.006} height={.018} color="#ffffff"/>
      
      {/* Tejadillo superior cónico deflector de lluvia */}
      <Cylinder pos={[0,1.23,0]} radius={.11} height={.02} color="#ffffff"/>
      <Box pos={[0,1.245,0]} size={[.03,.015,.03]} color="#5a7065"/>
      
      {/* Manguera corrugada de cables hacia el gabinete ESP32 */}
      <Tube points={[[0,.80,0],[.30,.40,.80],[1.15,.35,1.10]]} color="#34463d" radius={.008}/>
    </Selected>

    {/* Marcador 13 en mástil sin colisiones */}
    <NumberPin 
      num={13} 
      position={[0,1.25,0]} 
      offset={[0, 0.35, 0.18]} 
      visible={labels} 
      selected={selected==='environment'} 
      onClick={()=>onSelect('environment')}
    />
  </group>;
}

function WaterTank({selected,onSelect,labels,low}: {
  selected:ComponentId;onSelect:(id:ComponentId)=>void;labels:boolean;low:boolean;
}) {
  const x=-1.80,z=1.15;
  const base=.05,h=DESIGN.tank.height,r=DESIGN.tank.diameter/2; // Tanque nominal 20 L (Ø 0.32m, h 0.38m)
  const fill=low?0.18:0.75; // Reserva 4 L = aprox 20%
  return <group position={[x,0,z]}>
    <Selected id="tank" selected={selected} onSelect={onSelect}>
      {/* Base / plinto de apoyo cilíndrico */}
      <Cylinder pos={[0,.025,0]} radius={r+.035} height={.05} color="#556762" metalness={.2}/>
      
      {/* Cuerpo cilíndrico de polietileno alimentario translúcido de 20 L */}
      <Cylinder pos={[0,base+h/2,0]} radius={r} height={h} color="#b8e6ee" opacity={.30}/>
      
      {/* Volumen de agua interno (azul cristalino o ámbar/rojo de alerta si está bajo 4 L) */}
      <Cylinder pos={[0,base+(h*fill)/2,0]} radius={r-.012} height={h*fill} color={low?'#e8736f':'#2bbad8'} opacity={.68}/>
      
      {/* Líneas de graduación de nivel de volumen en el tanque */}
      {[.08,.16,.24,.32].map((yy,i)=>(
        <Cylinder key={i} pos={[0,base+yy,0]} radius={r+.002} height={.005} color="#89c8d6" opacity={.75}/>
      ))}

      {/* Tapa roscada superior con venteo */}
      <Cylinder pos={[0,base+h+.01,0]} radius={r+.012} height={.025} color="#3d6878" metalness={.3}/>
      <Cylinder pos={[0,base+h+.035,0]} radius={.07} height={.03} color="#1b424e"/>
      
      {/* Salida inferior con válvula esférica manual y racor de conexión */}
      <Cylinder pos={[r+.025,base+.06,0]} radius={.022} height={.05} rotation={[0,0,Math.PI/2]} color="#b29348" metalness={.6}/>
      <Box pos={[r+.03,base+.10,0]} size={[.02,.05,.015]} color="#d63b2f"/>
    </Selected>

    {/* Marcador 6 dedicado exclusivamente al Tanque de 20 L */}
    <NumberPin 
      num={6} 
      position={[0,base+h+.08,0]} 
      offset={[-0.32, 0.35, 0.10]} 
      visible={labels} 
      selected={selected==='tank'} 
      onClick={()=>onSelect('tank')}
    />
  </group>;
}

function FloatSwitch({selected,onSelect,labels,low}: {
  selected:ComponentId;onSelect:(id:ComponentId)=>void;labels:boolean;low:boolean;
}) {
  const x=-1.80,z=1.15;
  const base=.05,h=DESIGN.tank.height;
  const floatHeight = low ? base + .055 : base + .22; // Boya a cota de 4L en nivel bajo
  return <group position={[x,0,z]}>
    <Selected id="float" selected={selected} onSelect={onSelect}>
      {/* Vástago guía vertical de acero inoxidable suspendido en el interior del tanque */}
      <Cylinder pos={[.08,base+h/2,0]} radius={.006} height={h-.04} color="#7b8e96" metalness={.8}/>
      
      {/* Boya magnética flotante cilíndrica (reed-switch) que corta la bomba al caer a 4 L */}
      <Cylinder pos={[.08,floatHeight,0]} radius={.032} height={.04} color={low?'#f46864':'#e5ba55'} metalness={.2}/>
      
      {/* Tope mecánico inferior que define la reserva mínima de 4 L */}
      <Cylinder pos={[.08,base+.045,0]} radius={.012} height={.01} color="#344850"/>
      
      {/* Pasacables superior IP68 y cable de señal libre de potencial hacia el ESP32 */}
      <Cylinder pos={[.08,base+h+.02,0]} radius={.014} height={.02} color="#1d3840"/>
      <Tube points={[[.08,base+h+.03,0],[.08,base+h+.12,0],[.30,base+h+.15,.10],[1.10,.70,0]]} color="#39525c" radius={.005}/>
    </Selected>

    {/* Marcador 7 dedicado exclusivamente al Sensor de Nivel / Flotador (corte a 4 L) */}
    <NumberPin 
      num={7} 
      position={[.08,base+h+.06,0]} 
      offset={[0.24, 0.38, 0.10]} 
      visible={labels} 
      selected={selected==='float'} 
      onClick={()=>onSelect('float')}
    />
  </group>;
}

function Pump({selected,onSelect,labels,active}: {
  selected:ComponentId;onSelect:(id:ComponentId)=>void;labels:boolean;active:boolean;
}) {
  return <group position={[-1.30,0,1.15]}>
    <Selected id="pump" selected={selected} onSelect={onSelect}>
      {/* Base antivibratoria con silentblocks de goma */}
      <Box pos={[0,.04,0]} size={[.32,.08,.24]} color="#566864"/>
      {[-.12,.12].map(bx=>[-.08,.08].map(bz=>(
        <Cylinder key={bx+''+bz} pos={[bx,.015,bz]} radius={.02} height={.03} color="#202a27"/>
      )))}
      
      {/* Motor eléctrico 12V DC con aletas longitudinales de disipación de calor */}
      <Cylinder pos={[-.04,.18,0]} radius={.085} height={.22} rotation={[0,0,Math.PI/2]} color="#2d424b" metalness={.65}/>
      {Array.from({length:6},(_,i)=>(
        <Cylinder key={i} pos={[-.12+i*.032,.18,0]} radius={.09} height={.008} rotation={[0,0,Math.PI/2]} color="#3e5d69" metalness={.6}/>
      ))}
      
      {/* Cabezal de bomba de diafragma de 3 cámaras con válvula antirretorno */}
      <Box pos={[.10,.18,0]} size={[.14,.15,.15]} color="#172b33"/>
      
      {/* Manómetro analógico de presión de línea con aguja indicadora en la descarga */}
      <Cylinder pos={[.10,.31,0]} radius={.04} height={.02} rotation={[0,Math.PI/2,0]} color="#f0f5f2"/>
      <Cylinder pos={[.10,.31,0]} radius={.045} height={.018} rotation={[0,Math.PI/2,0]} color="#233b44" metalness={.5}/>
      <Box pos={[.10,.31,.01]} size={[.004,.03,.002]} color="#d3392e"/>
      
      {/* Conexión de alimentación 12V DC con indicador LED activo */}
      <Box pos={[-.15,.28,0]} size={[.06,.05,.06]} color="#20353c"/>
      <Cylinder pos={[-.15,.31,0]} radius={.012} height={.01} color={active?'#3de1a3':'#788d96'}/>
    </Selected>

    {/* Marcador 8 exclusivo para la Bomba hidráulica compartida */}
    <NumberPin 
      num={8} 
      position={[0,.36,0]} 
      offset={[-0.10, 0.35, 0.22]} 
      visible={labels} 
      selected={selected==='pump'} 
      onClick={()=>onSelect('pump')}
    />
  </group>;
}

function Filter({selected,onSelect,labels}: {
  selected:ComponentId;onSelect:(id:ComponentId)=>void;labels:boolean;
}) {
  return <group position={[-0.85,0,1.15]}>
    <Selected id="filter" selected={selected} onSelect={onSelect}>
      {/* Carcasa cilíndrica de polipropileno reforzado con anillas/malla 120 mesh */}
      <Cylinder pos={[0,.20,0]} radius={.075} height={.28} color="#ede6cc" opacity={.95}/>
      
      {/* Tapa roscada superior con anilla de apriete para apertura de mantenimiento */}
      <Cylinder pos={[0,.35,0]} radius={.09} height={.045} color="#2d4952" metalness={.3}/>
      <Cylinder pos={[0,.38,0]} radius={.04} height={.02} color="#1b3239"/>
      
      {/* Base del filtro con tapón roscado de purga de sedimentos */}
      <Cylinder pos={[0,.05,0]} radius={.085} height={.035} color="#2d4952" metalness={.3}/>
      <Cylinder pos={[0,.02,0]} radius={.03} height={.025} color="#1b3239"/>
      
      {/* Nervios estructurales de refuerzo exterior */}
      {[.14,.21,.28].map(yy=><Cylinder key={yy} pos={[0,yy,0]} radius={.078} height={.008} color="#8a9e91"/>)}
    </Selected>

    {/* Marcador 9 exclusivo para el Filtro de riego */}
    <NumberPin 
      num={9} 
      position={[0,.38,0]} 
      offset={[0, 0.35, 0.22]} 
      visible={labels} 
      selected={selected==='filter'} 
      onClick={()=>onSelect('filter')}
    />
  </group>;
}

function Valve({zone,selected,onSelect,labels,active}: {
  zone:Zone;selected:ComponentId;onSelect:(id:ComponentId)=>void;labels:boolean;active:boolean;
}) {
  const a=zone==='A';const x=a?-0.4:0.4;
  const id=a?'valveA':'valveB';
  const num=a?10:11;
  return <group position={[x,0,0.85]}>
    <Selected id={id} selected={selected} onSelect={onSelect}>
      {/* Cuerpo de válvula hidráulica de diafragma con conexiones roscadas */}
      <Box pos={[0,.13,0]} size={[.20,.11,.16]} color="#46585f" metalness={.4}/>
      
      {/* Solenoide electromagnético 12V DC (Normalmente Cerrada - NC) */}
      <Cylinder pos={[0,.22,0]} radius={.055} height={.14} color={active?'#1ab8c2':'#2a5a6d'} metalness={.3}/>
      <Box pos={[0,.30,0]} size={[.10,.05,.10]} color="#143142"/>
      
      {/* Tornillo superior de purga manual de aire y emergencia */}
      <Cylinder pos={[0,.34,0]} radius={.02} height={.02} color={active?'#3de1a3':'#8faab0'}/>
      
      {/* Racores roscados de entrada y salida de latón */}
      <Cylinder pos={[0,.13,-.09]} radius={.045} height={.04} rotation={[Math.PI/2,0,0]} color="#b29348" metalness={.6}/>
      <Cylinder pos={[0,.13,.09]} radius={.045} height={.04} rotation={[Math.PI/2,0,0]} color="#b29348" metalness={.6}/>
    </Selected>

    {/* Marcadores 10 y 11 exclusivos para cada Electroválvula */}
    <NumberPin 
      num={num} 
      position={[0,.32,0]} 
      offset={[a?-0.20:0.20, 0.35, 0.15]} 
      visible={labels} 
      selected={selected===id} 
      onClick={()=>onSelect(id)}
    />
  </group>;
}

function Controller({selected,onSelect,labels}: {
  selected:ComponentId;onSelect:(id:ComponentId)=>void;labels:boolean;
}) {
  const isTarget = selected === 'esp32';
  return <group position={[1.40,0,1.15]}>
    <Selected id="esp32" selected={selected} onSelect={onSelect}>
      {/* Pedestal de montaje en tubo de acero galvanizado */}
      <Cylinder pos={[0,.24,0]} radius={.028} height={.48} color="#60736e" metalness={.5}/>
      {/* Pletina base de 4 pernos fijada al suelo */}
      <Box pos={[0,.02,0]} size={[.20,.03,.20]} color="#445550" metalness={.4}/>
      {[-.07,.07].map(px=>[-.07,.07].map(pz=>(
        <Cylinder key={px+''+pz} pos={[px,.04,pz]} radius={.01} height={.02} color="#8a9e96" metalness={.6}/>
      )))}

      {/* Gabinete estanco IP65 de policarbonato industrial */}
      <Box pos={[0,.60,0]} size={[.44,.36,.22]} color="#d6e2d9"/>
      <Box pos={[0,.60,.10]} size={[.41,.33,.02]} color="#21544a"/>
      
      {/* Tapa frontal abatible / transparente que se abre al seleccionarse o en vista electrónica */}
      <Box 
        pos={[0,.60,.12]} 
        size={[.40,.32,.015]} 
        color="#a1ccc2" 
        opacity={isTarget ? 0.35 : 0.85}
      />

      {/* DETALLES INTERNOS VISIBLES (Placa PCB, ESP32, Relés, Step-Down, Borneras) */}
      {/* Placa base PCB verde */}
      <Box pos={[0,.60,.03]} size={[.36,.28,.01]} color="#175c3a"/>
      
      {/* Microcontrolador ESP32 DevKit de 30 pines con chip metálico y antena dorada */}
      <Box pos={[-.08,.64,.045]} size={[.10,.14,.01]} color="#1c2f35"/>
      <Box pos={[-.08,.66,.055]} size={[.07,.06,.005]} color="#9ba8ab" metalness={.8}/>
      <Box pos={[-.08,.70,.052]} size={[.06,.015,.003]} color="#c99c3a" metalness={.7}/> {/* Antena PCB */}
      <Cylinder pos={[-.11,.60,.055]} radius={.005} height={.008} rotation={[Math.PI/2,0,0]} color="#38bdf8"/> {/* LED WiFi */}
      <Cylinder pos={[-.05,.60,.055]} radius={.005} height={.008} rotation={[Math.PI/2,0,0]} color="#ef4444"/> {/* LED PWR */}

      {/* Módulo de relés de potencia optoacoplados (3 relés azules Songle para Bomba, Válvula A y Válvula B) */}
      <Box pos={[.09,.65,.045]} size={[.14,.11,.01]} color="#214258"/>
      {[-.03,0,.03].map((rx,idx)=>(
        <Box key={idx} pos={[.06+rx*1.3,.66,.06]} size={[.032,.05,.025]} color="#1d66ad"/>
      ))}
      {/* Diodos de protección flyback (1N4007) */}
      {[-.03,0,.03].map((rx,idx)=>(
        <Cylinder key={'d'+idx} pos={[.06+rx*1.3,.61,.052]} radius={.004} height={.018} rotation={[0,0,Math.PI/2]} color="#1c1f21"/>
      ))}

      {/* Módulo convertidor Step-down DC-DC (12V -> 5V) con bobina toroidal */}
      <Box pos={[-.08,.51,.045]} size={[.09,.07,.01]} color="#1e3e50"/>
      <Cylinder pos={[-.08,.51,.058]} radius={.018} height={.012} rotation={[Math.PI/2,0,0]} color="#b27f42" metalness={.6}/>

      {/* Regleta de borneras tipo Euroblock rotuladas para conexiones de sensores y actuadores */}
      <Box pos={[.08,.50,.045]} size={[.16,.04,.025]} color="#237b4b"/>
      {Array.from({length:6},(_,i)=>(
        <Cylinder key={i} pos={[.015+i*.022,.50,.06]} radius={.004} height={.008} color="#d4e3dc"/>
      ))}

      {/* Prensaestopas pasacables IP68 en la base inferior del gabinete */}
      {[-.10,0,.10].map((px,i)=>(
        <Cylinder key={i} pos={[px,.41,0]} radius={.016} height={.035} color="#21332c"/>
      ))}
      
      {/* Haces de cables de colores que bajan por el pedestal */}
      <Tube points={[[0,.40,0],[0,.15,0],[0,.05,.10],[0,.05,1.0]]} color="#354942" radius={.014}/>
    </Selected>

    {/* Marcador 12 exclusivo para el Gabinete ESP32 & Potencia */}
    <NumberPin 
      num={12} 
      position={[0,.80,0]} 
      offset={[0.28, 0.35, 0.08]} 
      visible={labels} 
      selected={isTarget} 
      onClick={()=>onSelect('esp32')}
    />
  </group>;
}

function HydraulicNetwork({active,selected,onSelect,visible}: {
  active:Zone|null;selected:ComponentId;onSelect:(id:ComponentId)=>void;visible:boolean;
}) {
  if (!visible) return null;
  const running = active!==null;
  const onA = active==='A';
  const onB = active==='B';
  const bedH = DESIGN.bed.lettuceHeight;

  return <Selected id="pipe" selected={selected} onSelect={onSelect}>
    {/* 1. TRAMO DE SUCCIÓN: Base del Tanque (-1.80, 0.06, 1.15) -> Succión de Bomba (-1.42, 0.18, 1.15) */}
    <Tube 
      points={[[-1.65,.06,1.15], [-1.52,.06,1.15], [-1.44,.18,1.15]]} 
      color={running?WATER:PIPE} 
      glow={running} 
      radius={.020}
    />
    
    {/* 2. TRAMO DE IMPULSIÓN: Salida de Bomba (-1.20, 0.22, 1.15) -> Entrada de Filtro (-0.95, 0.22, 1.15) */}
    <Tube 
      points={[[-1.20,.22,1.15], [-0.95,.22,1.15]]} 
      color={running?WATER:PIPE} 
      glow={running} 
      radius={.018}
    />
    
    {/* 3. TRAMO POST-FILTRACIÓN HACIA MANIFOLD DE DISTRIBUCIÓN: Filtro (-0.75, 0.22, 1.15) -> Manifold central en T (0, 0.20, 1.15) */}
    <Tube 
      points={[[-0.75,.22,1.15], [-0.40,.20,1.15], [0,.20,1.15], [0.40,.20,1.15]]} 
      color={running?WATER:PIPE} 
      glow={running} 
      radius={.018}
    />
    
    {/* Manifold / derivación en T centralizada con bifurcaciones hacia las electroválvulas */}
    <Cylinder pos={[0,.20,1.15]} radius={.032} height={.06} color="#2b474e" metalness={.4}/>
    
    {/* 4. RAMALES DE DERIVACIÓN: Manifold -> Entrada de Electroválvula A (-0.40, 0.13, 0.85) */}
    <Tube 
      points={[[-0.40,.20,1.15], [-0.40,.13,0.95]]} 
      color={running?WATER:PIPE} 
      glow={running} 
      radius={.016}
    />
    {/* Manifold -> Entrada de Electroválvula B (0.40, 0.13, 0.85) */}
    <Tube 
      points={[[0.40,.20,1.15], [0.40,.13,0.95]]} 
      color={running?WATER:PIPE} 
      glow={running} 
      radius={.016}
    />

    {/* 5. SECTOR A: Salida de Electroválvula A (-0.40) -> Conducción a Cama A (-0.80) -> Subida vertical y cabezal */}
    <Tube 
      points={[
        [-0.40,.13,0.75],
        [-0.40,.10,0.60],
        [-0.80,.10,0.60],
        [-0.80,bedH+.04,0.52],
        [-0.80,bedH+.04,0.48]
      ]} 
      color={onA?WATER:PIPE} 
      glow={onA} 
      radius={.015}
    />

    {/* 6. SECTOR B: Salida de Electroválvula B (0.40) -> Conducción a Cama B (0.80) -> Subida vertical y cabezal */}
    <Tube 
      points={[
        [0.40,.13,0.75],
        [0.40,.10,0.60],
        [0.80,.10,0.60],
        [0.80,bedH+.04,0.52],
        [0.80,bedH+.04,0.48]
      ]} 
      color={onB?WATER:PIPE} 
      glow={onB} 
      radius={.015}
    />

    {/* Codos y uniones estancas de transición */}
    <Cylinder pos={[-0.40,.20,1.15]} radius={.028} height={.05} color="#2b474e" metalness={.4}/>
    <Cylinder pos={[0.40,.20,1.15]} radius={.028} height={.05} color="#2b474e" metalness={.4}/>
    <Cylinder pos={[-0.80,bedH+.04,0.48]} radius={.022} height={.04} color="#213d42" rotation={[Math.PI/2,0,0]}/>
    <Cylinder pos={[0.80,bedH+.04,0.48]} radius={.022} height={.04} color="#213d42" rotation={[Math.PI/2,0,0]}/>

    {/* Marcador 3 exclusivo para Líneas de goteo y red de distribución */}
    <NumberPin 
      num={3} 
      position={[-0.80,bedH+.06,0.30]} 
      offset={[-0.24, 0.35, 0.16]} 
      visible={true} 
      selected={selected==='pipe'} 
      onClick={()=>onSelect('pipe')}
    />
  </Selected>;
}

function SceneDimensions({visible}: {visible:boolean}) {
  if (!visible) return null;
  return <group>
    {/* Módulo general de implantación (4,80 × 3,60 m) - Cotas preliminares */}
    <Dimension start={[-2.4,.08,-2.0]} end={[2.4,.08,-2.0]} label="4,80 m · ancho módulo (preliminar)" position={[0,.20,-2.12]}/>
    <Dimension start={[2.45,.08,-1.8]} end={[2.45,.08,1.8]} label="3,60 m · fondo módulo (preliminar)" position={[2.55,.20,0]}/>
    
    {/* Pasillo central de circulación y servicio */}
    <Dimension start={[-.4,.32,-.85]} end={[.4,.32,-.85]} label="0,80 m · pasillo central" position={[0,.44,-.85]}/>
    
    {/* Cama A: 1,00 m (largo) × 0,80 m (ancho) × 0,30 m (profundidad) */}
    <Dimension start={[-1.25,.05,-.85]} end={[-1.25,.05,.15]} label="1,00 m · largo Cama A" position={[-1.38,.16,-.35]}/>
    <Dimension start={[-1.2,.04,-.90]} end={[-0.4,.04,-.90]} label="0,80 m · ancho Cama A" position={[-0.8,.18,-1.04]}/>
    <Dimension start={[-1.25,.02,.18]} end={[-1.25,.32,.18]} label="0,30 m · profundidad" position={[-1.38,.18,.18]}/>

    {/* Cama B: 1,00 m (largo) × 0,80 m (ancho) × 0,30 m (profundidad) */}
    <Dimension start={[0.4,.04,-.90]} end={[1.2,.04,-.90]} label="0,80 m · ancho Cama B" position={[0.8,.18,-1.04]}/>
    <Dimension start={[1.25,.05,-.85]} end={[1.25,.05,.15]} label="1,00 m · largo Cama B" position={[1.38,.16,-.35]}/>
    <Dimension start={[1.25,.02,.18]} end={[1.25,.32,.18]} label="0,30 m · profundidad" position={[1.38,.18,.18]}/>

    {/* Cotas preliminares de sensores radiculares */}
    <Dimension start={[-0.64,.30,-.20]} end={[-0.64,.20,-.20]} label="8-12 cm prof. (lechuga)" position={[-0.64,.25,-.08]}/>
    <Dimension start={[0.64,.30,-.20]} end={[0.64,.12,-.20]} label="15-20 cm prof. (tomate)" position={[0.64,.21,-.08]}/>
    
    {/* Tanque de abastecimiento */}
    <Dimension start={[-1.96,.05,1.35]} end={[-1.64,.05,1.35]} label="Ø 0,32 m · Tanque 20 L (preliminar)" position={[-1.80,.15,1.48]}/>
  </group>;
}

/** Textura procedural de césped (briznas de varios verdes) generada en un canvas. */
function useGrassTexture(repeatX:number, repeatY:number) {
  return useMemo(()=>{
    const size=256, c=document.createElement('canvas');
    c.width=c.height=size;
    const x=c.getContext('2d')!;
    x.fillStyle='#4f8a30'; x.fillRect(0,0,size,size);
    const r=rng(7), greens=['#3f7a26','#4c8a2e','#5e9c3a','#6fae45','#7fbd50','#3a6e22','#8cc45a'];
    for (let i=0;i<7000;i++) {
      const px=r()*size, py=r()*size, l=3+r()*7;
      x.strokeStyle=greens[Math.floor(r()*greens.length)];
      x.globalAlpha=.55+r()*.45; x.lineWidth=.8+r()*.8;
      x.beginPath(); x.moveTo(px,py); x.lineTo(px+(r()-.5)*4,py-l); x.stroke();
    }
    const t=new THREE.CanvasTexture(c);
    t.wrapS=t.wrapT=THREE.RepeatWrapping;
    t.repeat.set(repeatX,repeatY);
    t.colorSpace=THREE.SRGBColorSpace;
    t.anisotropy=8;
    return t;
  },[repeatX,repeatY]);
}

function Ground() {
  const lawn = useGrassTexture(100,100);
  const pad = useGrassTexture(4.8/1.1,3.6/1.1);
  return <group>
    {/* Césped exterior amplio */}
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.14,0]} receiveShadow>
      <planeGeometry args={[200,200]}/><meshStandardMaterial map={lawn} color="#c9dcb4" roughness={1}/>
    </mesh>
    {/* Bordillo delimitador del módulo 4.8 x 3.6 m */}
    <Box pos={[0,-.04,0]} size={[4.95,.18,3.75]} color="#a9a89a"/>
    {/* Césped interior del módulo */}
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,.051,0]} receiveShadow>
      <planeGeometry args={[4.80,3.60]}/><meshStandardMaterial map={pad} roughness={1}/>
    </mesh>
    {/* Pasillo central de grava y franja de servicio frontal */}
    <Box pos={[0,.068,-.35]} size={[.78,.012,1.30]} color="#cdbf9f"/>
    <Box pos={[0,.069,1.15]} size={[4.0,.01,.46]} color="#bdb7a6"/>
    {Array.from({length:9},(_,i)=>-1.6+i*.4).map((x,i)=><Line key={'s'+i} points={[[x,.076,.92],[x,.076,1.38]]} color="#a39d8c" lineWidth={.7}/>)}
  </group>;
}

function Model(props: Omit<SceneProps,'onCanvas'>) {
  const {selected,onSelect,labels,dimensions,showNetwork,showSensors,active,tankLow}=props;
  return <>
    <hemisphereLight args={['#ffffff','#708b7b',2.1]}/>
    <ambientLight intensity={.35}/>
    <directionalLight castShadow position={[3.8,8,4.5]} intensity={3.1} shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} shadow-normalBias={.03}/>
    <directionalLight position={[-4,3,-4]} intensity={.6} color="#a8d4c7"/>
    <Ground/>
    <ContactShadows position={[0,.055,0]} opacity={.22} scale={8.6} blur={2.8} far={2.4}/>
    <RaisedBed zone="A" selected={selected} onSelect={onSelect} labels={labels} showNetwork={showNetwork} active={active==='A'}/>
    <RaisedBed zone="B" selected={selected} onSelect={onSelect} labels={labels} showNetwork={showNetwork} active={active==='B'}/>
    <MoistureProbe zone="A" selected={selected} onSelect={onSelect} labels={labels} visible={showSensors}/>
    <MoistureProbe zone="B" selected={selected} onSelect={onSelect} labels={labels} visible={showSensors}/>
    <EnvironmentalSensor selected={selected} onSelect={onSelect} labels={labels} visible={showSensors}/>
    <WaterTank selected={selected} onSelect={onSelect} labels={labels} low={tankLow}/>
    <FloatSwitch selected={selected} onSelect={onSelect} labels={labels} low={tankLow}/>
    <Pump selected={selected} onSelect={onSelect} labels={labels} active={active!==null}/>
    <Filter selected={selected} onSelect={onSelect} labels={labels}/>
    <Valve zone="A" selected={selected} onSelect={onSelect} labels={labels} active={active==='A'}/>
    <Valve zone="B" selected={selected} onSelect={onSelect} labels={labels} active={active==='B'}/>
    <Controller selected={selected} onSelect={onSelect} labels={labels}/>
    <HydraulicNetwork active={active} selected={selected} onSelect={onSelect} visible={showNetwork}/>
    <SceneDimensions visible={dimensions}/>
  </>;
}

export default function GardenScene(props: SceneProps) {
  return <Canvas
    shadows
    dpr={[1,1.8]}
    camera={{position:[8.6,7.7,9.6],fov:37,near:.1,far:90}}
    gl={{antialias:true,preserveDrawingBuffer:true,alpha:false}}
    onCreated={({gl}) => {gl.setClearColor('#e6f1eb');props.onCanvas(gl.domElement);}}
  >
    <CameraDirector view={props.view}/>
    <Model {...props}/>
  </Canvas>;
}
