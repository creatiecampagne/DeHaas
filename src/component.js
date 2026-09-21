import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { LOCATIONS, PALETTE as C } from './locations.js';
import { MODEL_BUILDERS } from './model.js';
import { icon } from './icons.js';
import styles from './styles.css';

// The build embeds client brand assets, fonts and Three.js. No runtime CDN.
const logo=DH_LOGO_DATA, regular=DH_FONT_REGULAR_DATA, bold=DH_FONT_BOLD_DATA;
let fontPromise;
function loadFonts(){
  if(!fontPromise)fontPromise=Promise.all([
    new FontFace('DH Gilroy',`url(${regular})`,{weight:'400',display:'swap'}).load(),
    new FontFace('DH Gilroy',`url(${bold})`,{weight:'800',display:'swap'}).load()
  ]).then(fonts=>fonts.forEach(f=>document.fonts.add(f))).catch(()=>{});
  return fontPromise;
}
export class DeHaasShipyard extends HTMLElement {
  connectedCallback(){
    if(this.initialized)return;
    this.initialized=true;this.disposed=false;this.attachShadowIfNeeded();
    this.abort=new AbortController();this.locationId=this.getAttribute('location')||'rotterdam';
    if(!LOCATIONS[this.locationId]?.available)this.locationId='rotterdam';
    this.data=LOCATIONS[this.locationId];this.selected=null;this.preview=null;this.panelOpen=true;this.isOverview=true;
    this.reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.renderUI();loadFonts();this.bindUI();
    try { this.setupScene(); } catch(error) { console.error('De Haas kaart:',error);this.showFallback(); }
  }
  attachShadowIfNeeded(){if(!this.shadowRoot)this.attachShadow({mode:'open'});}
  $(selector){return this.shadowRoot.querySelector(selector);}
  $$(selector){return [...this.shadowRoot.querySelectorAll(selector)];}
  on(el,event,fn,options={}){el.addEventListener(event,fn,{...options,signal:this.abort.signal});}
  renderUI(){
    this.shadowRoot.innerHTML=`<style>${styles}</style>
      <section class="component" aria-label="Interactieve 3D-kaart van De Haas Shipyards ${this.data.name}">
        <header class="topbar">
          <div class="brand"><span class="brand-logo"><img src="${logo}" alt="de Haas Shipyards" width="123" height="56"></span><span class="brand-line"></span><p class="brand-caption">Built. Repair. Refit.<span>Onze faciliteiten in 3D</span></p></div>
          <div class="locations" role="group" aria-label="Locatie">
            ${Object.entries(LOCATIONS).map(([id,loc])=>`<button class="location" data-location="${id}" aria-pressed="${id===this.locationId}" ${!loc.available?'disabled title="Maassluis wordt in een volgende fase toegevoegd"':''}>${loc.available?'<span class="dot"></span>':''}${loc.name}${!loc.available?'<span class="soon">Later</span>':''}</button>`).join('')}
          </div>
        </header>
        <div class="workspace">
          <div class="map">
            <div class="map-heading"><div class="eyebrow">${this.data.name} · ${this.data.district}</div><h1>Een werf.<br>Alle mogelijkheden.</h1><p>Verken onze faciliteiten vanuit elke hoek.</p></div>
            <div class="viewport"></div><div class="map-label water-label">Heysehaven</div>
            <div class="markers" role="group" aria-label="Hotspots op de werf"><svg class="marker-leaders" aria-hidden="true">${this.data.features.map(f=>`<line data-id="${f.id}"/>`).join('')}</svg>
              ${this.data.features.map(f=>`<button class="hotspot" data-id="${f.id}" aria-label="${f.number} ${f.name}" aria-pressed="false" aria-controls="detail-${f.id}"><span class="pin">${f.number}</span><span class="pin-label">${f.name}</span></button>`).join('')}
            </div>
            <div class="compass" aria-label="Kompas"><span>N</span><div class="compass-ring">${icon('north')}</div></div>
            <button class="reopen" aria-label="Faciliteitenlijst openen" aria-expanded="false">${icon('panel')} Faciliteiten <span>${String(this.data.features.length).padStart(2,'0')}</span></button>
            <div class="help-strip" aria-hidden="true"><span>${icon('orbit')} Sleep om te draaien</span><span>${icon('mouse')} Scroll om te zoomen</span></div>
            <div class="location-note">${icon('pin')} <span>${this.data.district.split(' · ')[0]}, ${this.data.name}</span><span class="sep"></span><span class="mode">Interactieve plattegrond</span></div>
            <div class="controls" role="group" aria-label="Kaartbediening">
              <div class="control-group"><button class="control reset" data-action="reset" aria-label="Reset view: terug naar overzicht" title="Terug naar overzicht">${icon('reset')}<span>Overzicht</span></button></div>
              <div class="control-group"><button class="control" data-action="zoom-out" aria-label="Uitzoomen" title="Uitzoomen">${icon('minus')}</button><button class="control" data-action="zoom-in" aria-label="Inzoomen" title="Inzoomen">${icon('plus')}</button></div>
              <div class="control-group"><button class="control" data-action="fullscreen" aria-label="Kaart vergroten" aria-pressed="false" title="Kaart vergroten">${icon('expand')}</button><button class="control" data-action="help" aria-label="Uitleg kaartbediening" aria-expanded="false" title="Kaartbediening">${icon('help')}</button></div>
            </div>
            <div class="map-help" hidden><strong>Bekijk de werf van alle kanten</strong><p>Sleep om te draaien. Scroll of gebruik + en − om te zoomen. Op een touchscreen: draai met één vinger en zoom met twee vingers.</p><p>Met het toetsenbord: focus de kaart, gebruik de pijltjes om te draaien, +/− om te zoomen en Home voor het overzicht.</p><p>Kies een nummer of faciliteit voor meer informatie.</p></div>
            <div class="loading" role="status">${icon('lift')}<span>De werf wordt opgebouwd…</span></div>
            <div class="fallback" hidden>${icon('hall')}<strong>Ontdek onze faciliteiten</strong><p>De 3D-weergave is niet beschikbaar in deze browser. Je kunt alle faciliteiten bekijken via de lijst.</p></div>
          </div>
          <aside class="sidebar" aria-label="Faciliteiten ${this.data.name}">
            <div class="panel-head"><div class="panel-title-row"><div><div class="eyebrow">De Haas Shipyards</div><h2>Ontdek ${this.data.name}</h2></div><button class="collapse-button" aria-label="Faciliteitenlijst inklappen" aria-expanded="true" title="Lijst inklappen">${icon('panel')}</button></div><p>${this.data.features.length===8?'Acht':this.data.features.length} faciliteiten. Eén complete werf.<br>Kies een onderdeel en kijk dichterbij.</p></div>
            <div class="facility-list">
              ${this.data.features.map(f=>`<section class="facility" data-id="${f.id}"><h3><button class="facility-button" data-id="${f.id}" id="button-${f.id}" aria-expanded="false" aria-controls="detail-${f.id}"><span class="facility-icon">${icon(f.icon)}</span><span class="facility-name">${f.name}</span><span class="facility-number">${f.number}</span><span class="facility-chevron">${icon('chevron')}</span></button></h3><div class="facility-detail" id="detail-${f.id}" role="region" aria-labelledby="button-${f.id}" hidden><p>${f.description}</p><dl class="facts">${f.facts.map(([label,value])=>`<div class="fact"><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl></div></section>`).join('')}
            </div>
            <div class="panel-footer">${(this.data.stats||[]).map(s=>`<div class="stat"><strong>${s.value} <small>${s.unit}</small></strong><span>${s.label}</span></div>`).join('')}</div>
          </aside>
        </div><div class="sr-only announcement" aria-live="polite" aria-atomic="true"></div>
      </section>`;
  }
  bindUI(){
    for(const button of this.$$('[data-location]'))this.on(button,'click',()=>this.setLocation(button.dataset.location));
    for(const marker of this.$$('.hotspot')){
      this.on(marker,'pointerenter',e=>{if(e.pointerType==='mouse')this.setPreview(marker.dataset.id);});
      this.on(marker,'pointerleave',()=>this.setPreview(null));
      this.on(marker,'focus',()=>this.setPreview(marker.dataset.id));
      this.on(marker,'blur',()=>this.setPreview(null));
      this.on(marker,'click',()=>this.select(marker.dataset.id,true));
    }
    for(const row of this.$$('.facility-button')){
      this.on(row,'click',()=>this.select(this.selected===row.dataset.id?null:row.dataset.id,true));
      this.on(row,'pointerenter',()=>this.highlight(row.dataset.id));
      this.on(row,'pointerleave',()=>this.highlight(this.preview||this.selected));
    }
    this.on(this.$('.collapse-button'),'click',()=>this.setPanel(false));
    this.on(this.$('.reopen'),'click',()=>this.setPanel(true));
    for(const button of this.$$('[data-action]'))this.on(button,'click',()=>{
      const action=button.dataset.action;
      if(action==='reset')this.resetView();
      if(action==='zoom-in')this.zoom(.82);
      if(action==='zoom-out')this.zoom(1.22);
      if(action==='fullscreen')this.toggleFullscreen();
      if(action==='help'){const open=this.$('.map-help').hidden;this.$('.map-help').hidden=!open;button.setAttribute('aria-expanded',String(open));}
    });
    this.on(document,'keydown',e=>{
      if(e.key==='Escape'){
        this.$('.map-help').hidden=true;this.$('[data-action="help"]').setAttribute('aria-expanded','false');
        if(this.$('.component').classList.contains('is-expanded'))this.toggleFullscreen();
      }
    });
  }
  setPanel(open){
    this.panelOpen=open;this.$('.workspace').classList.toggle('collapsed',!open);
    this.$('.sidebar').inert=!open;
    this.$('.reopen').setAttribute('aria-expanded',String(open));
    this.$('.collapse-button').setAttribute('aria-expanded',String(open));
    if(!open)this.$('.reopen').focus({preventScroll:true});
    this.resize();
  }
  setPreview(id){
    if(this.preview===id)return;this.preview=id;
    this.updateSelection();
    // Keep a collapsed layout stable beneath the pointer; clicking opens it.
    if(id&&this.panelOpen)this.ensureRowVisible(id);
  }
  select(id,focus=false){
    this.isOverview=!id;
    this.selected=id;this.preview=null;this.updateSelection();
    const f=this.data.features.find(f=>f.id===id);
    if(f){
      if(!this.panelOpen)this.setPanel(true);
      this.ensureRowVisible(id);
      this.$('.announcement').textContent=`${f.name}. ${f.description}`;
      if(focus&&this.camera)this.focusFeature(f);
    } else if(focus)this.resetCamera();
    this.dispatchEvent(new CustomEvent('facilitychange',{detail:{location:this.locationId,facility:id},bubbles:true,composed:true}));
  }
  updateSelection(){
    const active=this.preview||this.selected;
    const selectedFeature=this.data.features.find(f=>f.id===this.selected);
    this.$('.map-heading').classList.toggle('focused',!!selectedFeature);
    this.$('.map-heading h1').innerHTML=selectedFeature?selectedFeature.name:'Een werf.<br>Alle mogelijkheden.';
    this.$('.map-heading p').textContent=selectedFeature?`${selectedFeature.facts[0][0]} · ${selectedFeature.facts[0][1]}`:'Verken onze faciliteiten vanuit elke hoek.';
    this.$('.water-label').hidden=!!selectedFeature;
    for(const f of this.data.features){
      const selected=f.id===active,row=this.$(`.facility[data-id="${f.id}"]`);
      row.classList.toggle('selected',selected);row.querySelector('.facility-button').setAttribute('aria-expanded',String(selected));
      row.querySelector('.facility-detail').hidden=!selected;
      const marker=this.$(`.hotspot[data-id="${f.id}"]`);marker.classList.toggle('active',selected);marker.setAttribute('aria-pressed',String(selected));
    }
    this.highlight(active);
  }
  ensureRowVisible(id){
    const list=this.$('.facility-list'),row=this.$(`.facility[data-id="${id}"]`);
    const r=row.getBoundingClientRect(),b=list.getBoundingClientRect();
    if(r.bottom>b.bottom)list.scrollTop+=r.bottom-b.bottom+8;
    else if(r.top<b.top)list.scrollTop+=r.top-b.top-8;
  }
  highlight(id){
    if(!this.model)return;
    for(const [key,g] of this.model.features)g.traverse(m=>{
      if(!m.isMesh)return;
      m.material.color.copy(m.material.userData.baseColor);
      if(key===id)m.material.color.lerp(new THREE.Color(C.light),.22);
    });
    this.highlighted=id;this.invalidate();
  }
  setupScene(){
    const viewport=this.$('.viewport');
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.8));
    this.renderer.setClearColor(C.surface);this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.shadowMap.autoUpdate=false;
    this.renderer.setSize(viewport.clientWidth,viewport.clientHeight);viewport.append(this.renderer.domElement);
    const canvas=this.renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label','Draaibare 3D-kaart. Gebruik pijltjestoetsen, plus, min en Home.');canvas.setAttribute('role','img');
    this.scene=new THREE.Scene();
    this.scene.add(new THREE.AmbientLight(C.white,2.0));
    const sun=new THREE.DirectionalLight(C.white,1.0);sun.position.set(-100,190,-70);sun.castShadow=true;
    Object.assign(sun.shadow.camera,{left:-220,right:220,top:220,bottom:-220,near:1,far:450});
    sun.shadow.mapSize.set(2048,2048);sun.shadow.normalBias=.18;sun.shadow.bias=-.00015;sun.shadow.radius=2;this.scene.add(sun);
    this.camera=new THREE.PerspectiveCamera(36,1,.5,1800);
    this.controls=new OrbitControls(this.camera,canvas);this.controls.enableDamping=true;this.controls.dampingFactor=.10;this.controls.enablePan=false;
    this.controls.minPolarAngle=.18;this.controls.maxPolarAngle=Math.PI/2-.18;this.controls.minDistance=78;this.controls.maxDistance=850;
    this.controls.rotateSpeed=.65;this.controls.zoomSpeed=.8;this.controls.target.set(-8,1,-2);
    this.controls.addEventListener('change',()=>this.invalidate());
    this.controls.addEventListener('start',()=>{this.transition=null;this.isOverview=false;this.setPreview(null);this.$('.help-strip').style.opacity='.45';});
    this.model=MODEL_BUILDERS[this.locationId]();this.scene.add(this.model.root);
    this.anchors=this.data.features.map(f=>({data:f,point:new THREE.Vector3(...f.anchor),el:this.$(`.hotspot[data-id="${f.id}"]`)}));
    this.projected=new THREE.Vector3();this.northDirection=new THREE.Vector3();this.markerBounds={width:0,height:0};
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(viewport);
    this.on(canvas,'keydown',e=>{
      if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home'].includes(e.key))e.preventDefault();
      if(e.key==='Home')this.resetView();else if(e.key==='+'||e.key==='=')this.zoom(.82);else if(e.key==='-')this.zoom(1.22);
      else if(e.key.startsWith('Arrow')){
        this.transition=null;this.isOverview=false;const s=new THREE.Spherical().setFromVector3(this.camera.position.clone().sub(this.controls.target));
        if(e.key==='ArrowLeft')s.theta-=.14;if(e.key==='ArrowRight')s.theta+=.14;
        if(e.key==='ArrowUp')s.phi-=.12;if(e.key==='ArrowDown')s.phi+=.12;
        s.phi=THREE.MathUtils.clamp(s.phi,this.controls.minPolarAngle,this.controls.maxPolarAngle);
        this.camera.position.copy(this.controls.target).add(new THREE.Vector3().setFromSpherical(s));this.controls.update();this.invalidate();
      }
    });
    this.on(canvas,'webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(this.raf);this.raf=0;this.showFallback();});
    this.on(canvas,'webglcontextrestored',()=>{
      this.$('.component').classList.remove('error');this.$('.fallback').hidden=true;this.renderer.shadowMap.needsUpdate=true;this.invalidate();
    });
    this.on(document,'visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(this.raf);this.raf=0;}else this.invalidate();});
    this.resize(true);this.renderer.shadowMap.needsUpdate=true;this.invalidate();
    this.$('.loading').hidden=true;
  }
  defaultView(){
    const aspect=this.$('.viewport').clientWidth/Math.max(1,this.$('.viewport').clientHeight);
    const overview=this.data.overview;
    const distance=Math.max(overview.distance,overview.fitWidth/Math.max(.4,aspect));
    const target=new THREE.Vector3(...overview.target);
    const offset=new THREE.Vector3(...overview.direction).normalize().multiplyScalar(distance);
    return {target,position:target.clone().add(offset)};
  }
  resize(initial=false){
    if(!this.renderer||this.disposed)return;
    const viewport=this.$('.viewport'),w=viewport.clientWidth,h=viewport.clientHeight;if(!w||!h)return;
    this.renderer.setSize(w,h);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.markerBounds={width:w,height:h};
    this.controls.maxDistance=Math.max(850,this.data.overview.fitWidth/Math.max(.4,w/h)*1.55);
    if(initial||!this.hasSize||this.isOverview){this.transition=null;const v=this.defaultView();this.camera.position.copy(v.position);this.controls.target.copy(v.target);this.controls.update();this.hasSize=true;}
    this.invalidate();
  }
  focusFeature(f){
    const target=new THREE.Vector3(...f.target),direction=this.camera.position.clone().sub(this.controls.target).normalize();
    const aspect=this.camera.aspect,distance=f.distance*Math.max(1,1.05/aspect);
    this.animateCamera(target.clone().add(direction.multiplyScalar(distance)),target);
  }
  animateCamera(position,target){
    if(!this.camera)return;
    if(this.reducedMotion){this.camera.position.copy(position);this.controls.target.copy(target);this.controls.update();this.invalidate();return;}
    this.transition={start:performance.now(),duration:850,fromPosition:this.camera.position.clone(),fromTarget:this.controls.target.clone(),position,target};this.invalidate();
  }
  resetCamera(){if(!this.camera)return;const v=this.defaultView();this.animateCamera(v.position,v.target);}
  resetView(){this.selected=null;this.preview=null;this.isOverview=true;this.updateSelection();this.resetCamera();this.$('.announcement').textContent='Overzicht van de volledige werf.';this.$('.help-strip').style.opacity='1';}
  zoom(factor){
    if(!this.camera)return;this.transition=null;this.isOverview=false;
    const offset=this.camera.position.clone().sub(this.controls.target),distance=THREE.MathUtils.clamp(offset.length()*factor,this.controls.minDistance,this.controls.maxDistance);
    offset.setLength(distance);this.camera.position.copy(this.controls.target).add(offset);this.controls.update();this.invalidate();
  }
  toggleFullscreen(){
    const component=this.$('.component'),button=this.$('[data-action="fullscreen"]');
    const expanded=component.classList.toggle('is-expanded');
    this.toggleAttribute('expanded',expanded);
    button.setAttribute('aria-pressed',String(expanded));button.setAttribute('aria-label',expanded?'Vergrote kaart sluiten':'Kaart vergroten');this.resize();
  }
  invalidate(){if(this.raf||this.disposed||document.hidden||!this.renderer)return;this.raf=requestAnimationFrame(time=>this.draw(time));}
  draw(time){
    this.raf=0;if(this.disposed)return;
    if(this.transition){
      const tr=this.transition,t=Math.min(1,(time-tr.start)/tr.duration),ease=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
      this.camera.position.lerpVectors(tr.fromPosition,tr.position,ease);this.controls.target.lerpVectors(tr.fromTarget,tr.target,ease);
      if(t===1)this.transition=null;else this.invalidate();
    }
    this.controls.update();this.renderer.render(this.scene,this.camera);this.positionMarkers();
    this.northDirection.set(0,0,-1).transformDirection(this.camera.matrixWorldInverse);
    this.$('.compass-ring svg').style.transform=`rotate(${Math.atan2(this.northDirection.x,this.northDirection.y)*180/Math.PI}deg)`;
    const distance=this.camera.position.distanceTo(this.controls.target);
    this.$('[data-action="zoom-in"]').disabled=distance<=this.controls.minDistance+.1;
    this.$('[data-action="zoom-out"]').disabled=distance>=this.controls.maxDistance-.1;
  }
  positionMarkers(){
    const {width,height}=this.markerBounds;
    const mapRect=this.$('.viewport').getBoundingClientRect(),headingRect=this.$('.map-heading').getBoundingClientRect();
    const heading={left:headingRect.left-mapRect.left-4,right:headingRect.right-mapRect.left+4,top:headingRect.top-mapRect.top-4,bottom:headingRect.bottom-mapRect.top+4};
    const placed=[];
    // Stable ordering prevents a hovered marker from moving under the pointer.
    for(const {point,el,data} of this.anchors){
      this.projected.copy(point).project(this.camera);
      const x=(this.projected.x*.5+.5)*width,y=(-this.projected.y*.5+.5)*height;
      const visible=this.projected.z<1&&this.projected.z>-1&&x>10&&x<width-10&&y>12&&y<height-55;
      el.hidden=!visible;
      const leader=this.$(`.marker-leaders line[data-id="${data.id}"]`);leader.style.display='none';
      if(visible){
        let offsetX=0,offsetY=0;
        const candidates=[[0,0],[0,54],[-46,0],[46,0],[0,-54],[-46,54],[46,54],[-46,-54],[46,-54],[0,108],[-92,0],[92,0],[0,-108],[-46,108],[46,108],[0,162]];
        for(const [dx,dy] of candidates){
          const px=x+dx,py=y+dy;
          if(py<55||py>height-75||px<24||px>width-24)continue;
          if(px+22>heading.left&&px-22<heading.right&&py>heading.top&&py-44<heading.bottom)continue;
          if(!placed.some(p=>Math.abs(p.x-px)<46&&Math.abs(p.y-py)<52)){offsetX=dx;offsetY=dy;break;}
        }
        const px=x+offsetX,py=y+offsetY;placed.push({x:px,y:py});
        el.style.transform=`translate(${px-22}px,${py-42}px)`;el.style.zIndex=data.id===(this.preview||this.selected)?'20':String(Math.round((1-this.projected.z)*500));
        if(offsetY||offsetX){leader.style.display='';leader.setAttribute('x1',px);leader.setAttribute('x2',x);leader.setAttribute('y1',py);leader.setAttribute('y2',y);}
        const label=el.querySelector('.pin-label');label.style.left=px<90?'8px':px>width-90?'auto':'';label.style.right=px>width-90?'8px':'';
      }
    }
  }
  showFallback(){this.$('.component').classList.add('error');this.$('.fallback').hidden=false;this.$('.loading').hidden=true;}
  setLocation(id){
    if(id===this.locationId||!LOCATIONS[id]?.available||!MODEL_BUILDERS[id])return;
    this.disconnectedCallback();this.setAttribute('location',id);this.connectedCallback();
  }
  disconnectedCallback(){
    this.disposed=true;this.initialized=false;cancelAnimationFrame(this.raf);this.raf=0;this.abort?.abort();this.resizeObserver?.disconnect();this.controls?.dispose();
    this.scene?.traverse(o=>{if(o.isMesh)o.geometry.dispose();});
    this.model?.materials.forEach(m=>m.dispose());
    this.scene?.traverse(o=>{if(o.isLight&&o.shadow)o.shadow.dispose();});this.renderer?.dispose();
    this.renderer=null;this.hasSize=false;
    this.removeAttribute('expanded');
  }
}
if(!customElements.get('de-haas-shipyard'))customElements.define('de-haas-shipyard',DeHaasShipyard);
