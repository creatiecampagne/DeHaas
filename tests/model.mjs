import { buildRotterdam } from '../src/model.js';
import { LOCATIONS, PALETTE } from '../src/locations.js';
import * as THREE from 'three';
import assert from 'node:assert/strict';
const m=buildRotterdam(); let draws=0,triangles=0,vertices=0;const report=[];
for (const f of LOCATIONS.rotterdam.features) {
 if(!m.features.has(f.id))throw new Error('Missing feature '+f.id);
 const box=new THREE.Box3().setFromObject(m.features.get(f.id));
 if(box.isEmpty())throw new Error('Empty model '+f.id);
 report.push({feature:f.id,size:box.getSize(new THREE.Vector3()).toArray().map(v=>+v.toFixed(2))});
}
m.root.traverse(o=>{if(!o.isMesh)return;draws++;const p=o.geometry.getAttribute('position');vertices+=p.count;triangles+=(o.geometry.index?.count||p.count)/3;
 if(Array.from(p.array).some(v=>!Number.isFinite(v)))throw new Error('Nonfinite geometry');
 if(o.material.color.getHexString()==='e55c5e')throw new Error('Coral used in 3D geometry');
 if(o.material.map)throw new Error('Texture used');
});
const turning=m.updateAnimation(35);
assert(Math.abs(turning.liftYaw)>1,'Chosen transport sample must be in a turn');
for(const id of ['lift','liftRig','liftWheels'])assert.equal(m.features.get(id).rotation.y,turning.liftYaw,`${id} must turn with the route`);
assert.equal(m.features.get('interactiveBoat').rotation.y,turning.boatYaw);
for(const bogie of m.features.get('liftWheels').children)assert.equal(bogie.rotation.y,Math.sign(bogie.position.z)*turning.steering);
console.log(JSON.stringify({features:report,drawCalls:draws,triangles,vertices,noSceneTextures:true},null,2));
