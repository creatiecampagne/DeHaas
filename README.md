# De Haas Shipyards — interactieve werfkaart

Een zelfstandige, volledig in code opgebouwde 3D-kaart van de Rotterdamse werf. De interface volgt het opgegeven kleurenpalet en gebruikt het logo en de Gilroy-lettertypen van de huidige De Haas-website. De pagina bevat uitsluitend de kaart en de bijbehorende bediening.

## Bekijken

Open **index.html** in een moderne browser. Alle benodigde code, fonts en het logo zitten in dit bestand; er zijn tijdens gebruik geen CDN-verzoeken, accounts of API-sleutels nodig.

De map bevat ook de losse **de-haas-kaart.js** voor directe inbouw en de leesbare broncode. Het bestand `index.html` is dezelfde component, in een minimale voorbeeldpagina.

## Inbouwen op de website

Plaats `de-haas-kaart.js` op de eigen website, bijvoorbeeld onder `/assets/werfkaart/`. Voeg daarna op de faciliteitenpagina toe:

```html
<de-haas-shipyard location="rotterdam"></de-haas-shipyard>
<script defer src="/assets/werfkaart/de-haas-kaart.js"></script>
```

Er is geen React, Vue of WordPress-plugin nodig. De component past zich aan de breedte van zijn container aan. De interne stijlen staan in een Shadow DOM zodat ze de bestaande pagina niet beïnvloeden. Voor het desktopaanzicht is een container van ten minste ongeveer 1.000 px prettig.

Bij een kleiner vlak dan 720 px komt de lijst onder de kaart. Op desktop is de kaarthoogte tussen 660 en 860 px, afhankelijk van het venster. Deze instellingen staan in `src/styles.css`.

Als iframe kan ook de zelfstandige pagina worden gebruikt:

```html
<iframe
  src="/werfkaart/index.html"
  title="De Haas Shipyards Rotterdam — interactieve 3D-kaart"
  style="width:100%;height:850px;border:0"
  loading="lazy">
</iframe>
```

Geef de iframe op smalle schermen desgewenst circa 1.110 px hoogte; anders blijft de inhoud binnen de iframe scrollbaar. De knop voor vergroten vult het huidige venster, of het iframe bij iframe-inbouw. Bij een strenge Content Security Policy moeten de ingesloten stijlen, datafonts en het datalogo worden toegestaan; directe inbouw is daarom het eenvoudigst binnen de bestaande De Haas-infrastructuur.

## Bediening

- Sleep met de muis of één vinger om rond de werf te draaien.
- Scroll, knijp met twee vingers of gebruik +/− om te zoomen.
- Beweeg over een hotspot om het onderdeel en de informatie te zien. Klik om erop te focussen.
- Klik op een faciliteit in de lijst om het model dichterbij te bekijken.
- Klap de lijst in voor extra kijkruimte. Klikken op een hotspot opent de lijst weer.
- **Overzicht** herstelt het vaste startaanzicht en sluit de geselecteerde informatie.
- De knop voor vergroten vult het venster. Escape sluit de vergrote weergave.
- Toetsenbord: focus de kaart met Tab; pijltjes draaien, +/− zoomen en Home herstelt het overzicht. De lijst en hotspots zijn eveneens toetsenbordbedienbaar.

De camera blijft boven het terrein en heeft grenzen voor in- en uitzoomen. Camera-overgangen houden rekening met `prefers-reduced-motion`. Als WebGL niet beschikbaar is, blijft de faciliteitenlijst bruikbaar.

## Model en schaal

De scene gebruikt meters: **1 eenheid = 1 meter**. Het is een gestileerde ruimtelijke reconstructie, geen landmeetkundig of bouwkundig model. De terreincontour en onderlinge plaatsing volgen de aangeleverde satellietuitsnede en gelabelde luchtfoto; de contour is vereenvoudigd. De 3D-scene bevat geen fototextures, reflecties, PBR-materialen of geïmporteerde 3D-bestanden.

| Onderdeel | Gebruikte basis | Status |
|---|---|---|
| Terrein en kade | Aangeleverde satellietuitsnede, gelabelde luchtfoto en Google Maps-satellietbeeld op Scheepsbouwplein 3 | Visueel gereconstrueerd; geen ingemeten perceelsgrens |
| Insteekhaven | Meetfunctie Google Maps: meetlijn door het zichtbare bassin, 74,33 m | Circa 75 m in het model; de meetlijn is een schaalcontrole, geen gecertificeerde volledige kadelengte |
| Breedte insteekhaven | Fotoverhoudingen en benodigde ruimte voor schepen | Circa 18 m in het model, geschat |
| Scheepsbouwloods | Opgave 120 × 28 m; vrije hoogte >21 m | Hoofdvolume 120 × 28 m, buitengevel circa 26 m, nok circa 30 m; hoogte en details gestileerd |
| Travelift | Marine Travelift 820C; foto's, personen en schepen als schaalreferentie | Frame circa 36 m lang, 28 m tussen buitenzijden van portalen en 27 m hoog; geen fabriekstekening |
| Capaciteit travelift | De Haas: 820 ton, schepen ca. 70 m lang en 14,5 m breed | Gepubliceerde gebruikscapaciteit, niet de buitenmaat van de lift |
| Afspuitplaats, kadekraan, kantoor en pontons | Aangeleverde beelden | Visuele schattingen; de kraan is generiek |
| Werfvloer | Opgave ruim 1 ha vloeistofdichte vloer | Deze oppervlakte is niet gelijkgesteld aan de volledige getekende kavel |
| Schepen | Vereenvoudigde werkvaartuigen van ongeveer 21–29 m | Illustratieve vormen en posities, geen actuele bezettingsregistratie |

