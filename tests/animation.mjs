import assert from 'node:assert/strict';
import { sampleCycle, PHASES, CYCLE_SECONDS, WATER_Y, REST_Y, CARRY_Y } from '../src/travelift-animation.js';
import { PLAN,S,SOURCE,toWorld,BOAT_START,BOAT_DESTINATION,LIFT_START } from '../src/plan.js';
const d=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const at=p=>({x:p[0],z:p[2]});
function inside(point,poly){let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const a=poly[i],b=poly[j];if((a[1]>point[1])!==(b[1]>point[1])&&point[0]<(b[0]-a[0])*(point[1]-a[1])/(b[1]-a[1])+a[0])c=!c;
}return c;}
const land=[SOURCE.land,...SOURCE.context,SOURCE.basinPlatform].map(i=>PLAN.elements[i].points);
const rotate=(x,z,a)=>({x:x*Math.cos(a)+z*Math.sin(a),z:-x*Math.sin(a)+z*Math.cos(a)});
function rectangle(x,z,w,l,yaw=0){return [[-1,-1],[-1,1],[1,1],[1,-1]].map(([sx,sz])=>{const p=rotate(sx*w/2,sz*l/2,yaw);return{x:x+p.x,z:z+p.z};});}
function intersect(a,b){
  for(const poly of [a,b])for(let i=0;i<4;i++){
    const p=poly[i],q=poly[(i+1)%4],axis={x:p.z-q.z,z:q.x-p.x};
    const ap=a.map(v=>v.x*axis.x+v.z*axis.z),bp=b.map(v=>v.x*axis.x+v.z*axis.z);
    if(Math.max(...ap)<=Math.min(...bp)||Math.max(...bp)<=Math.min(...ap))return false;
  }return true;
}
const obstacles=[...SOURCE.ships,...SOURCE.cars,...SOURCE.office,SOURCE.hall,SOURCE.warehouse];
let groundFailures=[],overlaps=[],maxYaw=0,maxSteering=0,maxHeadingStep=0,previousYaw=0;
for(let t=0;t<CYCLE_SECONDS;t+=.1){
  const s=sampleCycle(t);
  assert(Object.values(s.lift).every(Number.isFinite));assert(s.boatY>=WATER_Y-.001&&s.boatY<=CARRY_Y+.001);
  maxYaw=Math.max(maxYaw,Math.abs(s.liftYaw));maxSteering=Math.max(maxSteering,Math.abs(s.steering));
  maxHeadingStep=Math.max(maxHeadingStep,Math.abs(s.liftYaw-previousYaw));previousYaw=s.liftYaw;
  if(s.loaded){assert(d(s.lift,s.boat)<1e-6,`Boat detached while loaded at ${t}`);assert.equal(s.boatYaw,s.liftYaw);}
  for(const sx of [-1,1])for(const sz of [-1,1])for(const side of [-1,1])for(const dz of [-2.2,0,2.2]){
    const tire=rotate(side*1.65,dz,sz*s.steering);
    const local=rotate((sx*13.8+tire.x)*106.697*S/33,(sz*12+tire.z)*151.319*S/36.4,s.liftYaw);
    const x=s.lift.x+local.x,z=s.lift.z+local.z;
    const p=[PLAN.origin[0]-z/S,PLAN.origin[1]+x/S];
    if(!land.some(poly=>inside(p,poly)))groundFailures.push({t:+t.toFixed(1),p});
  }
  const liftBounds=rectangle(s.lift.x,s.lift.z,15.3,20.54,s.liftYaw);
  for(const id of obstacles){const b=PLAN.elements[id].bounds,c=toWorld((b[0]+b[2])/2,(b[1]+b[3])/2),w=(b[3]-b[1])*S,l=(b[2]-b[0])*S;
    if(intersect(liftBounds,rectangle(c[0],c[2],w,l)))overlaps.push({t:+t.toFixed(1),id});
  }
}
for(const p of PHASES.slice(1)){
  const a=sampleCycle(p.start-1e-6),b=sampleCycle(p.start+1e-6);
  for(const key of ['boat','lift'])assert(d(a[key],b[key])<.001,`Position jump at ${p.id}: ${key}`);
  for(const key of ['boatY','slingY','spread','liftYaw','boatYaw','steering'])assert(Math.abs(a[key]-b[key])<.001,`Transform jump at ${p.id}: ${key}`);
}
assert(maxYaw>1,'Travelift must turn into the cross lane');assert(maxSteering>.1,'Bogies must steer through corners');
assert(maxHeadingStep<.25,'Travelift heading must change smoothly between samples');
assert.deepEqual(sampleCycle(0),sampleCycle(CYCLE_SECONDS));
const waiting=sampleCycle(PHASES.find(p=>p.id==='wait').start+3);
assert.equal(waiting.boatY,REST_Y);assert(d(waiting.boat,at(BOAT_DESTINATION))<1e-6);assert(d(waiting.lift,at(LIFT_START))<1e-6);
assert(d(sampleCycle(0).boat,at(BOAT_START))<1e-6);
assert.equal(groundFailures.length,0,JSON.stringify(groundFailures.slice(0,4)));
assert.equal(overlaps.length,0,JSON.stringify(overlaps.slice(0,4)));
console.log(JSON.stringify({cycleSeconds:CYCLE_SECONDS,phases:PHASES.length,samples:Math.ceil(CYCLE_SECONDS*10),maxTurnDegrees:maxYaw*180/Math.PI,maxWheelSteeringDegrees:maxSteering*180/Math.PI,maxHeadingStepDegrees:maxHeadingStep*180/Math.PI,continuous:true,boatRemainsOnStandsDuringWait:true,wheelGroundFailures:0,staticObjectCollisions:0},null,2));
