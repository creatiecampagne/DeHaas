# De Haas Shipyards — interactieve werfkaart 2.2.2 — draaien op de plaats

Een zelfstandige Three.js-component voor de Rotterdamse werf. Alle 3D-geometrie wordt in code opgebouwd. Het script, logo en de Gilroy-lettertypen zijn in `index.html` ingesloten; er zijn geen externe 3D-bestanden, textures of CDN-verzoeken nodig.

## Nieuwe basis: de aangeleverde SVG

`Plattegrond_De_Haas_Rotterdam.svg` is leidend voor de grondvorm en de onderlinge verhoudingen. De zichtbare vectoren zijn rechtstreeks uitgelezen naar `src/plan-data.json`. De referentie staat ook in `reference/plattegrond.svg`, zonder de twee verborgen, extern gekoppelde foto-onderlagen.

De nieuwe indeling vervangt de eerdere visuele reconstructie. Overgenomen zijn:

- De kadecontour, gebogen buitenkade, insteekhaven en het bijbehorende plateau.
- Vloerbelijning en alle getekende parkeerrijen, inclusief de auto’s uit de SVG.
- De gebouwposities en voetafdrukken van de reparatiehal, het kantoor en Het Magazijn. Het kantoor volgt nu de twee aansluitende rechthoeken uit de SVG.
- De afspuitplaats naast de insteekhaven, de kraanpositie, pontonarmen, vaste schepen en aanlegposities.
- Containers, trailers, materiaalblokken en drie kleine werkloodsen met gebogen dak.
- De wit aangegeven omliggende kade als eenvoudige witte massa. Twee van de vier magazijnhallen zijn blauw; de overige twee zijn wit.

De overzichtsfoto `DJI_0457(1).jpeg` en de eerdere referentiefoto’s geven de vormtaal en de details van gebouwen en vaartuigen. De positie van tijdelijke objecten uit de foto overschrijft de SVG niet. De oorspronkelijke huisstijlkleuren blijven in gebruik; de oranje/blauwe annotatiekleuren uit de SVG zijn vertaald naar die huisstijl. Koraal wordt uitsluitend voor de interface en hotspots gebruikt.

### Verhoudingen en absolute schaal

Eén uniforme schaal gebruikt de eerdere opgave van **120 m hallengte**: 883,976 SVG-eenheden worden 120 modelmeters. De halbreedte wordt daarmee circa 27,69 m. Alle posities en planafmetingen gebruiken dezelfde factor; gebouwen en terrein zijn niet afzonderlijk opgerekt om de oude kaart te behouden. Kleine geveldetails, fenders en de externe halpoortconstructie steken buiten de gebouw- of scheepsvoetafdruk uit.

De SVG bevat geen maatlijnen. De absolute schaal is daarom nog geen onafhankelijke landmeting: bijvoorbeeld de getekende parkeersteek van circa 11,565 SVG-eenheden komt met deze kalibratie uit op circa 1,57 m. De SVG-verhoudingen zijn behouden. Voor meetvaste fysieke afmetingen is een bevestigde maat in het nieuwe plan nodig. Hoogtes blijven schattingen op basis van foto’s (hoofdhal circa 26 m gevelhoogte, travelift circa 21 m, magazijn circa 11 m, kantoor twee lagen).

## Traveliftcyclus — draaien op de plaats

De draai om de eigen as uit de eerdere uitvoering is terug. De lift rijdt door de rijstrook, stopt op het open werkterrein, zet de vier wielstellen in de draaistand en draait langzaam een kwartslag op dezelfde positie. Daarna zet hij de wielen recht en rijdt rechtstreeks naar de bokken. De steekmanoeuvre is verwijderd.

De grondvorm, kade, gebouwen, parkeervakken en scheepsmaten blijven gebaseerd op versie 2.2. Het kleine vaste schip naast de losplaats behoudt de vorige verschuiving van circa 4,07 modelmeter. Voor de vrije draaicirkel staat het grotere schip aan de overkant (SVG-element 326) circa 2,04 modelmeter verder van de draaiplek. De losplaats ligt bij (1062, 900), de draaiplek bij (1222, 900). Deze lokale objectposities veranderen de terreinvorm niet.

