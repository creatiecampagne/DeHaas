import { center, toWorld, SOURCE, LIFT_START } from './plan.js';
// Plan coordinates follow the supplied SVG at one uniform scale.
// Heights are photographic estimates; see README.md.
export const PALETTE = {
  navy: '#1c3b71', blue: '#3c66a2', light: '#83a4cd', coral: '#e55c5e',
  surface: '#edf1f6', white: '#ffffff'
};
export const LOCATIONS = {
  rotterdam: {
    name: 'Rotterdam', district: 'RDM · Heijplaat', address: 'Scheepsbouwplein 3, Rotterdam',
    available: true,
    overview: {target:[4,0,-2],direction:[-.72,.73,.42],distance:425,fitWidth:480},
    stats: [{value:'820',unit:'ton',label:'Hefvermogen travelift'},{value:'70',unit:'meter',label:'Scheepslengte tot circa'}],
    features: [
      { id:'basin', number:'01', name:'Insteekhaven', icon:'basin', anchor:toWorld(1720,1287,4), target:toWorld(1720,1287,1), distance:120,
        description:'Vanaf de Nieuwe Maas varen schepen de insteekhaven binnen. Hier neemt de travelift het schip over voor werkzaamheden op de werf.', facts:[['Direct aan','de Nieuwe Maas']] },
      { id:'lift', number:'02', name:'820 tons travelift', icon:'lift', anchor:[LIFT_START[0],22,LIFT_START[2]], target:[LIFT_START[0],9,LIFT_START[2]], distance:125,
        description:'De Marine Travelift 820C zet schepen snel en gecontroleerd op het droge. Ook vaartuigen met een complex onderwaterschip kunnen worden gehesen.', facts:[['Hefvermogen','820 ton'],['Scheepslengte','ca. 70 m'],['Scheepsbreedte','ca. 14,5 m']] },
      { id:'wash', number:'03', name:'Afspuitplaats', icon:'wash', anchor:center(SOURCE.wash,4), target:center(SOURCE.wash,1), distance:135,
        description:'Een speciaal ingericht werkvlak voor het reinigen van scheepsrompen met hogedrukwater. Afwatering voert het gebruikte water af.', facts:[['Voorbereiding','Reiniging & onderhoud']] },
      { id:'crane', number:'04', name:'Kadekraan', icon:'crane', anchor:center(SOURCE.crane,33), target:center(SOURCE.crane,14), distance:145,
        description:'De kraan aan de kade ondersteunt hijswerkzaamheden tussen het water en de werf, van scheepsonderdelen tot materieel.', facts:[['Locatie','Aan de kade']] },
      { id:'yard', number:'05', name:'Scheepswerf', icon:'yard', anchor:toWorld(1180,815,5), target:toWorld(1060,750,5), distance:220,
        description:'Op de verharde werfvloer werken onze vakmensen aan onderhoud, reparatie en renovatie. Schepen staan hier op stutten en kielblokken.', facts:[['Vloeistofdichte vloer','ruim 1 hectare']] },
      { id:'office', number:'06', name:'Kantoor', icon:'office', anchor:toWorld(880,911,9), target:toWorld(870,900,3), distance:110,
        description:'De kantoorunits staan midden op de werf. Een direct aanspreekpunt, dicht bij de schepen en de werkzaamheden.', facts:[['Adres','Scheepsbouwplein 3']] },
      { id:'hall', number:'07', name:'Scheepsreparatiehallen', icon:'hall', anchor:center(SOURCE.hall,32), target:center(SOURCE.hall,10), distance:240,
        description:'De historische scheepsbouwloods biedt beschutte werkruimte voor grote projecten. Hoge ramen, staalconstructies en de monumentale schuifpoort geven de hal haar karakter.', facts:[['Lengte × breedte','ca. 120 × 28 m'],['Vrije hoogte','ruim 21 m']] },
      { id:'pontoons', number:'08', name:'Afmeerpontons', icon:'pontoons', anchor:toWorld(1310,410,4), target:toWorld(1300,415,2), distance:155,
        description:'De drijvende pontons bieden aanlegplaatsen langs de werf. Loopbruggen verbinden de schepen en pontons met de kade.', facts:[['Ligging','Langs de werfkade']] },
      { id:'warehouse', number:'09', name:'Het Magazijn', icon:'hall', anchor:center(SOURCE.warehouseDeHaas,16), target:center(SOURCE.warehouseDeHaas,5), distance:150,
        description:'Het Magazijn ligt naast de afspuitplaats en insteekhaven. Twee van de vier hallen zijn in gebruik door De Haas; de overige hallen zijn wit weergegeven.', facts:[['In gebruik','2 van de 4 hallen']] }
    ]
  },
  // Add a model builder and feature data here to enable the second location.
  maassluis: { name:'Maassluis', available:false, features:[] }
};
