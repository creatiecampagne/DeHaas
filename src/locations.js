// One world unit is one metre. Object dimensions are visual estimates except
// for the published hall envelope. See README.md for measurement provenance.
export const PALETTE = {
  navy: '#1c3b71', blue: '#3c66a2', light: '#83a4cd', coral: '#e55c5e',
  surface: '#edf1f6', white: '#ffffff'
};
export const LOCATIONS = {
  rotterdam: {
    name: 'Rotterdam', district: 'RDM · Heijplaat', address: 'Scheepsbouwplein 3, Rotterdam',
    available: true,
    overview: {target:[8,0,-3],direction:[-.64,.59,.63],distance:485,fitWidth:610},
    stats: [{value:'820',unit:'ton',label:'Hefvermogen travelift'},{value:'70',unit:'meter',label:'Scheepslengte tot circa'}],
    features: [
      { id:'basin', number:'01', name:'Insteekhaven', icon:'basin', anchor:[53,3,-136], target:[53,0,-111], distance:160,
        description:'Vanaf de Nieuwe Maas varen schepen de insteekhaven binnen. Hier neemt de travelift het schip over voor werkzaamheden op de werf.', facts:[['Direct aan','de Nieuwe Maas']] },
      { id:'lift', number:'02', name:'820 tons travelift', icon:'lift', anchor:[18,30,-30], target:[18,11,-30], distance:145,
        description:'De Marine Travelift 820C zet schepen snel en gecontroleerd op het droge. Ook vaartuigen met een complex onderwaterschip kunnen worden gehesen.', facts:[['Hefvermogen','820 ton'],['Scheepslengte','ca. 70 m'],['Scheepsbreedte','ca. 14,5 m']] },
      { id:'wash', number:'03', name:'Afspuitplaats', icon:'wash', anchor:[75,4,-113], target:[77,3,-113], distance:165,
        description:'Een speciaal ingericht werkvlak voor het reinigen van scheepsrompen met hogedrukwater. Afwatering voert het gebruikte water af.', facts:[['Voorbereiding','Reiniging & onderhoud']] },
      { id:'crane', number:'04', name:'Kadekraan', icon:'crane', anchor:[-64,42,-24], target:[-57,18,-24], distance:165,
        description:'De kraan aan de kade ondersteunt hijswerkzaamheden tussen het water en de werf, van scheepsonderdelen tot materieel.', facts:[['Locatie','Aan de kade']] },
      { id:'yard', number:'05', name:'Scheepswerf', icon:'yard', anchor:[-36,26,-32], target:[-30,8,-16], distance:210,
        description:'Op de verharde werfvloer werken onze vakmensen aan onderhoud, reparatie en renovatie. Schepen staan hier op stutten en kielblokken.', facts:[['Vloeistofdichte vloer','ruim 1 hectare']] },
      { id:'office', number:'06', name:'Kantoor', icon:'office', anchor:[-5,11,24], target:[-5,4,26], distance:135,
        description:'De kantoorunits staan midden op de werf. Een direct aanspreekpunt, dicht bij de schepen en de werkzaamheden.', facts:[['Adres','Scheepsbouwplein 3']] },
      { id:'hall', number:'07', name:'Scheepsreparatiehallen', icon:'hall', anchor:[63,32,70], target:[63,11,70], distance:230,
        description:'De historische scheepsbouwloods biedt beschutte werkruimte voor grote projecten. Hoge ramen, staalconstructies en de monumentale schuifpoort geven de hal haar karakter.', facts:[['Lengte × breedte','ca. 120 × 28 m'],['Vrije hoogte','ruim 21 m']] },
      { id:'pontoons', number:'08', name:'Afmeerpontons', icon:'pontoons', anchor:[-99,5,24], target:[-102,3,21], distance:165,
        description:'De drijvende pontons bieden aanlegplaatsen langs de werf. Loopbruggen verbinden de schepen en pontons met de kade.', facts:[['Ligging','Langs de werfkade']] },
      { id:'warehouse', number:'09', name:'Het Magazijn', icon:'hall', anchor:[105,17,-113], target:[105,6,-113], distance:180,
        description:'Het Magazijn ligt naast de insteekhaven. De lange gevel met hoge ramen en daklichten maakt het gebouw herkenbaar vanaf het terrein.', facts:[['Ligging','Naast de insteekhaven']] }
    ]
  },
  // Add a model builder and feature data here to enable the second location.
  maassluis: { name:'Maassluis', available:false, features:[] }
};