De kadekraan, boten, raamindeling en werkmaterialen hebben extra geometrische details. Rood/koraal wordt alleen gebruikt in bediening en hotspots. Licht en schaduw produceren varianten van de opgegeven basiskleuren.

## Bestanden aanpassen

| Bestand | Inhoud |
|---|---|
| `src/locations.js` | Locaties, teksten, feiten, startcamera, hotspotankers en focuspunten |
| `src/model.js` | Volledige geometrie: terrein, loods, lift, kraan, schepen, kantoor en pontons |
| `src/component.js` | Camera, selecties, lifecycle, toegankelijkheid en renderen |
| `src/styles.css` | Huisstijl, responsive indeling en bediening |
| `src/icons.js` | Lijniconen in SVG |
| `build.mjs` | Bundelen naar het losse script en de zelfstandige HTML |

Na bronwijzigingen opnieuw bouwen:

```sh
npm ci
npm run build
```

Gebruik een recente Node.js-versie (20 of hoger). Optioneel opent `npm start` een lokale server op `http://127.0.0.1:4173`, mits Python 3 beschikbaar is. Voor het gewone bekijken of inbouwen is geen installatie nodig.

## Maassluis later toevoegen

1. Vul `LOCATIONS.maassluis` met `district`, `address`, `overview`, `stats` en `features`.
2. Voeg in `src/model.js` een builder toe aan `MODEL_BUILDERS.maassluis`. Gebruik dezelfde groepnamen als de feature-ID's.
3. Zet `available: true` en bouw opnieuw.

De bestaande locatieknoppen laden dan de betreffende locatie via `setLocation()`. Een locatie bevat haar eigen teksten, hotspotcoördinaten en camera-instellingen. In deze versie is Maassluis bewust uitgeschakeld.

Optioneel kan de website luisteren naar selectie:

```js
document.querySelector('de-haas-shipyard').addEventListener('facilitychange', event => {
  console.log(event.detail.location, event.detail.facility);
});
```

## Controle en prestaties

- Build en broncode gecontroleerd; alle acht faciliteiten openen het juiste paneel.
- Hotspot → lijst, lijst → camerafocus, reset, inklappen/heropenen, zoomgrenzen, toetsenbord en vergroten/Escape gecontroleerd.
- Schermbreedtes 320, 390, 1.024 en 1.440 px bekeken. Canvas en markers schalen samen. Op 320 px waren alle acht markers zichtbaar zonder overlappende klikvlakken.
- Fallback met uitgeschakelde WebGL getest; de lijst blijft werken.
- Scene: circa **49.000 driehoeken**, **45 samengevoegde meshgroepen**. Schaduwweergave kan extra tekenopdrachten veroorzaken.
- Script ongeveer **1,1 MB ongecomprimeerd**, circa **0,39 MB met gzip**, inclusief Three.js en de huisstijlassets. Geen externe 3D-downloads.
- De scene rendert op aanvraag tijdens interactie en camera-overgangen; er is geen doorlopende kraan-, water- of scheepsanimatie. De pixeldichtheid is begrensd.

De browsertests zijn uitgevoerd in de ingebouwde Chromium-browser. Touchbediening is ingericht met Three.js OrbitControls; er is geen fysieke tablet of brede reeks laptops op beeldsnelheid getest. Controle in de uiteindelijke WordPress-pagina blijft nodig voor de beschikbare breedte en eventuele sitebeperkingen.

## Bronnen en assets

- De door Coen aangeleverde foto's, screenshots, gelabelde luchtfoto en `de-haas-rotterdam_referentiemateriaal.html`.
- [De Haas Shipyards](https://dehaas.nl/shipyards/) — capaciteit travelift en locatie.
- [Onze faciliteiten](https://dehaas.nl/shipyards/onze-faciliteiten/) — huisstijl, logo, fonts en informatiepatroon.
- [Google Maps: Scheepsbouwplein 3](https://www.google.com/maps/place/Scheepsbouwplein+3,+Rotterdam/) — satellietcontrole en bassinmeetlijn, geraadpleegd 18 september 2026.
- [Netherlands Maritime Technology: de werf in Rotterdam](https://www.maritimetechnology.nl/nl/actueel/de-haas-shipyards-bouwt-aan-de-scheepswerf-van-de-toekomst-op-een-bruisend-historische-plek-in-rotterdam) — achtergrond van de loods.

Three.js 0.180.0 is meegeleverd onder de MIT-licentie. De bijbehorende licentieteksten staan in de map en in de gegenereerde bestanden. Het De Haas-logo en de Gilroy-fonts zijn overgenomen uit de bestaande klantwebsite voor deze De Haas-component; hun bestaande merkrechten en fontlicenties blijven van toepassing. Referentiefoto's zijn niet als siteassets meegeleverd.
