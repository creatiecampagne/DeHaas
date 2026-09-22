import { PLAN, toWorld, LIFT_START, BOAT_START, BOAT_DESTINATION, SOURCE } from './plan.js';

// A reversible timeline, evaluated from absolute cycle time. No incremental
// transforms: pause/resume, tab suspension and repeated loops cannot drift.
const v = p => ({x:p[0],z:p[2]});
const dock=v(BOAT_START), home=v(LIFT_START), berth=v(BOAT_DESTINATION);
const curve=PLAN.elements[SOURCE.route].points.map(([u,w])=>v(toWorld(u,w)));
function bezier(a,b,c,d,steps=36){
  const out=[];for(let i=0;i<=steps;i++){const t=i/steps,q=1-t;out.push({x:q*q*q*a.x+3*q*q*t*b.x+3*q*t*t*c.x+t*t*t*d.x,z:q*q*q*a.z+3*q*q*t*b.z+3*q*t*t*c.z+t*t*t*d.z});}return out;
}
const world=(u,w)=>v(toWorld(u,w));
// Follow the SVG route, then widen the approach inside the open lane. This
// gives the turning frame room between both fixed ships at the marked berth.
const laneBend=bezier(world(1214.673,1185),world(1214.673,1120),world(1265,1090),world(1265,1008));
const turnIn=bezier(world(1265,1008),world(1265,910),world(1180,879.37),berth);
const commonRoute=[...curve.slice(1).filter(p=>p.x>world(1214.673,1185).x),...laneBend,...turnIn.slice(1)];
const homeLead=bezier(home,{x:home.x,z:home.z+2.7},{x:commonRoute[0].x,z:commonRoute[0].z-2.7},commonRoute[0],16);
const homeRoute=[...homeLead,...commonRoute.slice(1)];
const fullRoute=[dock,...commonRoute];
function route(points,endYaw=0){
  const lengths=[0];for(let i=1;i<points.length;i++)lengths.push(lengths.at(-1)+Math.hypot(points[i].x-points[i-1].x,points[i].z-points[i-1].z));
  const total=lengths.at(-1);
  const point=d=>{d=Math.max(0,Math.min(total,d));let i=1;while(i<lengths.length-1&&lengths[i]<d)i++;
    const f=(d-lengths[i-1])/(lengths[i]-lengths[i-1]||1),a=points[i-1],b=points[i];
    return {x:a.x+(b.x-a.x)*f,z:a.z+(b.z-a.z)*f};};
  const heading=d=>{d=Math.max(0,Math.min(total,d));const a=point(d-.55),b=point(d+.55);
    const raw=Math.atan2(b.x-a.x,b.z-a.z),delta=Math.atan2(Math.sin(raw-endYaw),Math.cos(raw-endYaw));
    const f=Math.min(1,d/1.5,(total-d)/1.5),blend=f*f*(3-2*f);return endYaw+delta*blend;};
  return t=>{const d=Math.max(0,Math.min(1,t))*total,p=point(d),yaw=heading(d);
    const curvature=(heading(d+.8)-heading(d-.8))/1.6;
    const edge=Math.min(1,d/2,(total-d)/2);
    return {...p,yaw,steering:Math.max(-.65,Math.min(.65,Math.atan(curvature*6.75)))*edge*edge*(3-2*edge)};};
}
const launchPath=route(fullRoute),storagePath=route(homeRoute);
const approachCurve=route(bezier(home,{x:home.x,z:home.z-10},{x:dock.x,z:dock.z+10},dock),Math.PI);
const approach=t=>{const p=approachCurve(t);return {...p,yaw:p.yaw-Math.PI,steering:-p.steering};};
export const WATER_Y=-4.3, CARRY_Y=2.0, REST_Y=1.15, SLING_STOW_Y=8.4;
const phases=[
  [5,'Klaar bij de insteekhaven','idle'],[8,'Naar het schip','approach'],
  [4,'Hijsbanden laten zakken','rig'],[6,'Schip uit het water hijsen','lift'],
  [18,'Schip naar de werf brengen','carry'],[4,'Schip op de bokken zetten','lower'],
  [3,'Hijsbanden vrijmaken','unrig'],[13,'Terug naar de startplaats','home'],
  [12,'Schip op de werf','wait'],[13,'Schip weer ophalen','collect'],
  [3,'Hijsbanden laten zakken','rerig'],[4,'Schip van de bokken hijsen','relift'],
  [18,'Terug naar de insteekhaven','return'],[6,'Schip te water laten','launch'],
  [3,'Hijsbanden ophalen','release'],[8,'Terug naar de startplaats','finish'],
  [10,'Klaar voor de volgende cyclus','rest']
];
export const CYCLE_SECONDS=phases.reduce((sum,p)=>sum+p[0],0);
export const PHASES=phases.map((p,i)=>({duration:p[0],label:p[1],id:p[2],start:phases.slice(0,i).reduce((s,q)=>s+q[0],0)}));
const mix=(a,b,t)=>a+(b-a)*t;
const ease=t=>t*t*(3-2*t);
export function sampleCycle(seconds){
  let clock=((seconds%CYCLE_SECONDS)+CYCLE_SECONDS)%CYCLE_SECONDS;
  let phase=PHASES.at(-1);for(const p of PHASES){if(clock<p.start+p.duration){phase=p;break;}}
  const t=ease((clock-phase.start)/phase.duration), id=phase.id;
  let lift={...home},boat={...dock},boatY=WATER_Y,slingY=SLING_STOW_Y,loaded=false,spread=1;
  if(id==='approach')lift=approach(t);
  if(id==='rig'){lift={...dock};slingY=mix(SLING_STOW_Y,WATER_Y-.25,Math.min(1,t/.7));spread=1-Math.max(0,(t-.7)/.3);}
  if(id==='lift'){lift={...dock};boatY=mix(WATER_Y,CARRY_Y,t);slingY=boatY-.25;loaded=true;}
  if(id==='carry'){lift=launchPath(t);boat={...lift};boatY=CARRY_Y;slingY=boatY-.25;loaded=true;}
  if(['lower','unrig','home','wait','collect','rerig','relift'].includes(id)){boat={...berth};boatY=REST_Y;}
  if(id==='lower'){lift={...berth};boatY=mix(CARRY_Y,REST_Y,t);slingY=boatY-.25;loaded=true;}
  if(id==='unrig'){lift={...berth};spread=Math.min(1,t/.3);slingY=mix(REST_Y-.25,SLING_STOW_Y,Math.max(0,(t-.3)/.7));}
  if(id==='home')lift=storagePath(1-t);
  if(id==='collect')lift=storagePath(t);
  if(id==='rerig'){lift={...berth};slingY=mix(SLING_STOW_Y,REST_Y-.25,Math.min(1,t/.7));spread=1-Math.max(0,(t-.7)/.3);}
  if(id==='relift'){lift={...berth};boatY=mix(REST_Y,CARRY_Y,t);slingY=boatY-.25;loaded=true;}
  if(id==='return'){lift=launchPath(1-t);boat={...lift};boatY=CARRY_Y;slingY=boatY-.25;loaded=true;}
  if(id==='launch'){lift={...dock};boatY=mix(CARRY_Y,WATER_Y,t);slingY=boatY-.25;loaded=true;}
  if(id==='release'){lift={...dock};spread=Math.min(1,t/.3);slingY=mix(WATER_Y-.25,SLING_STOW_Y,Math.max(0,(t-.3)/.7));}
  if(id==='finish')lift=approach(1-t);
  if(loaded)spread=0;
  const liftYaw=lift.yaw||0,boatYaw=loaded?liftYaw:0;
  return {lift,boat,liftYaw,boatYaw,steering:lift.steering||0,boatY,slingY,spread,loaded,phase:id,label:phase.label,progress:clock/CYCLE_SECONDS};
}