Na het lossen rijdt de lege lift eerst recht van het schip af en draait pas op de vrije draaiplek terug. De afstand tussen losplaats en draaiplek is circa 21,72 modelmeter. Ophalen en terugbrengen gebruiken dezelfde bewegingen in omgekeerde volgorde. Er staat geen witte scheepsomtrek op de grond.

De volledige cyclus duurt **272 seconden (4 min 32 s)**, inclusief hijsen, rijden en rustmomenten. Bij de draai blijven de positie van het portaal en zijn middelpunt constant; alleen de richting verandert. De boot en hijsbanden draaien mee zolang het schip hangt. De statusbalk vermeldt de draai om de eigen as.

De hotspot beweegt mee. Als de travelift geselecteerd is, volgt de camera zijn beweging; zelf slepen beëindigt het volgen. De beweging is illustratief.

De cyclus is een functie van verstreken tijd. Daardoor ontstaat bij herhaling, pauzeren of tabwissels geen opstapelende positieafwijking. Een verborgen tab of een kaart buiten het scherm pauzeert de voortgang. Bij `prefers-reduced-motion` start de kaart gepauzeerd; de bezoeker kan de animatie zelf starten.

## Bekijken en bedienen

Open **index.html** in een moderne browser, of bekijk de component via een lokale webserver.

- Sleep of gebruik één vinger om te draaien; scroll, knijp of gebruik +/− om te zoomen.
- Klik op een hotspot of faciliteit om het onderdeel te bekijken. Hover toont de bijbehorende informatie.
- **Overzicht** herstelt de startcamera.
- **Bovenaanzicht** kijkt recht op de plattegrond, pauzeert de animatie en verbergt de hotspots. Klik opnieuw of kies Overzicht om terug te gaan.
- De knop naast **Travelift in actie** pauzeert of hervat de cyclus op dezelfde plek.
- De lijst kan worden ingeklapt. De vergrotingsknop vult het huidige venster; Escape sluit deze weergave.
- Toetsenbord: Tab voor bediening, pijltjes om de gefocuste kaart te draaien, +/− voor zoom en Home voor het overzicht.

Alle negen faciliteiten zijn beschikbaar. Maassluis staat klaar als uitgeschakelde tweede locatie. Als WebGL ontbreekt, blijft de informatie via de faciliteitenlijst beschikbaar.

## Inbouwen

Upload `de-haas-kaart.js` naar de eigen website en plaats:

```html
<de-haas-shipyard location="rotterdam"></de-haas-shipyard>
<script defer src="/assets/werfkaart/de-haas-kaart.js"></script>
```

De component gebruikt Shadow DOM en heeft geen React, Vue of WordPress-plugin nodig. De bediening past zich aan de containerbreedte aan; op smalle schermen staat de lijst onder de kaart.

Een iframe kan ook:

```html
<iframe
  src="/werfkaart/index.html"
  title="De Haas Shipyards Rotterdam — interactieve 3D-kaart"
  style="width:100%;height:850px;border:0"
  loading="lazy">
</iframe>
```

Voor de gestapelde mobiele indeling is een hoger iframe wenselijk, circa 1.110 px. De vergrotingsknop vult binnen een iframe het iframevenster. De uiteindelijke pagina moet de ingesloten stijlen, fonts en het logo toestaan als er een strenge Content Security Policy actief is.

## Bronbestanden

| Bestand | Inhoud |
|---|---|
| `src/plan-data.json` | Uitgelezen SVG-coördinaten en curvepunten |
| `src/plan.js` | Schaal, coördinatenstelsel en koppeling van vectoren aan onderdelen |
| `src/model.js` | Procedurale 3D-geometrie en bewegende hijsonderdelen |
| `src/travelift-animation.js` | Omkeerbare tijdlijn met stationaire draai en bestuurbare wielstellen |
| `src/locations.js` | Faciliteiten, teksten, hotspotankers en camerastanden |
| `src/component.js` | Bediening, camera, toegankelijkheid, pauzeren en renderen |
| `src/styles.css`, `src/icons.js` | Vormgeving en lijniconen |
| `tools/import_plan.py` | Herleidbare extractie van de zichtbare SVG-vectoren |
| `tests/` | Geometrie- en animatiecontroles |

