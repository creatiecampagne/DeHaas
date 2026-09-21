import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import fontData from 'three/examples/fonts/helvetiker_regular.typeface.json';
import { PALETTE as C } from './locations.js';

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
  function ship(parent,x,z,length=35,width=10.5,rot=0,afloat=false,variant='rpa',name='RPA'){
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
    if(!afloat){
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

  // Water is a flat, untextured slab; the quay is one concave footprint.
  const context=group(root,'context');
  poly(context,[[-139,-168],[121,-168],[132,-154],[132,143],[121,155],[-139,155],[-149,140],[-149,-155]],-4.3,1.2,'water');
  const perimeter=[[-73,132],[77,132],[77,13],[123,13],[123,-151],[62,-151],[62,-76],[44,-76],[44,-151],[4,-151],[4,-129],[-39,-129],[-61,-122],[-79,-110],[-96,-93],[-84,-89],[-69,-102],[-56,-103],[-46,-94],[-44,-77],[-46,-63],[-74,-60],[-74,103]];
  const terrain=group(root,'terrain');poly(terrain,perimeter,-3,3,'surface');
  // Quay coping and visible sheet piling.
  for(let i=0;i<perimeter.length;i++){
    const a=perimeter[i],b=perimeter[(i+1)%perimeter.length];
    // Inland parcel boundaries are paving seams, not quay walls.
    if(i<4){beam(terrain,[a[0],.045,a[1]],[b[0],.045,b[1]],.12,'light',.08);continue;}
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
  ship(basin,53,-121,34,10.2,0,true);

  // Parked on the central apron, as in the supplied aerial photograph.
  const lift=group(root,'lift',18,0,-30);
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
  ship(lift,0,0,34,10.2,0);

  const wash=group(root,'wash',75,0,-113);
  // Narrow wash strip between the basin and the new warehouse.
  const washSurface=group(wash,null);washSurface.scale.set(18/43,1,52/38);
  box(washSurface,0,.18,0,43,.34,38,'light');box(washSurface,0,.37,0,39,.045,34,'surface');
  for(const x of [-18,18]){box(washSurface,x,.42,0,.8,.12,32,'navy');for(let z=-15;z<16;z+=.9)box(washSurface,x,.49,z,1,.04,.16,'light');}
  for(let z=-15;z<=15;z+=5)box(washSurface,0,.405,z,34,.022,.10,'light');
  for(const z of [-12,12]){box(washSurface,22,1.4,z,1.5,2.8,1.2,'blue');beam(washSurface,[22,2.5,z],[20,3.5,z],.12,'navy');}
  rail(washSurface,[-22,0,-19],[22,0,-19],1.1,'blue');
  // Quay tower crane: vertical mast, horizontal jib and braced counterjib.
  const crane=group(root,'crane',-64,0,-24);crane.rotation.y=-.3;
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

  const yard=group(root,'yard');
  ship(yard,-38,10,36,11,.02,false,'rpa','RPA 7');ship(yard,-34,-40,38,11.6,.035,false,'rpa','RPA 15');
  ship(yard,-11,-38,35,10.5,0);ship(yard,-58,20,34,10,-.035,false,'utility');
  for(const [x,z,l,m] of [[-60,62,6,'blue'],[-61,48,12,'light'],[-62,91,6,'blue'],[17,117,12,'light'],[-43,116,6,'navy'],[-61,-52,6,'white'],[16,51,6,'light']])container(x>12?context:yard,x,z,l,m);
  for(let i=0;i<5;i++){
    box(context,15+i*3,1.2,125,2.3,2.4,2.1,'blue');box(context,15+i*3,2.43,125,2.5,.12,2.3,'light');
  }
  // Simple work stands and access scaffolds beside one vessel.
  for(const x of [-46,-43])for(const z of [-53,-49,-45,-41,-37,-33,-29])box(yard,x,3.8,z,.12,7.6,.12,'light');
  for(const y of [2,4,6]){box(yard,-44.5,y,-41,3.5,.18,25,'white');rail(yard,[-46,y,-53],[-46,y,-29],1,'blue');}
  ladder(yard,-44.5,-53.3,.2,7);
  for(const [x,z] of [[28,32],[24,-70],[-61,111]]){
    const car=group(yard,null,x,0,z);box(car,0,.8,0,2,1.1,4.3,'blue');box(car,0,1.6,.2,1.8,.9,2.4,'white');box(car,0,1.7,-1.05,1.65,.5,.07,'navy');
    for(const sx of [-1,1])for(const sz of [-1.3,1.3])cyl(car,sx,.55,sz,.43,.25,'navy','x');
  }
  // A few 1.75 m figures communicate scale without adding visual noise.
  for(const [x,z] of [[26,-58],[-42,-56],[-23,36],[29,82],[-54,86],[40,10],[-4,53],[-55,20]]){
    cyl(yard,x,1.57,z,.16,.3,'white');box(yard,x,1.1,z,.44,.63,.25,'blue');
    for(const dx of [-.13,.13])beam(yard,[x+dx,.8,z],[x+dx,.1,z+.1],.14,'navy');
  }

  // Storage and service zones visible in the aerial: cable reels, racks and sheds.
  function reel(g,x,z,r=1.25){
    box(g,x,.2,z,2.8,.4,2.8,'light');cyl(g,x,r+.35,z,r*.61,1.5,'navy','z');
    for(const dz of [-.8,.8]){cyl(g,x,r+.35,z+dz,r,.15,'blue','z');cyl(g,x,r+.35,z+dz*1.12,.27,.10,'light','z');}
  }
  for(let z=35;z<=119;z+=9)reel(context,30,z,1.1+(z%3)*.15);
  for(let z=2;z<=112;z+=18){
    box(yard,-67,.45,z,4,.9,3,'blue');
    for(let i=0;i<3;i++)box(yard,-67,1.03+i*.3,z,5.5,.21,.55,'light');
  }
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
  shelter(yard,-59,62,7,13);shelter(yard,-55,105,9,12);shelter(context,16,101,8,12);
  // Open steel work gantry behind the office.
  for(const x of [-19,-8])for(const z of [51,62])box(yard,x,4.2,z,.32,8.4,.32,'blue');
  for(const z of [51,62]){
    beam(yard,[-19,8.4,z],[-8,8.4,z],.35,'blue');beam(yard,[-19,6.9,z],[-8,6.9,z],.23,'blue');
    for(let x=-19;x<-8;x+=2.75)beam(yard,[x,6.9,z],[x+2.75,8.4,z],.13,'light');
  }
  for(const x of [-19,-8])beam(yard,[x,8.4,51],[x,8.4,62],.25,'blue');
  container(yard,-13.5,59,6,'light');

  // The neighboring training plant gives the curved waterfront its real context.
  const plant=group(context,null,-17,0,-104);
  box(plant,0,.18,0,29,.36,33,'light');
  for(const x of [-10,0,10])for(const z of [-12,0,12])box(plant,x,6,z,.30,12,.30,'blue');
  for(const y of [3.5,7.5,11.5]){
    box(plant,0,y,0,21,.16,25,'surface');
    for(const z of [-12.5,12.5])rail(plant,[-10.5,y,z],[10.5,y,z],1.05,'blue');
    for(const x of [-10.5,10.5])rail(plant,[x,y,-12.5],[x,y,12.5],1.05,'blue');
  }
  for(const x of [-10,10])for(let z=-12;z<12;z+=12)beam(plant,[x,0,z],[x,11.5,z+12],.15,'blue');
  cyl(plant,-6,16.5,-5,1.15,33,'white');
  for(let y=5;y<33;y+=4.5){ring(plant,-6,y,-5,1.16,'light','y');beam(plant,[-6,y,-5],[3,y,-5],.20,'light');}
  ladder(plant,-6,-6.3,.4,32,'blue');
  cyl(plant,12,5,17,3.2,10,'blue');
  for(const y of [1,3,5,7,9])ring(plant,12,y,17,3.18,'light','y');
  cyl(plant,12,10.1,17,3.3,.22,'surface');
  box(plant,17,2.5,-7,7,5,11,'white');box(plant,17,5.1,-7,7.3,.2,11.3,'navy');
  for(let z=-11;z<-2;z+=2.5)box(plant,13.46,3,z,.1,1.7,1.7,'navy');
  for(const x of [-13,13])rail(plant,[x,0,-17],[x,0,14],1.8,'blue');
  container(context,10,-130,6,'light');container(context,-28,-78,6,'white');

  function parkedCar(g,x,z,rotation=0){
    const c=group(g,null,x,0,z);c.rotation.y=rotation;
    box(c,0,.72,0,1.85,1.0,4.2,'blue');box(c,0,1.42,.2,1.64,.72,2.35,'white');
    box(c,0,1.45,-1.02,1.48,.48,.08,'navy');box(c,0,1.45,1.42,1.48,.48,.08,'navy');
    for(const sx of [-1,1])for(const sz of [-1.3,1.3])cyl(c,sx*.91,.5,sz,.35,.22,'navy','x');
  }
  // Two parking courts on the inland apron, separated by the travel route.
  for(const [cx,cz,rows,count] of [[60,-38,2,11],[87,-37,2,11]]){
    for(let row=0;row<rows;row++)for(let i=0;i<count;i++){
      const x=cx+(row-(rows-1)/2)*8,z=cz+(i-(count-1)/2)*2.7;
      box(terrain,x,.04,z,5.5,.04,2.6,'surface');
      box(terrain,x,.07,z-1.3,5.5,.04,.12,'white');
      if((i+row)%5!==0)parkedCar(yard,x,z,Math.PI/2);
    }
    for(const sign of [-1,1])box(terrain,cx+sign*(rows*4+1),.07,cz,.14,.04,count*2.7,'white');
  }
  for(let i=0;i<6;i++){const x=-1+i*3.8;box(terrain,x,.055,3,3.3,.04,6,'light');box(terrain,x-1.7,.09,3,.12,.03,6,'white');if(i!==2)parkedCar(yard,x,3);}
  // Railings, lighting and material racks along the quay.
  for(const z of [-57,8,78,125]){
    cyl(yard,-71,6,z,.12,12,'light');beam(yard,[-71,12,z],[-68,12,z],.14,'light');box(yard,-68,11.9,z,1.3,.3,.5,'white');
  }

  // T-shaped modular office, with its front at z=11 beside the hall portal (z=12).
  const office=group(root,'office',-5,0,16);
  const officeOutline=[[-16,-5],[-16,5],[-7,5],[-7,30],[7,30],[7,5],[16,5],[16,-5]];
  poly(office,officeOutline,0,6.45,'white');poly(office,officeOutline,3.18,.15,'light');
  poly(office,officeOutline,6.45,.22,'light');
  for(let i=0;i<officeOutline.length;i++){
    const a=officeOutline[i],b=officeOutline[(i+1)%officeOutline.length],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);
    const nx=-dz/len,nz=dx/len,modules=Math.max(1,Math.floor(len/3.8));
    for(let k=0;k<modules;k++){
      const t=(k+.5)/modules,x=a[0]+dx*t+nx*.05,z=a[1]+dz*t+nz*.05;
      for(const y of [1.8,4.9]){
        box(office,x,y,z,dx?len/modules-1:.12,1.5,dz?len/modules-1:.12,'navy');
        box(office,x+nx*.08,y,z+nz*.08,dx?.09:.06,1.52,dz?.09:.06,'light');
      }
      box(office,a[0]+dx*k/modules,3.2,a[1]+dz*k/modules,.1,6.4,.1,'light');
    }
    beam(office,[a[0],6.8,a[1]],[b[0],6.8,b[1]],.15,'white');
  }
  box(office,0,1.4,-5.12,1.8,2.8,.12,'blue');box(office,0,2,-5.2,1.3,1.1,.08,'navy');
  box(office,0,3.1,-6.2,4,.18,2.5,'navy');
  for(let i=0;i<15;i++)box(office,17.4,.11+i*.215,4.5-i*.42,1.8,.18,.48,'light');
  rail(office,[18.4,.2,4.5],[18.4,3.2,-1.4],1.05,'blue');
  box(office,17.3,3.25,-2.3,2.3,.2,2,'light');
  for(const x of [-4,4])box(office,x,6.95,19,1.8,.7,2.5,'white');
  text(office,'de Haas',0,7.15,-5.12,2.25,'navy',Math.PI);
  text(office,'de Haas',-16.12,6.95,0,1.45,'navy',-Math.PI/2);

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

  // The marked parcel excludes the inland strip behind the office.
  poly(context,[[12,13],[48,13],[48,132],[12,132]],.075,.03,'white');
  poly(context,[[-35,-125],[32,-125],[32,-65],[-35,-65]],.075,.03,'white');
  // Off-site land continues behind the halls and toward the RDM complex.
  poly(context,[[77,13],[123,13],[123,-151],[167,-151],[167,159],[-73,159],[-73,132],[77,132]],-3,3,'white');
  box(context,140,.035,4,12,.06,300,'surface');
  for(let z=-140;z<151;z+=9)box(context,140,.085,z,.15,.035,4,'light');
  for(const [x,z,w,l,h] of [[146,-112,31,70,22],[147,-22,30,72,24],[143,78,35,100,19],[-24,146,88,17,9]]){
    box(context,x,h/2,z,w,h,l,'white');sawtooth(context,x,z,w,l,h,10,'white');
  }

  // Het Magazijn: long modular facade, tall windows, rooflights and end entrance.
  const warehouse=group(root,'warehouse',105,0,-113);
  box(warehouse,0,6,0,30,12,74,'blue');box(warehouse,0,12.15,0,30.5,.3,74.5,'navy');
  for(const side of [-1,1])for(let z=-33;z<=33;z+=5.5){
    box(warehouse,side*15.08,7.7,z,.13,7.4,3.8,'navy');
    for(const dz of [-1.95,0,1.95])box(warehouse,side*15.18,7.7,z+dz,.12,7.7,.12,'light');
    box(warehouse,side*15.2,7,z,.10,.13,4,'light');
    box(warehouse,side*15.15,5,z+2.65,.15,10,.15,'light');
    if(z%11===0)box(warehouse,side*15.12,2.1,z,.13,4.2,3.6,'light');
  }
  for(const z of [-37.08,37.08]){
    box(warehouse,0,2.6,z,8,5.2,.15,'navy');
    for(const x of [-4,-2,0,2,4])box(warehouse,x,2.6,z+Math.sign(z)*.1,.11,5.2,.1,'light');
    text(warehouse,'HET MAGAZIJN',0,8.4,z+Math.sign(z)*.08,1.4,'white',z<0?Math.PI:0);
  }
  for(const z of [-27,-9,9,27])for(const x of [-8,8]){
    box(warehouse,x,12.65,z,5,.9,7,'light');box(warehouse,x,13.15,z,4.7,.12,6.7,'navy');
    for(const dz of [-2,0,2])box(warehouse,x,13.23,z+dz,4.8,.06,.09,'white');
  }
  for(const z of [-18,18])box(warehouse,0,12.8,z,3,1.2,4,'white');

  // Lower adjoining workshop bays; kept secondary to the 120 × 28 m repair hall.
  box(context,94,-1.5,72,34,3,120,'light');
  for(const [x,h] of [[85,18],[101,16]]){
    box(context,x,h/2,72,15.6,h,120,'light');sawtooth(context,x,72,15.8,120,h,12,'light');
    for(const z of [11.8,132.2]){
      box(context,x,6,z,12,10,.15,'blue');
      for(let xx=x-5;xx<x+6;xx+=2)box(context,xx,6,z+Math.sign(z-72)*.09,.1,10,.08,'white');
    }
  }

  const pontoons=group(root,'pontoons');
  for(const z of [-39,27]){
    box(pontoons,-100,-2,z,8,1.6,36,'navy');box(pontoons,-100,-1.13,z,8.3,.17,36.3,'surface');
    for(let dz=-16;dz<18;dz+=3.5)box(pontoons,-100,-1.02,z+dz,8,.045,.09,'light');
    for(const x of [-103,-97])for(const dz of [-15,15])bollard(pontoons,x,z+dz,-1.02);
    const bridge=box(pontoons,-85,-.35,z-10,23,.32,2.4,'light');bridge.rotation.z=.059;
    for(const dz of [-1.2,1.2])rail(pontoons,[-74,.3,z-10+dz],[-96,-1,z-10+dz],1.0,'white');
    for(const dz of [-12,12]){cyl(pontoons,-105,-.5,z+dz,.55,7,'navy');cyl(pontoons,-105,3.1,z+dz,.59,.3,'white');}
    ship(pontoons,-114,z,34,10,0,true);
  }
  box(pontoons,-86,-2,94,6,1.6,24,'navy');box(pontoons,-86,-1.13,94,6.2,.17,24.2,'surface');
  beam(pontoons,[-74,.1,86],[-84,-1.0,86],2.2,'light',.3);
  rail(pontoons,[-74,.1,85],[-84,-1.0,85],1,'white');rail(pontoons,[-74,.1,87],[-84,-1.0,87],1,'white');

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
      if(g.name==='context' && material!==materials.water && material!==materials.foam){mat.color.set(material===materials.surface?'#edf1f6':'#ffffff');}
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
