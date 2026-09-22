import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import fontData from 'three/examples/fonts/helvetiker_regular.typeface.json';
import { PALETTE as C } from './locations.js';
import { PLAN, S, SOURCE, outline, center, size, toWorld, LIFT_START, BOAT_START, BOAT_DESTINATION } from './plan.js';
import { sampleCycle } from './travelift-animation.js';

const font = new FontLoader().parse(fontData);
const cube = new THREE.BoxGeometry(1,1,1);
const cylinder = new THREE.CylinderGeometry(1,1,1,10);
const tire = new THREE.TorusGeometry(1,.29,6,12);
const up = new THREE.Vector3(0,1,0);

export function buildRotterdam(){
  const root = new THREE.Group();
  const features = new Map();
  const materials = {};
  for(const [key,color] of Object.entries(C)) {
    if(key==='coral') continue; // Coral is reserved for the interface and markers.
    materials[key] = new THREE.MeshLambertMaterial({color,flatShading:true});
  }
  materials.water = new THREE.MeshBasicMaterial({color:C.light});
  materials.foam = new THREE.MeshBasicMaterial({color:C.surface,transparent:true,opacity:.38});
  materials.line = new THREE.MeshBasicMaterial({color:C.blue,transparent:true,opacity:.24});
  materials.window = new THREE.MeshLambertMaterial({color:C.navy,flatShading:true});
  function group(parent,id,x=0,y=0,z=0){
    const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);
    if(id){g.name=id;features.set(id,g);}return g;
  }
  function box(g,x,y,z,w,h,d,m='blue'){
    const mesh=new THREE.Mesh(cube,materials[m]);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);
    mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);return mesh;
  }
  function cyl(g,x,y,z,r,h,m='navy',axis='y'){
    const mesh=new THREE.Mesh(cylinder,materials[m]);mesh.position.set(x,y,z);mesh.scale.set(r,h,r);
    if(axis==='x')mesh.rotation.z=Math.PI/2;if(axis==='z')mesh.rotation.x=Math.PI/2;
    mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);return mesh;
  }
  function beam(g,a,b,w=.25,m='blue',depth=w){
    const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),diff=end.clone().sub(start);
    const mesh=box(g,0,0,0,w,diff.length(),depth,m);mesh.position.copy(start.add(end).multiplyScalar(.5));
    mesh.quaternion.setFromUnitVectors(up,diff.normalize());return mesh;
  }
  function poly(g,pts,y,h,m){
    const shape=new THREE.Shape();pts.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();
    const geo=new THREE.ExtrudeGeometry(shape,{depth:h,bevelEnabled:false,steps:1});geo.rotateX(-Math.PI/2);geo.translate(0,y,0);
    const mesh=new THREE.Mesh(geo,materials[m]);mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);return mesh;
  }
  function text(g,value,x,y,z,size=1,m='white',rot=0){
    const geo=new THREE.ShapeGeometry(font.generateShapes(value,size,2));geo.computeBoundingBox();
    geo.translate(-(geo.boundingBox.max.x-geo.boundingBox.min.x)/2,0,0);
    const mesh=new THREE.Mesh(geo,materials[m]);mesh.position.set(x,y,z);mesh.rotation.y=rot;g.add(mesh);return mesh;
  }
  function rail(g,a,b,height=1.1,m='white'){
    beam(g,[a[0],a[1]+height,a[2]],[b[0],b[1]+height,b[2]],.10,m);
    beam(g,[a[0],a[1]+height*.5,a[2]],[b[0],b[1]+height*.5,b[2]],.08,m);
    const length=Math.hypot(a[0]-b[0],a[2]-b[2]);
    for(let i=0;i<=Math.ceil(length/2.5);i++){
      const t=i/Math.ceil(length/2.5);box(g,a[0]+(b[0]-a[0])*t,a[1]+height/2,a[2]+(b[2]-a[2])*t,.10,height,.10,m);
    }
  }
  function bollard(g,x,z,y=.2){cyl(g,x,y+.38,z,.25,.76,'navy');box(g,x,y+.68,z,.95,.22,.3,'navy');}
  function container(g,x,z,length=6,m='blue',rotation=0){
    const c=group(g,null,x,0,z);c.rotation.y=rotation;box(c,0,1.4,0,length,2.8,2.6,m);
    box(c,0,2.85,0,length+.12,.12,2.74,'light');
    for(let i=-length/2+.4;i<length/2;i+=.45)for(const k of [-1,1])box(c,i,1.4,k*1.33,.10,2.55,.07,'light');
    for(const k of [-.6,.6]){box(c,length/2+.04,1.4,k,.08,2.4,1.1,'navy');box(c,length/2+.1,1.4,k,.08,2.3,.08,'light');}
    return c;
  }
  function quad(g,a,b,c,d,m='navy'){
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute([...a,...b,...c,...a,...c,...d],3));geo.computeVertexNormals();
    const mesh=new THREE.Mesh(geo,materials[m]);g.add(mesh);return mesh;
  }
  function loft(g,bottom,top,y0,y1,m='navy'){
    for(let i=0;i<bottom.length;i++){
      const j=(i+1)%bottom.length,a=bottom[i],b=bottom[j],c=top[j],d=top[i];
      quad(g,[a[0],y0,a[1]],[b[0],y0,b[1]],[c[0],y1,c[1]],[d[0],y1,d[1]],m);
    }
  }
  function ring(g,x,y,z,r=.7,m='navy',axis='z'){
    const mesh=new THREE.Mesh(tire,materials[m]);mesh.position.set(x,y,z);mesh.scale.setScalar(r);
    if(axis==='x')mesh.rotation.y=Math.PI/2;if(axis==='y')mesh.rotation.x=Math.PI/2;g.add(mesh);return mesh;
  }
  function ladder(g,x,z,low,high,m='light'){
    for(const dx of [-.33,.33])beam(g,[x+dx,low,z],[x+dx,high,z],.075,m);
    for(let y=low;y<high;y+=.35)box(g,x,y,z,.7,.07,.09,m);
  }
  // Harbour service vessels: deep working hull, forward wheelhouse and low aft deck.
  // Dimensions are illustrative; the RPA reference supplies the silhouette and details.
  function ship(parent,x,z,length=35,width=10.5,rot=0,afloat=false,variant='rpa',name='RPA',supports=true){
    const s=group(parent,null,x,afloat?-5.55:2.6,z);s.rotation.y=rot;
    const H=width*.43,accent=variant==='utility'?'blue':'light';
    const pts=[[-.34,-.5],[-.47,-.43],[-.5,.16],[-.40,.35],[-.18,.47],[0,.5],[.18,.47],[.40,.35],[.5,.16],[.47,-.43],[.34,-.5]].map(([px,pz])=>[px*width,pz*length]);
    const keel=pts.map(([px,pz])=>[px*.52,pz*.87]),chine=pts.map(([px,pz])=>[px*.86,pz*.97]);
    loft(s,keel,chine,0,H*.44,'blue');loft(s,chine,pts,H*.44,H,'navy');poly(s,keel,-.15,.15,'blue');poly(s,pts,H,.24,'surface');
    // Continuous rubbing strakes follow the faceted hull, with open tyre fenders.
    for(let i=0;i<pts.length;i++){
      const a=pts[i],b=pts[(i+1)%pts.length];
      beam(s,[a[0]*1.01,H-.15,a[1]],[b[0]*1.01,H-.15,b[1]],.48,'navy');
      beam(s,[a[0]*.93,H*.57,a[1]*.98],[b[0]*.93,H*.57,b[1]*.98],.25,'light');
      beam(s,[a[0]*.97,H+.72,a[1]*.98],[b[0]*.97,H+.72,b[1]*.98],.22,'navy');
      beam(s,[a[0]*.97,H+.22,a[1]*.98],[a[0]*.97,H+.7,a[1]*.98],.15,'navy');
    }
    const bow=pts.slice(2,9).map(p=>[...p]);
    poly(s,bow,H+.25,1.0,accent);
    const cabinZ=length*.14,halfW=width*.33,halfL=length*.12;
    box(s,0,H+2.3,cabinZ,width*.61,4.1,length*.27,accent);
    for(const side of [-1,1]){
      box(s,side*width*.308,H+2.8,cabinZ-length*.045,.08,2.1,.95,'white');
      box(s,side*width*.314,H+3.15,cabinZ-length*.045,.05,.8,.6,'navy');
      for(let i=0;i<4;i++)cyl(s,side*width*.31,H+1.8,cabinZ+length*(-.025+i*.065),.21,.08,'navy','x');
      for(let i=0;i<6;i++){
        const fz=length*(-.39+i*.103),fx=side*width*.55;
        ring(s,fx,H-.1,fz,.78,'navy','x');beam(s,[side*width*.5,H+.63,fz-.2],[fx,H+.12,fz],.055,'light');
      }
      rail(s,[side*width*.43,H+.25,-length*.42],[side*width*.43,H+.25,length*.13],1,'light');
      rail(s,[side*width*.39,H+4.45,cabinZ-halfL],[side*width*.39,H+4.45,cabinZ+halfL],1.0,'white');
      // External access stairs up from the working deck.
      const sx=side*width*.37;
      for(let j=0;j<12;j++)box(s,sx,H+.4+j*.33,-length*.14+j*.35,1.0,.14,.48,'light');
      beam(s,[sx+side*.6,H+1.3,-length*.14],[sx+side*.6,H+5.15,-length*.14+3.85],.095,'white');
    }
    const cabin=[[-.72,-1],[-1,-.65],[-1,.62],[-.70,1],[.70,1],[1,.62],[1,-.65],[.72,-1]].map(([px,pz])=>[px*halfW,pz*halfL+cabinZ]);
    const top=cabin.map(([px,pz])=>[px*1.10,(pz-cabinZ)*1.10+cabinZ]);
    poly(s,cabin,H+4.35,.35,'white');loft(s,cabin,top,H+4.7,H+7.1,accent);poly(s,top,H+7.1,.30,'white');
    // Angled wraparound bridge glazing, divided into individual framed panes.
    for(let i=0;i<cabin.length;i++){
      const j=(i+1)%cabin.length,a=cabin[i],b=cabin[j],ta=top[i],tb=top[j];
      const pieces=Math.max(1,Math.round(Math.hypot(a[0]-b[0],a[1]-b[1])/1.35));
      for(let k=0;k<pieces;k++){
        const point=(p,q,t,f)=>[(p[0]+(q[0]-p[0])*t)*f,(p[1]+(q[1]-p[1])*t-cabinZ)*f+cabinZ];
        const p=point(a,b,(k+.10)/pieces,1.025),q=point(a,b,(k+.90)/pieces,1.025),r=point(ta,tb,(k+.90)/pieces,1.008),u=point(ta,tb,(k+.10)/pieces,1.008);
        quad(s,[p[0],H+5,p[1]],[q[0],H+5,q[1]],[r[0],H+6.83,r[1]],[u[0],H+6.83,u[1]],'navy');
      }
    }
    // Exhaust stack, equipment mast, aerials and radar crossbars.
    box(s,-width*.22,H+6,-length*.075,1.35,5.2,2,'navy');
    for(let y=H+4.4;y<H+7;y+=.5)box(s,-width*.29,y,-length*.075,.09,.10,1.7,'light');
    const mz=cabinZ-length*.035;
    beam(s,[0,H+7.4,mz],[0,H+16.7,mz],.19,'light');
    for(const [dy,w] of [[8.7,4.8],[10.6,3.9],[13.0,3.2],[15.1,2.5]]){
      beam(s,[-w/2,H+dy,mz],[w/2,H+dy,mz],.13,'light');
      for(const sign of [-1,1]){cyl(s,sign*w/2,H+dy+.25,mz,.16,.35,'navy');beam(s,[sign*w/2,H+dy,mz],[sign*w/2,H+dy+1.0,mz],.045,'white');}
    }
    box(s,0,H+9.05,cabinZ+1.3,4,.17,.35,'white');cyl(s,0,H+8.2,cabinZ+1.3,.15,1.6,'light');
    const radar=new THREE.Mesh(new THREE.SphereGeometry(.48,8,6),materials.white);radar.position.set(width*.24,H+8,cabinZ-1);s.add(radar);
    ladder(s,-width*.2,cabinZ-halfL-.15,H+.7,H+7.7);
    // Folded hydraulic deck crane; its form is retained in the house palette.
    const kn=group(s,null,width*.23,H+.3,-length*.13);
    cyl(kn,0,.55,0,.72,1.1,'navy');box(kn,0,1.8,0,.8,2.4,.9,accent);
    beam(kn,[0,2.6,0],[-.2,5.8,-2.2],.5,accent);beam(kn,[-.2,5.8,-2.2],[-.2,5.5,-7.5],.48,accent);
    beam(kn,[-.2,5.5,-7.5],[-.2,3.2,-6.1],.30,accent);beam(kn,[.3,2.4,0],[.1,5,-2],.15,'navy');
    beam(kn,[-.2,3.2,-6.1],[-.2,2.6,-6.1],.09,'navy');ring(kn,-.2,2.5,-6.1,.2,'navy');
    // Working aft deck with winch, bollards, hatch and firefighting monitor.
    box(s,0,H+.45,-length*.34,width*.36,.4,length*.14,'light');
    cyl(s,0,H+.9,-length*.25,.65,width*.26,'blue','x');
    for(const sx of [-1,1]){cyl(s,sx*width*.16,H+.9,-length*.25,.82,.15,'navy','x');bollard(s,sx*width*.33,-length*.4,H+.24);}
    cyl(s,width*.25,H+5.1,cabinZ+halfL+1,.22,1.2,'white');beam(s,[width*.25,H+5.6,cabinZ+halfL+1],[width*.25,H+5.95,cabinZ+halfL+2.1],.3,'light');
    text(s,variant==='utility'?'DE HAAS':name,0,H+1.3,length*.465,.7,'white');
    if(!afloat && supports){
      for(const az of [-length*.28,0,length*.27]){
        box(s,0,-1.3,az,2.2,2.6,2.0,'blue');box(s,0,-.15,az,2.5,.3,2.2,'light');
        for(const ax of [-1,1]){
          box(s,ax*width*.4,-2.27,az,2.0,.66,2.0,'navy');
          beam(s,[ax*width*.4,-2,az],[ax*width*.32,1.05,az],.45,'light');
          beam(s,[ax*width*.4,-2,az-1],[ax*width*.32,1.05,az],.25,'blue');
        }
      }
      for(const sign of [-1,1]){
        cyl(s,sign*width*.22,-.3,-length*.37,.25,1.5,'blue');
        ring(s,sign*width*.22,-1,-length*.37,.85,'light');
        cyl(s,sign*width*.22,-1,-length*.37,.19,.55,'navy','z');
        for(let a=0;a<3;a++){const blade=box(s,sign*width*.22,-1,-length*.37,.16,1.3,.1,'blue');blade.rotation.z=a*Math.PI/3;}
      }
    }
    return s;
  }


  const terrain=group(root,'terrain'),context=group(root,'context'),yard=group(root,'yard');
  function planBox(g,id,height,material='blue',bottom=0){
    const [x,,z]=center(id),[w,l]=size(id);return box(g,x,bottom+height/2,z,w,height,l,material);
  }
  function planLine(g,points,y=.045,width=.10,material='white'){
    for(let i=1;i<points.length;i++){
      const a=toWorld(...points[i-1],y),b=toWorld(...points[i],y);
      const length=Math.hypot(a[0]-b[0],a[2]-b[2]);
      if(length>.005){const line=box(g,(a[0]+b[0])/2,y,(a[2]+b[2])/2,width,.035,length,material);line.rotation.y=Math.atan2(b[0]-a[0],b[2]-a[2]);}
    }
  }
  poly(context,[[-145,-190],[136,-190],[136,150],[-145,150]],-4.15,1.05,'water');
  // The two narrow pontoon arms in the source land contour are built separately.
  const land=PLAN.elements[SOURCE.land].points.filter(([u,v])=>!(u>1100&&u<1506&&v<566.99));
  poly(terrain,land.map(([u,v])=>{const [x,,z]=toWorld(u,v);return[x,z];}),-3,3,'surface');
  for(const id of SOURCE.context)poly(context,outline(id),-3,3.025,'white');
  // The actual vector linework, including every parking bay, is preserved.
  const markingClasses=new Set(['st3','st6','st7','st8','st9','st10','st11','st12','st13','st14','st20']);
  for(const e of PLAN.elements)if(markingClasses.has(e.class)&&e.points.length>1){
    const offsite=e.bounds[0]>=1431&&e.bounds[1]>=967&&e.bounds[3]<=1182;
    planLine(offsite?context:terrain,e.points,.065,e.class==='st3'?.10:.095,offsite?'surface':'blue');
  }
  function coping(points,owner=terrain){
    planLine(owner,points,.11,.38,owner===context?'white':'light');
    for(let i=1;i<points.length;i++){
      const a=toWorld(...points[i-1]),b=toWorld(...points[i]),len=Math.hypot(a[0]-b[0],a[2]-b[2]);
      for(let d=0;d<len;d+=1.7){const t=d/len;box(owner,a[0]+(b[0]-a[0])*t,-1.4,a[2]+(b[2]-a[2])*t,.18,2.7,.18,'blue');}
    }
  }
  coping([[531.213,567.004],[1567,567.004]]);
  coping([[1555.173,1250.63],[1906,1250.63]]);coping([[1555.173,1323.357],[1908,1323.357]]);
  for(let u=550;u<1560;u+=75){const [x,,z]=toWorld(u,572);bollard(terrain,x,z);}
  // White context keeps the exact supplied outlines, without invented buildings.
  const outer=PLAN.elements[342].points;
  coping(outer.filter(([u,v])=>u>1565&&v<568),context);
  for(let i=0;i<12;i++){const [x,,z]=toWorld(700+i*93,250-(i%3)*75);box(context,x,-3.07,z,4,.025,.16,'foam');}

  const basin=group(root,'basin');
  const inlet=[[1555.173,1250.63],[1908.176,1250.63],[1908.176,1323.357],[1555.173,1323.357]];
  poly(basin,inlet.map(([u,v])=>{const[x,,z]=toWorld(u,v);return[x,z];}),-3.08,.025,'water');
  planBox(basin,SOURCE.basinPlatform,3,'light',-3);
  for(const v of [1242,1330])for(let u=1565;u<1890;u+=42){const [x,,z]=toWorld(u,v);bollard(basin,x,z);}
  const operator=group(basin,null,...toWorld(1873,1210));
  box(operator,0,1.35,0,3.5,2.7,3.5,'white');box(operator,0,2.8,0,3.7,.2,3.7,'navy');
  box(operator,-1.78,1.85,0,.08,.9,2.9,'navy');box(operator,0,1.85,1.78,2.9,.9,.08,'navy');

  const wash=group(root,'wash');planBox(wash,SOURCE.wash,.16,'light');
  const wb=PLAN.elements[SOURCE.wash].bounds;
  for(const v of [wb[1]+5,wb[3]-5]){
    planLine(wash,[[wb[0]+5,v],[wb[2]-5,v]],.20,.36,'navy');
    for(let u=wb[0]+8;u<wb[2]-5;u+=5)planLine(wash,[[u,v-1.8],[u,v+1.8]],.22,.06,'white');
  }
  for(let u=wb[0]+25;u<wb[2];u+=40)planLine(wash,[[u,wb[1]+10],[u,wb[3]-10]],.19,.08,'white');
  const [wx,,wz]=toWorld(wb[0]+15,wb[1]+22);box(wash,wx,1.1,wz,.7,2.2,.8,'blue');ring(wash,wx,1.5,wz+.46,.45,'navy');

  const lift=group(root,'lift',...LIFT_START);
  lift.scale.set(106.697*S/33,.78,151.319*S/36.4);
  const wheels=group(root,'liftWheels');wheels.userData.dynamic=true;wheels.scale.copy(lift.scale);
  const bogies=[];
  const height=25;
  for(const x of [-13.8,13.8]){
    box(lift,x,4,0,2.25,2.3,35,'blue');
    box(lift,x,height,0,2,2.8,36,'blue');
    box(lift,x,height+1.55,0,2.4,.3,36.4,'light');
    for(const z of [-12,12]){
      box(lift,x,14,z,2.3,20,2.7,'blue');
      box(lift,x+(x<0?1.18:-1.18),14,z,.16,19,2.35,'light');
      beam(lift,[x,5,z],[x,8,z-Math.sign(z)*4],.85,'blue');
      box(lift,x,2.8,z,4.2,1.3,7.2,'blue');
      const bogie=group(wheels,null,x,0,z);bogies.push(bogie);
      for(const wz of [-2.2,0,2.2])for(const side of [-1,1]){
        cyl(bogie,side*1.65,1.45,wz,1.38,1.0,'navy','x');
        cyl(bogie,side*2.17,1.45,wz,.67,.09,'light','x');
        cyl(bogie,side*2.23,1.45,wz,.27,.12,'blue','x');
      }
      // Keep each steerable bogie to three draw calls, one per palette colour.
      const tireParts=new Map();
      for(const mesh of bogie.children){mesh.updateMatrix();const geo=mesh.geometry.clone().applyMatrix4(mesh.matrix);
        if(!tireParts.has(mesh.material))tireParts.set(mesh.material,[]);tireParts.get(mesh.material).push(geo);}
      bogie.clear();for(const [mat,parts] of tireParts){const mesh=new THREE.Mesh(mergeGeometries(parts,false),mat);
        mesh.castShadow=true;mesh.receiveShadow=true;bogie.add(mesh);for(const geo of parts)geo.dispose();}
    }
  }
  // Two full cross beams leave a clear portal for a ship.
  for(const z of [-12,12]){box(lift,0,height,z,28.3,2.8,2.5,'white');box(lift,0,height+1.55,z,28.6,.3,2.7,'light');}
  text(lift,'DE HAAS ROTTERDAM',-14.1,24,-.5,1.18,'white',-Math.PI/2);
  text(lift,'820 MT',14.1,24,0,1.3,'white',Math.PI/2);
  text(lift,'MARINE TRAVELIFT',0,24.5,13.3,1.2,'navy');
  box(lift,-15.5,3.3,2,2.5,3.4,4.5,'white');box(lift,-16.8,4,2,.08,1.4,3.8,'navy');
  for(let y=4;y<25;y+=.8)box(lift,14.28,y,12,0.85,.09,.14,'white');
  beam(lift,[13.85,3.6,12],[13.85,25.5,12],.08,'white');beam(lift,[14.72,3.6,12],[14.72,25.5,12],.08,'white');

  const rig=group(root,'liftRig');rig.userData.dynamic=true;
  const ropes=[],bands=[],topY=19.1,rigHalf=5.9;
  for(const zz of [-6.5,-2.2,2.2,6.5])for(const side of [-1,1]){
    const rope=box(rig,side*rigHalf,0,zz,.055,1,.055,'navy');ropes.push({mesh:rope,side,zz});
    const block=box(rig,side*rigHalf,0,zz,.55,.45,.65,'navy');bands.push({mesh:block,side,zz,type:'block'});
    for(const [a,b] of [[side*rigHalf,side*3],[side*3,0]]){
      const band=box(rig,0,0,0,.13,1,.48,'navy');bands.push({mesh:band,a,b,side,zz,type:'band'});
    }
  }
  function makePlanShip(parent,id,afloat=false,name='RPA',supports=true){
    const e=PLAN.elements[id],diagonal=SOURCE.afloat.includes(id),angle=diagonal?3*Math.PI/4:0;
    const [x,,z]=center(id),[w,l]=size(id),mapped=e.points.map(([u,v])=>toWorld(u,v));
    const along=mapped.map(p=>p[0]*Math.sin(angle)+p[2]*Math.cos(angle));
    const across=mapped.map(p=>p[0]*Math.cos(angle)-p[2]*Math.sin(angle));
    const length=diagonal?Math.max(...along)-Math.min(...along):l;
    const width=diagonal?Math.max(...across)-Math.min(...across):w;
    const s=ship(parent,x,z,32,10,angle,false,'rpa',name,supports);
    const verticalScale=Math.min(.75,Math.max(.30,width/10.2));
    s.scale.set(width/11.2,verticalScale,length/32);
    s.position.y=afloat?-3.1-4.3*verticalScale*.45:2.6*verticalScale;
    return s;
  }
  for(const [i,id] of SOURCE.ships.entries())makePlanShip(yard,id,false,i===1?'RPA 15':i===2?'RPA 7':'DE HAAS');
  const animatedBoat=group(root,'interactiveBoat');
  const hull=makePlanShip(animatedBoat,SOURCE.interactiveShip,false,'RPA 15',false);
  hull.position.set(0,0,0);animatedBoat.position.copy(new THREE.Vector3(...BOAT_START));
  const stands=group(yard,null,...BOAT_DESTINATION);
  for(const z of [-5,0,5]){box(stands,0,.52,z,1.5,1.04,1.4,'blue');box(stands,0,1.10,z,1.7,.12,1.5,'light');}
  const dest=PLAN.elements[SOURCE.destination].points;
  for(let i=1;i<dest.length;i+=2)planLine(terrain,[dest[i-1],dest[i]],.05,.10,'white');

  const crane=group(root,'crane',...center(SOURCE.crane));
  crane.rotation.y=Math.atan2(825.144-625.806,1361.833-1254.942)-Math.PI/2;
  crane.scale.set(.78,.78,.78);
  box(crane,0,.45,0,7,.9,7,'light');
  for(const x of [-2.1,2.1])for(const z of [-2.1,2.1]){
    box(crane,x,.95,z,2.4,1,2.4,'navy');beam(crane,[x,1.4,z],[Math.sign(x)*1.2,5,Math.sign(z)*1.2],.5,'blue');
  }
  for(const x of [-1.15,1.15])for(const z of [-1.15,1.15])beam(crane,[x,3,z],[x,31,z],.32,'blue');
  for(let y=3;y<31;y+=3.5)for(const side of [-1,1]){
    beam(crane,[-1.15,y,side*1.15],[1.15,y,side*1.15],.20,'light');
    beam(crane,[-1.15,y,side*1.15],[1.15,y+3.5,side*1.15],.16,'light');
    beam(crane,[side*1.15,y,-1.15],[side*1.15,y,1.15],.20,'light');
    beam(crane,[side*1.15,y,-1.15],[side*1.15,y+3.5,1.15],.16,'light');
  }
  ladder(crane,0,1.4,1.5,31,'white');
  cyl(crane,0,31,0,2.1,.7,'navy');box(crane,0,31.5,0,5,.35,4,'light');
  box(crane,-1.9,32.4,1.0,2.0,2.4,2.5,'white');box(crane,-2.94,32.65,1,.09,1.35,2.1,'navy');
  box(crane,-1.9,32.65,2.28,1.7,1.35,.09,'navy');
  for(const z of [-1.1,1.1]){
    beam(crane,[-12,32,z],[31,32,z],.25,'blue');beam(crane,[-12,34,z],[31,34,z],.25,'light');
    for(let x=-12;x<30;x+=3){
      beam(crane,[x,32,z],[x+3,34,z],.16,'blue');beam(crane,[x,34,z],[x+3,32,z],.16,'blue');
      beam(crane,[x,32,-1.1],[x,32,1.1],.17,'blue');
    }
  }
  beam(crane,[-2,33,0],[0,40,0],.4,'blue');beam(crane,[2,33,0],[0,40,0],.4,'blue');
  beam(crane,[-11,34,0],[0,40,0],.12,'navy');beam(crane,[0,40,0],[26,34,0],.12,'navy');
  for(let x=-11;x<-5;x+=1.5)box(crane,x,31.4,0,1.3,3,2.7,'navy');
  box(crane,23,31.8,0,2.1,.7,2.8,'light');
  for(const z of [-.3,.3])beam(crane,[23,31.5,z],[23,11,z],.065,'navy');
  box(crane,23,10.8,0,.85,1.1,.6,'blue');ring(crane,23,10,0,.37,'navy');


  for(const id of SOURCE.containers){
    const [x,,z]=center(id),[w,l]=size(id),g=container(yard,x,z,6,'blue',w>l?0:Math.PI/2);
    g.scale.set(Math.max(w,l)/6,.65,Math.min(w,l)/2.6);
  }
  for(let id=286;id<=293;id++)planBox(yard,id,.75,'light');
  function trailer(id){
    const [x,,z]=center(id),[w,l]=size(id),g=group(yard,null,x,0,z);
    box(g,0,.62,0,w,.3,l,'light');
    for(const dz of [-l*.3,l*.3])for(const dx of [-w*.47,w*.47])cyl(g,dx,.36,dz,.35,.18,'navy','x');
    for(let dz=-l/2;dz<l/2;dz+=.55)box(g,0,.81,dz,w,.05,.08,'navy');
    beam(g,[0,.6,l/2],[0,.4,l/2+1.6],.15,'blue');
  }
  trailer(359);trailer(305);
  function shelter(g,x,z,w=8,l=14){
    const sh=group(g,null,x,0,z);box(sh,0,1.8,0,w,3.6,l,'blue');
    const curve=[];for(let i=0;i<=8;i++){const a=Math.PI-i*Math.PI/8;curve.push([Math.cos(a)*w/2,3.6+Math.sin(a)*w*.35]);}
    for(let i=0;i<8;i++){
      const a=curve[i],b=curve[i+1];quad(sh,[a[0],a[1],-l/2],[a[0],a[1],l/2],[b[0],b[1],l/2],[b[0],b[1],-l/2],'light');
      for(const zz of [-l/2,l/2])beam(sh,[a[0],a[1]+.04,zz],[b[0],b[1]+.04,zz],.12,'white');
    }
    box(sh,0,1.65,-l/2-.06,w*.73,3.3,.1,'navy');
    for(const xx of [-w/2,w/2])for(let zz=-l/2;zz<=l/2;zz+=3.5)box(sh,xx,1.8,zz,.10,3.6,.12,'light');
  }
  function parkedCar(g,x,z,rotation=0){
    const c=group(g,null,x,0,z);c.rotation.y=rotation;
    box(c,0,.72,0,1.85,1.0,4.2,'blue');box(c,0,1.42,.2,1.64,.72,2.35,'white');
    box(c,0,1.45,-1.02,1.48,.48,.08,'navy');box(c,0,1.45,1.42,1.48,.48,.08,'navy');
    for(const sx of [-1,1])for(const sz of [-1.3,1.3])cyl(c,sx*.91,.5,sz,.35,.22,'navy','x');
    return c;
  }

  for(const id of SOURCE.cars){
    const [x,,z]=center(id),[w,l]=size(id),c=parkedCar(yard,x,z,w>l?Math.PI/2:0);
    c.scale.set(Math.min(w,l)/2,.72,Math.max(w,l)/4.2);
  }
  for(const id of SOURCE.shelters){
    const [x,,z]=center(id),[w,l]=size(id),g=group(yard,null,x,0,z);
    if(w>l)g.rotation.y=Math.PI/2;
    shelter(g,0,0,Math.min(w,l),Math.max(w,l));
  }
  // Preserve the new office footprint instead of the former approximate T.
  const office=group(root,'office');
  const officeOutline=[[773.831,893.423],[920.507,893.423],[920.507,848.503],[957.729,848.503],[957.729,932.077],[773.831,932.077]].map(([u,v])=>{const[x,,z]=toWorld(u,v);return[x,z];});
  poly(office,officeOutline,0,6.0,'white');poly(office,officeOutline,3,.13,'light');poly(office,officeOutline,6,.18,'light');
  for(let i=0;i<officeOutline.length;i++){
    const a=officeOutline[i],b=officeOutline[(i+1)%officeOutline.length],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);
    const nx=dz/len,nz=-dx/len,count=Math.max(1,Math.round(len/2.6));
    for(let j=0;j<count;j++){
      const t=(j+.5)/count,x=a[0]+t*dx+nx*.06,z=a[1]+t*dz+nz*.06;
      for(const y of [1.6,4.6])box(office,x,y,z,dx?len/count-.5:.10,1.25,dz?len/count-.5:.10,'navy');
      box(office,a[0]+j/count*dx,3,a[1]+j/count*dz,.085,6,.085,'light');
    }
  }
  const [ox,,oz]=toWorld(862,892.8);text(office,'de Haas',ox-.03,6.3,oz,1.35,'navy',-Math.PI/2);
  const [doorX,,doorZ]=toWorld(929,848.1);box(office,doorX-.04,1.35,doorZ,.10,2.7,1.6,'blue');
  box(office,doorX-.7,2.9,doorZ,1.5,.12,2.5,'light');
  const hall=group(root,'hall',...center(SOURCE.hall));
  hall.scale.x=size(SOURCE.hall)[0]/28;
  const W=28,L=120,H=26;
  // Four walls, an open portal and interior trusses instead of a solid box.
  box(hall,-W/2,H/2,0,.7,H,L,'blue');box(hall,W/2,H/2,0,.7,H,L,'navy');
  box(hall,0,H/2,L/2,W,H,.7,'navy');
  box(hall,-12.5,H/2,-L/2,3,H,.8,'navy');box(hall,12.5,H/2,-L/2,3,H,.8,'navy');
  box(hall,0,24,-L/2,22,4,.8,'navy');
  // Raised sliding door, with a clear opening below and its external frame.
  box(hall,0,16.8,-60.5,21.8,10,.5,'blue');
  for(let y=12;y<22;y+=1.2)box(hall,0,y,-60.81,21.8,.08,.05,'light');
  box(hall,0,.12,0,28,.24,120,'light');
  for(let z=-57;z<60;z+=7.5){
    for(const x of [-14.4,14.4]){
      box(hall,x,13,z,.25,24,.5,'light');
      box(hall,x,14.6,z+3.4,.11,15.5,5.45,'light');
      for(let dz=-2;dz<=2;dz+=1)box(hall,x+Math.sign(x)*.1,14.6,z+3.4+dz,.08,15.7,.14,'blue');
      for(const y of [9.5,15,20])box(hall,x+Math.sign(x)*.13,y,z+3.4,.07,.13,5.5,'blue');
    }
    for(const x of [-12.8,12.8])box(hall,x,11.5,z,.48,23,.48,'light');
    beam(hall,[-13,23,z],[0,27.5,z],.34,'light');beam(hall,[0,27.5,z],[13,23,z],.34,'light');
    beam(hall,[-13,23,z],[13,23,z],.3,'light');
    for(let x=-12;x<12;x+=4)beam(hall,[x,23,z],[x+2,26.5-Math.abs(x+2)*.23,z],.18,'light');
  }
  // Repeating sawtooth bays and vertical rooflights from the new aerial.
  function sawtooth(g,cx,cz,w,l,h,step=10,m='blue'){
    for(let z=cz-l/2;z<cz+l/2-.1;z+=step){
      const end=Math.min(z+step,cz+l/2),ridge=end-2;
      quad(g,[cx-w/2,h,z],[cx-w/2,h+3,ridge],[cx+w/2,h+3,ridge],[cx+w/2,h,z],m);
      quad(g,[cx-w/2,h+3,ridge],[cx-w/2,h,end],[cx+w/2,h,end],[cx+w/2,h+3,ridge],'surface');
      for(const x of [cx-w/2,cx+w/2]){
        beam(g,[x,h,z],[x,h+3,ridge],.14,'light');beam(g,[x,h+3,ridge],[x,h,end],.14,'white');
        quad(g,[x,h,z],[x,h,end],[x,h+3,ridge],[x,h+3,ridge],m);
      }
      for(let x=cx-w/2;x<=cx+w/2;x+=4)beam(g,[x,h+3.03,ridge],[x,h+.03,end],.09,'blue');
    }
  }
  sawtooth(hall,0,0,28,120,26);
  text(hall,'SCHEEPSBOUWLOODS',0,23.65,-60.47,1.20,'white',Math.PI);
  // External door gantry, visible in the supplied stills.
  for(const x of [-15.5,15.5]){
    for(const z of [-62,-77])box(hall,x,10.5,z,.6,21,.6,'navy');
    beam(hall,[x,21,-62],[x,21,-77],.4,'navy');beam(hall,[x,18.5,-62],[x,18.5,-77],.35,'navy');
    for(let z=-76;z<-62;z+=3.5){beam(hall,[x,18.5,z],[x,21,z+3.5],.15,'light');beam(hall,[x,21,z],[x,18.5,z+3.5],.15,'light');}
    beam(hall,[x,0,-77],[x,10,-62],.23,'blue');
  }
  box(hall,-14.5,2.2,48,.16,4.4,3,'navy');


  const warehouse=group(root,'warehouse');
  const full=PLAN.elements[SOURCE.warehouse].bounds,bay=(full[2]-full[0])/4;
  for(let i=0;i<4;i++){
    const owner=i<2?warehouse:context;
    const u=full[0]+(i+.5)*bay,v=(full[1]+full[3])/2,p=toWorld(u,v),w=(full[3]-full[1])*S,l=bay*S;
    const g=group(owner,null,...p);box(g,0,5.5,0,w,11,l,i<2?'blue':'white');box(g,0,11.1,0,w+.15,.2,l+.10,i<2?'navy':'white');
    if(i>=2)continue;
    for(const side of [-1,1])for(let z=-l/2+1.2;z<l/2;z+=2.7){
      box(g,side*(w/2+.035),7,z,.08,5.8,1.5,'navy');
      for(const dz of [-.8,.8])box(g,side*(w/2+.09),7,z+dz,.08,6.1,.09,'light');
      box(g,side*(w/2+.1),7.2,z,.08,.1,1.6,'light');
    }
    for(const x of [-8,0,8]){box(g,x,11.5,0,4,.7,5,'light');box(g,x,11.9,0,3.7,.10,4.6,'navy');}
    if(i===0){box(g,0,2.2,l/2+.06,6,4.4,.10,'navy');text(g,'HET MAGAZIJN',0,7.5,l/2+.08,1.05,'white');}
  }
  const pontoons=group(root,'pontoons');
  for(const id of SOURCE.pontoons){
    const e=PLAN.elements[id],p=e.points;
    poly(pontoons,outline(id),-1.8,.50,'blue');
    const b=e.bounds,anchor=toWorld(b[2]-4.5,563),join=toWorld(b[2]-4.5,481);
    beam(pontoons,[anchor[0],.05,anchor[2]],[join[0],-1.26,join[2]],.16,'light',1.15);
    for(let i=1;i<p.length;i++){
      const a=toWorld(...p[i-1],-1.25),b=toWorld(...p[i],-1.25);
      if(Math.hypot(a[0]-b[0],a[2]-b[2])>3)rail(pontoons,a,b,.65,'light');
    }
  }
  for(const id of SOURCE.afloat)makePlanShip(pontoons,id,true,'DE HAAS',false);
  const materialInventory=new Set();
  for(const g of [...root.children]){
    g.updateMatrixWorld(true);
    if(g.userData.dynamic){
      g.traverse(o=>{if(!o.isMesh)return;const m=o.material.clone();m.userData.baseColor=m.color.clone();o.material=m;materialInventory.add(m);});
      continue;
    }
    const inverse=g.matrixWorld.clone().invert(),buckets=new Map();
    g.traverse(o=>{
      if(!o.isMesh)return;
      const cloned=o.geometry.clone();cloned.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld));
      const geo=cloned.index?cloned.toNonIndexed():cloned;if(geo!==cloned)cloned.dispose();
      geo.deleteAttribute('uv');geo.clearGroups();if(!geo.getAttribute('normal'))geo.computeVertexNormals();
      if(!buckets.has(o.material))buckets.set(o.material,[]);buckets.get(o.material).push(geo);
    });g.clear();
    for(const [m,geos] of buckets){
      const mat=m.clone();mat.userData.baseColor=mat.color.clone();materialInventory.add(mat);
      const mesh=new THREE.Mesh(mergeGeometries(geos,false),mat);
      mesh.castShadow=!['context','terrain','basin'].includes(g.name);mesh.receiveShadow=true;mesh.userData.feature=g.name;g.add(mesh);
      for(const geo of geos)geo.dispose();
    }
  }
  for(const m of Object.values(materials))m.dispose();
  function updateAnimation(seconds){
    const state=sampleCycle(seconds);
    lift.position.set(state.lift.x,0,state.lift.z);rig.position.copy(lift.position);
    lift.rotation.y=state.liftYaw;rig.rotation.y=state.liftYaw;
    wheels.position.copy(lift.position);wheels.rotation.y=state.liftYaw;
    for(const bogie of bogies)bogie.rotation.y=Math.sign(bogie.position.z)*state.steering;
    animatedBoat.position.set(state.boat.x,state.boatY,state.boat.z);
    animatedBoat.rotation.y=state.boatYaw;
    const blockY=state.slingY+2.2;
    for(const r of ropes){r.mesh.position.set(r.side*rigHalf,(topY+blockY)/2,r.zz);r.mesh.scale.y=topY-blockY;}
    for(const r of bands){
      if(r.type==='block'){r.mesh.position.y=blockY;continue;}
      const spread=state.spread||0,ax=THREE.MathUtils.lerp(r.a,r.side*rigHalf,spread),bx=THREE.MathUtils.lerp(r.b,r.side*rigHalf,spread);
      const ya=Math.abs(r.a)>3.1?blockY:state.slingY+.15,yb=Math.abs(r.b)>0?state.slingY+.15:state.slingY;
      const a=new THREE.Vector3(ax,ya,r.zz),b=new THREE.Vector3(bx,yb,r.zz),d=b.clone().sub(a);
      r.mesh.position.copy(a.add(b).multiplyScalar(.5));r.mesh.scale.y=d.length();r.mesh.quaternion.setFromUnitVectors(up,d.normalize());
    }
    return state;
  }
  updateAnimation(0);
  return {root,features,materials:materialInventory,updateAnimation,liftAnchor:()=>lift.position.clone().add(new THREE.Vector3(0,22,0))};
}
export const MODEL_BUILDERS={rotterdam:buildRotterdam};