Met Node.js 20 of hoger:

```sh
npm ci
npm test
npm run build
```

`npm start` start een lokale preview via Python 3 op poort 4173. Voor alleen bekijken is geen installatie nodig.

Bij een gewijzigde SVG: vervang de referentie, voer `python3 tools/import_plan.py` uit en controleer de semantische elementkoppelingen in `src/plan.js`. Die koppelingen horen bij deze Illustrator-export; een andere elementvolgorde moet expliciet worden gemapt. Bouw daarna opnieuw.

## Controle en prestaties

- Negen niet-lege faciliteiten, eindige geometriecoördinaten, geen fototextures of koraalkleur in het model.
- 2.720 tijdstippen in de volledige cyclus gecontroleerd: de wielcontactpunten blijven op land, de gedraaide omhulling en afzonderlijke wielvoetafdrukken raken geen vaste scheeps-, auto- of gebouwvoetafdrukken of parkeervakken (ook de lege vakken zijn uitgesloten) en een gehesen boot blijft onder de lift.
- Alle faseovergangen, de interne overgangen tussen rijden, stilstaan en draaien en de overgang naar de volgende cyclus gecontroleerd op sprongen in positie, draaihoek en stuurstand. Ook is gecontroleerd dat de daadwerkelijke 3D-onderdelen de berekende draai- en stuurhoeken overnemen. Boot en lift staan tijdens de werkpauze op hun afzonderlijke bestemmingen.
- Aanvullende controle van de werkelijke modelonderdelen: 69 vaste liftdelen tegen 269 scheepsonderdelen, op 2.720 tijdstippen. De controle detecteert de oude draai door de neergezette boot en vindt geen doorsnijdingen in de nieuwe cyclus. De omhullingen zijn conservatief; flexibele hijsbanden zijn geen vaste framedelen.
- De grond- en referentiebestanden zijn gelijk aan de aangeleverde versie 2.2. De stationaire draai en losplaats zijn visueel bekeken in de browser.
- Pauzeren, bovenaanzicht, reset, bewegende liftselectie en magazijnhotspot gecontroleerd. Op 320 px zijn alle negen markers zichtbaar zonder overlappende klikvlakken; de nieuwe bedieningsknoppen blijven bruikbaar.
- Circa **126.700 driehoeken**, **97 meshgroepen** inclusief losse hijskabels, banden en vier bestuurbare wielstellen. Statische geometrie is per onderdeel en materiaal samengevoegd.
- Zelfstandige pagina circa **1,13 MiB**, inclusief Three.js, fonts, logo en het vectorplan. Geen externe modeldownloads.
- Alleen bij lopende animatie, camerabeweging of interactie wordt doorlopend gerenderd. De pixeldichtheid is begrensd. Bij pauze komt de weergave tot rust; verborgen of buiten beeld geplaatste kaarten lopen niet door.

De visuele controles zijn uitgevoerd in de ingebouwde Chromium-browser. Een fysieke tablet en de uiteindelijke WordPress-inbedding zijn niet getest.

## Maassluis later toevoegen

Vul `LOCATIONS.maassluis`, voeg een builder aan `MODEL_BUILDERS` toe en zet `available: true`. Een locatie bevat zijn eigen faciliteiten en camera-instellingen. De huidige animatie is specifiek voor de Rotterdamse SVG-indeling.

## Assets en rechten

Three.js 0.180.0 en het geometrische lettertype hebben meegeleverde licenties. Logo en Gilroy-fonts komen van de bestaande De Haas-site voor gebruik in deze klantcomponent; bestaande merk- en fontrechten blijven van toepassing. Foto’s zijn alleen als referentie gebruikt en worden niet in de pagina of download opgenomen.
