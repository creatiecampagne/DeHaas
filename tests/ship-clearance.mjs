import assert from 'node:assert/strict';
import { Box3,Vector3,Matrix4 } from 'three';
import { OBB } from 'three/addons/math/OBB.js';
import { buildRotterdam } from '../src/model.js';
import { sampleCycle,CYCLE_SECONDS,PHASES } from '../src/travelift-animation.js';
const m=buildRotterdam({inspectCollisions:true});
const boxes=parts=>parts.map(p=>new OBB().fromBox3(new Box3(new Vector3(...p.min),new Vector3(...p.max))));
const frame=boxes(m.collisionGeometry.frame),ship=boxes(m.collisionGeometry.ship);
const transformed=(box,matrix)=>{const out=box.clone().applyMatrix4(matrix);out.center.copy(box.center).applyMatrix4(matrix);return out;};
const pose=(p,y,a)=>new Matrix4().makeRotationY(a).setPosition(p.x,y,p.z);
const shipBounds=new Box3();for(const p of m.collisionGeometry.ship)shipBounds.union(new Box3(new Vector3(...p.min),new Vector3(...p.max)));
const hullEnvelope=new OBB().fromBox3(shipBounds),hits=[];
function check(state,time){
 const fm=pose(state.lift,0,state.liftYaw),sm=pose(state.boat,state.boatY,state.boatYaw);
 const envelope=transformed(hullEnvelope,sm),boatParts=ship.map(b=>transformed(b,sm));
 for(const [i,b] of frame.entries()){
  const member=transformed(b,fm);if(!member.intersectsOBB(envelope,0))continue;
  const j=boatParts.findIndex(p=>member.intersectsOBB(p,0));
  if(j!==-1)hits.push({time:+time.toFixed(2),phase:state.phase,framePart:i,shipPart:j});
 }
}
for(let t=0;t<CYCLE_SECONDS;t+=.1)check(sampleCycle(t),t);
assert.equal(hits.length,0,JSON.stringify(hits.slice(0,8)));
// Keep a regression probe for the former empty turn too close to the vessel.
const old=sampleCycle(PHASES.find(p=>p.id==='wait').start+1);
const scale=.1357502918631275,toWorld=(u,v)=>({x:(v-1030)*scale,z:(1040-u)*scale});
let caughtOldTurn=false;
for(let i=0;i<=90;i++){
 const state={...old,lift:toWorld(1208,905),boat:toWorld(1070,905),boatYaw:0,liftYaw:-i*Math.PI/180};
 check(state,0);if(hits.length){caughtOldTurn=true;break;}
}
assert(caughtOldTurn,'The geometry check must detect the former turn through the resting vessel');
console.log(JSON.stringify({solidGantryParts:frame.length,vesselParts:ship.length,shipClearanceSamples:Math.ceil(CYCLE_SECONDS*10),gantryVesselIntersections:0,formerTurnDetected:true},null,2));
