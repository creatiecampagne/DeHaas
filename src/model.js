import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import fontData from 'three/examples/fonts/helvetiker_regular.typeface.json';
import { PALETTE as C } from './locations.js';

const font = new FontLoader().parse(fontData);
const cube = new THREE.BoxGeometry(1,1,1);
const cylinder = new THREE.CylinderGeometry(1,1,1,10);
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
  function hullGeometry(length,width){
    const profile=[[-.44,-.32],[-.33,-.5],[.27,-.5],[.47,-.22],[.53,0],[.47,.22],[.27,.5],[-.33,.5],[-.44,.32]];
    const pts=profile.map(([z,x])=>[x*width,z*length]);
    const bottom=pts.map(([x,z])=>[x*.66,z*.93]);const vertices=[];
    for(let i=0;i<pts.length;i++){
      const j=(i+1)%pts.length;const a=[...bottom[i]],b=[...bottom[j]],c=[...pts[j]],d=[...pts[i]];
      vertices.push(a[0],0,a[1],b[0],0,b[1],c[0],3,c[1],a[0],0,a[1],c[0],3,c[1],d[0],3,d[1]);
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.computeVertexNormals();
    return {geo,pts};
  }
  function ship(parent,x,z,length=24,width=8,rot=0,afloat=false){
    const s=group(parent,null,x,afloat?-2.6:1.8,z);s.rotation.y=rot;
    const {geo,pts}=hullGeometry(length,width);const hull=new THREE.Mesh(geo,materials.navy);hull.castShadow=true;s.add(hull);
    poly(s,pts,3,.5,'light');
    const rubbing=pts.map(([px,pz])=>[px*1.015,pz*1.01]);
    poly(s,rubbing,2.8,.33,'navy');
    box(s,0,4.6,length*.10,width*.59,2.2,length*.35,'white');
    box(s,0,6.6,length*.04,width*.58,1.7,length*.23,'surface');
    box(s,0,7.5,length*.04,width*.65,.28,length*.29,'white');
    for(const side of [-1,1]){
      for(let i=0;i<3;i++)box(s,side*width*.301,6.75,length*(-.045+i*.085),.09,1.05,length*.06,'navy');
      box(s,side*width*.306,4.6,length*.12,.08,1.25,.6,'navy');
      for(let i=0;i<7;i++){
        const pz=length*(-.30+i*.09);const t=cyl(s,side*width*.5,2.7,pz,.52,.28,'navy','x');
        cyl(s,side*(width*.5+.17),2.7,pz,.21,.06,'blue','x');
      }
      rail(s,[side*width*.39,3.5,-length*.31],[side*width*.39,3.5,length*.26],.85,'white');
    }
    for(let i=-1;i<=1;i++)box(s,i*width*.17,6.75,length*.159,width*.135,1.05,.10,'navy');
    cyl(s,0,9.35,length*.05,.12,3.5,'white');
    beam(s,[-width*.25,9.4,length*.05],[width*.25,9.4,length*.05],.16,'white');
    box(s,width*.24,9.52,length*.05,.7,.25,.5,'navy');
    cyl(s,-width*.2,7.7,-length*.10,.3,1.8,'blue');
    cyl(s,width*.2,7.7,-length*.10,.3,1.8,'blue');
    box(s,0,3.85,-length*.25,1.7,.7,1.8,'blue');
    cyl(s,0,4.15,length*.31,.5,.5,'navy');
    if(!afloat){
      for(const az of [-length*.27,0,length*.27]){
        box(s,0,-.9,az,1.7,1.8,1.5,'blue');
        for(const ax of [-1,1]){box(s,ax*width*.38,-1.3,az,1.6,.7,1.5,'navy');beam(s,[ax*width*.38,-1,az],[ax*width*.28,1.2,az],.3,'light');}
      }
      for(const sign of [-1,1])cyl(s,sign*width*.24,.5,-length*.41,.8,.45,'light','z');
    }
    return s;
  }

  // Water is a flat, untextured slab; the quay is one concave footprint.
  const context=group(root,'context');
  poly(context,[[-139,-168],[121,-168],[132,-154],[132,143],[121,155],[-139,155],[-149,140],[-149,-155]],-4.3,1.2,'water');
  const perimeter=[[-73,132],[77,132],[77,13],[109,13],[109,-151],[62,-151],[62,-76],[44,-76],[44,-151],[4,-151],[4,-129],[-39,-129],[-61,-122],[-79,-110],[-96,-93],[-84,-89],[-69,-102],[-56,-103],[-46,-94],[-44,-77],[-46,-63],[-74,-60],[-74,103]];
  const terrain=group(root,'terrain');poly(terrain,perimeter,-3,3,'surface');
  // Quay coping and visible sheet piling.
  for(let i=0;i<perimeter.length;i++){
    const a=perimeter[i],b=perimeter[(i+1)%perimeter.length];
    beam(terrain,[a[0],.16,a[1]],[b[0],.16,b[1]],.75,'light',.42);
    const len=Math.hypot(a[0]-b[0],a[1]-b[1]);
    for(let j=0;j<len;j+=3.2){const t=j/len;box(terrain,a[0]+(b[0]-a[0])*t,-1.5,a[1]+(b[1]-a[1])*t,.34,2.7,.34,'blue');}
  }
  for(let z=-50;z<=110;z+=12)bollard(terrain,-72,z);
  // Deliberately sparse planar linework, built as geometry, not a texture.
  for(let z=-61;z<125;z+=17)box(terrain,-1,.018,z,130,.025,.075,'line');
  for(let x=-58;x<72;x+=17)box(terrain,x,.021,29,.075,.025,190,'line');
  for(let z=-71;z<127;z+=8){box(terrain,35,.04,z,.28,.045,4,'white');box(terrain,45,.04,z,.28,.045,4,'white');}
  for(let k=0;k<18;k++){
    const x=-141+(k%6)*48,z=-163+Math.floor(k/6)*156;
    box(context,x,-3.04,z,5+(k%4)*2,.035,.20,'foam');box(context,x+4,-3.04,z+2.5,4,.035,.16,'foam');
  }

  const basin=group(root,'basin');
  box(basin,53,-3.02,-113.5,18,.10,75,'blue');
  for(const x of [41.6,64.4]){
    box(basin,x,.15,-113.5,3.6,.30,75,'white');
    for(let z=-149;z<-74;z+=7.5){box(basin,x,.31,z,3.5,.03,.09,'light');bollard(basin,x,z);}
    for(let z=-145;z<-80;z+=10)box(basin,x+(x<53?1.8:-1.8),-1.4,z,.65,2.2,1.3,'navy');
  }
  // A small, white operator's cabin at the entrance.
  box(basin,71,1.6,-139,5,3.2,5,'white');box(basin,71,3.35,-139,5.4,.3,5.4,'navy');
  box(basin,68.45,2,-139,.1,1.2,4.2,'navy');box(basin,71,2,-141.55,4.2,1.2,.1,'navy');
  ship(basin,53,-121,29,8.4,0,true);

  const lift=group(root,'lift',53,0,-87);
  const height=25;
  for(const x of [-13,13]){
    box(lift,x,4,0,2.25,2.3,35,'blue');
    box(lift,x,height,0,2,2.8,36,'blue');
    box(lift,x,height+1.55,0,2.4,.3,36.4,'light');
    for(const z of [-12,12]){
      box(lift,x,14,z,2.3,20,2.7,'blue');
      box(lift,x+(x<0?1.18:-1.18),14,z,.16,19,2.35,'light');
      beam(lift,[x,5,z],[x,8,z-Math.sign(z)*4],.85,'blue');
      box(lift,x,2.8,z,4.2,1.3,7.2,'blue');
      for(const wz of [z-2.2,z,z+2.2])for(const side of [-1,1]){
        cyl(lift,x+side*1.65,1.45,wz,1.38,1.0,'navy','x');
        cyl(lift,x+side*2.17,1.45,wz,.67,.09,'light','x');
        cyl(lift,x+side*2.23,1.45,wz,.27,.12,'blue','x');
      }
    }
    for(const z of [-11,-3,5,13]){
      cyl(lift,x,height+1.75,z,.75,1.6,'navy','x');
      for(const dx of [-.35,.35])beam(lift,[x+dx,24,z],[x+dx,6,z],.075,'navy');
      box(lift,x,5.9,z,1.5,.8,1.3,'navy');
      // Wide lifting slings form a U below the keel; segmented flat strips.
      const sign=Math.sign(x),points=[[x,5.5,z],[x-sign*1.5,2.4,z],[sign*5,1.0,z],[0,.7,z]];
      for(let i=1;i<points.length;i++)beam(lift,points[i-1],points[i],.20,'navy',.85);
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

  const wash=group(root,'wash',-29,0,-83);
  box(wash,0,.18,0,43,.34,38,'light');box(wash,0,.37,0,39,.045,34,'surface');
  for(const x of [-18,18]){box(wash,x,.42,0,.8,.12,32,'navy');for(let z=-15;z<16;z+=.9)box(wash,x,.49,z,1,.04,.16,'light');}
  for(let z=-15;z<=15;z+=5)box(wash,0,.405,z,34,.022,.10,'light');
  ship(wash,-1,0,23,7.2,Math.PI/2);
  for(const z of [-12,12]){box(wash,22,1.4,z,1.5,2.8,1.2,'blue');beam(wash,[22,2.5,z],[20,3.5,z],.12,'navy');}
  rail(wash,[-22,0,-19],[22,0,-19],1.1,'blue');

  const crane=group(root,'crane',-64,0,-22);crane.rotation.y=-.42;
  for(const x of [-2.8,2.8]){
    box(crane,x,1.1,0,1.8,1.8,7.6,'navy');
    for(let z=-3;z<=3;z+=1.2)cyl(crane,x+(x<0?-.95:.95),1.15,z,.66,.08,'light','x');
  }
  cyl(crane,0,2.3,0,2.65,.9,'light');box(crane,0,4.1,0,6,3,5.5,'blue');
  box(crane,-2.1,5.1,-2,2.4,3.2,2.8,'white');box(crane,-2.1,5.5,-3.43,2,1.8,.1,'navy');
  box(crane,0,4.5,3,5,2.2,2.3,'navy');
  const from=new THREE.Vector3(0,5,-1.6),to=new THREE.Vector3(-15,32,-10);
  const dx=new THREE.Vector3(1.1,0,0),dz=new THREE.Vector3(0,0,.75);
  for(const side of [-1,1])for(const depth of [-1,1]){
    const a=from.clone().addScaledVector(dx,side).addScaledVector(dz,depth),b=to.clone().addScaledVector(dx,side*.6).addScaledVector(dz,depth*.6);
    beam(crane,a.toArray(),b.toArray(),.20,'blue');
  }
  for(let i=0;i<12;i++){
    const a=from.clone().lerp(to,i/12),b=from.clone().lerp(to,(i+1)/12);
    for(const s of [-1,1]){
      beam(crane,[a.x-1,a.y,a.z+s*.7],[b.x+1,b.y,b.z+s*.7],.12,'blue');
      beam(crane,[a.x+1,a.y,a.z+s*.7],[b.x-1,b.y,b.z+s*.7],.12,'blue');
    }
  }
  beam(crane,[-15,32,-10],[-15,9,-10],.085,'navy');cyl(crane,-15,9,-10,.45,.9,'navy');
  beam(crane,[0,6,3],[-15,32,-10],.085,'navy');

  const yard=group(root,'yard');
  ship(yard,-20,-25,26,9,0.04);ship(yard,6,17,24,8,0);ship(yard,-44,48,27,8.6,0.08);ship(yard,-40,101,21,7.5,-.07);
  for(const [x,z,l,m] of [[12,49,6,'blue'],[-60,17,6,'light'],[-62,80,6,'blue'],[15,109,12,'light'],[4,119,6,'navy'],[-54,-54,6,'white']])container(yard,x,z,l,m);
  for(let i=0;i<5;i++){
    box(yard,-18+i*3,1.2,115,2.3,2.4,2.1,'blue');box(yard,-18+i*3,2.43,115,2.5,.12,2.3,'light');
  }
  // Simple work stands and access scaffolds beside one vessel.
  for(const x of [-53,-49])for(const z of [41,44,47,50,53])box(yard,x,3,z,.12,6,.12,'light');
  for(const y of [2,4,6]){box(yard,-51,y,47,4.5,.18,14,'white');rail(yard,[-53,y,40],[-53,y,54],1,'blue');}
  for(const [x,z] of [[-4,-39],[24,65],[-61,111]]){
    const car=group(yard,null,x,0,z);box(car,0,.8,0,2,1.1,4.3,'blue');box(car,0,1.6,.2,1.8,.9,2.4,'white');box(car,0,1.7,-1.05,1.65,.5,.07,'navy');
    for(const sx of [-1,1])for(const sz of [-1.3,1.3])cyl(car,sx,.55,sz,.43,.25,'navy','x');
  }
  // A few 1.75 m figures communicate scale without adding visual noise.
  for(const [x,z] of [[17,-64],[-36,-48],[-16,35],[15,74],[-48,76],[40,10]]){
    cyl(yard,x,1.57,z,.16,.3,'white');box(yard,x,1.1,z,.44,.63,.25,'blue');
    for(const dx of [-.13,.13])beam(yard,[x+dx,.8,z],[x+dx,.1,z+.1],.14,'navy');
  }

  const office=group(root,'office',-7,0,72);
  box(office,0,3.2,0,25,6.4,9,'white');box(office,0,3.25,0,25.2,.25,9.2,'light');box(office,0,6.55,0,25.5,.3,9.5,'light');
  for(const z of [-4.56,4.56])for(let x=-10.4;x<=10.5;x+=4.2)for(const y of [1.8,4.85]){
    box(office,x,y,z,3,1.55,.12,'navy');box(office,x,y,z+Math.sign(z)*.07,.10,1.58,.04,'light');
  }
  for(let x=-12.3;x<=12.4;x+=4.1)box(office,x,3.2,4.66,.10,6.3,.10,'light');
  box(office,0,1.3,4.73,1.6,2.6,.12,'blue');box(office,0,2.95,5.8,3,.17,2.5,'navy');
  for(let i=0;i<13;i++)box(office,14, i*.23+.15,4-i*.52,2,.25,.6,'light');
  rail(office,[15.1,.2,4],[15.1,3.1,-2.4],1.1,'blue');
  text(office,'de Haas',0,7.1,4.61,2,'navy');

  const hall=group(root,'hall',63,0,72);
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
  const roofPts=[[-14,26],[0,30],[14,26]];
  const verts=[];
  for(let i=0;i<2;i++){
    const a=roofPts[i],b=roofPts[i+1];
    verts.push(a[0],a[1],-60,b[0],b[1],-60,b[0],b[1],60,a[0],a[1],-60,b[0],b[1],60,a[0],a[1],60);
  }
  const roofGeo=new THREE.BufferGeometry();roofGeo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));roofGeo.computeVertexNormals();
  const roof=new THREE.Mesh(roofGeo,materials.blue);roof.material.side=THREE.DoubleSide;roof.castShadow=true;hall.add(roof);
  for(let z=-52;z<59;z+=10){
    for(const sign of [-1,1]){const sky=box(hall,sign*7,28.13,z,12,.17,2.5,'surface');sky.rotation.z=-sign*.278;}
    beam(hall,[-14.1,26.08,z],[0,30.08,z],.12,'light');beam(hall,[0,30.08,z],[14.1,26.08,z],.12,'light');
  }
  text(hall,'SCHEEPSBOUWLOODS',0,23.65,-60.47,1.20,'white',Math.PI);
  // External door gantry, visible in the supplied stills.
  for(const x of [-15.5,15.5]){
    for(const z of [-62,-77])box(hall,x,10.5,z,.6,21,.6,'navy');
    beam(hall,[x,21,-62],[x,21,-77],.4,'navy');beam(hall,[x,18.5,-62],[x,18.5,-77],.35,'navy');
    for(let z=-76;z<-62;z+=3.5){beam(hall,[x,18.5,z],[x,21,z+3.5],.15,'light');beam(hall,[x,21,z],[x,18.5,z+3.5],.15,'light');}
    beam(hall,[x,0,-77],[x,10,-62],.23,'blue');
  }
  box(hall,-14.5,2.2,48,.16,4.4,3,'navy');

  const pontoons=group(root,'pontoons');
  for(const z of [-44,26,87]){
    box(pontoons,-95,-2,z,11,1.6,25,'navy');box(pontoons,-95,-1.13,z,11.3,.17,25.3,'surface');
    for(let dz=-11;dz<13;dz+=3.5)box(pontoons,-95,-1.02,z+dz,10.9,.045,.09,'light');
    for(const x of [-99,-91])for(const dz of [-10,10])bollard(pontoons,x,z+dz,-1.02);
    const bridge=box(pontoons,-82,-.35,z,16,.32,2.4,'light');bridge.rotation.z=.085;
    for(const dz of [-1.2,1.2])rail(pontoons,[-74,.3,z+dz],[-90,-1,z+dz],1.0,'white');
    for(const dz of [-8,8])cyl(pontoons,-102,-.5,z+dz,.6,7,'navy');
  }
  ship(pontoons,-112,25,24,8,0,true);

  // Static geometry is merged per feature/material: details stay inexpensive.
  const materialInventory = new Set();
  for(const g of [...root.children]){
    g.updateMatrixWorld(true);const inverse=g.matrixWorld.clone().invert(),buckets=new Map(),geometries=[];
    g.traverse(obj=>{
      if(!obj.isMesh)return;
      const geometry=obj.geometry.clone();geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,obj.matrixWorld));
      const simple=geometry.index?geometry.toNonIndexed():geometry;
      // Common attributes allow font shapes, primitives and custom hulls to merge.
      simple.deleteAttribute('uv');simple.clearGroups();
      if(!simple.getAttribute('normal'))simple.computeVertexNormals();
      if(!buckets.has(obj.material))buckets.set(obj.material,[]);buckets.get(obj.material).push(simple);geometries.push(geometry);
    });
    g.clear();
    for(const [material,geos] of buckets){
      const merged=mergeGeometries(geos,false),mat=material.clone();
      const mesh=new THREE.Mesh(merged,mat);mesh.castShadow=!['context','terrain','basin'].includes(g.name);mesh.receiveShadow=true;
      mat.userData.baseColor=mat.color.clone();materialInventory.add(mat);mesh.userData.feature=g.name;g.add(mesh);
      for(const geo of geos)geo.dispose();
    }
    for(const geo of geometries)geo.dispose();
  }
  for(const m of Object.values(materials))m.dispose();
  return {root,features,materials:materialInventory};
}

export const MODEL_BUILDERS = {rotterdam:buildRotterdam};
