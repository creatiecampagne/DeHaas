import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
const dir=path.dirname(fileURLToPath(import.meta.url));
const asset=async(file,type)=>`data:${type};base64,${(await fs.readFile(path.join(dir,'assets',file))).toString('base64')}`;
const licenses=await Promise.all(['THREE-LICENSE.txt','GEOMETRY-FONT-LICENSE.txt'].map(f=>fs.readFile(path.join(dir,f),'utf8')));
await build({entryPoints:[path.join(dir,'src/component.js')],outfile:path.join(dir,'de-haas-kaart.js'),bundle:true,minify:true,format:'iife',target:['es2020'],legalComments:'eof',banner:{js:`/*!\nThird-party licenses\n${licenses.join('\n\n')}\n*/`},loader:{'.css':'text'},define:{
  DH_LOGO_DATA:JSON.stringify(await asset('logo.svg','image/svg+xml')),
  DH_FONT_REGULAR_DATA:JSON.stringify(await asset('Gilroy-Medium.ttf','font/ttf')),
  DH_FONT_BOLD_DATA:JSON.stringify(await asset('Gilroy-ExtraBold.ttf','font/ttf'))
}});
const js=(await fs.readFile(path.join(dir,'de-haas-kaart.js'),'utf8')).replaceAll('</script','<\\/script');
const html=`<!doctype html>\n<html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#1c3b71"><title>De Haas Shipyards — Rotterdam in 3D</title><style>html,body{margin:0;min-height:100%;background:#edf1f6}body{padding:24px}main{max-width:1600px;margin:auto} @media(max-width:720px){body{padding:0}}</style></head><body><main><de-haas-shipyard location="rotterdam"></de-haas-shipyard><noscript>Schakel JavaScript in om de interactieve kaart te bekijken. Bekijk ook <a href="https://dehaas.nl/shipyards/onze-faciliteiten/">onze faciliteiten</a>.</noscript></main><script>${js}</script></body></html>`;
await fs.writeFile(path.join(dir,'index.html'),html);
console.log('Built component + standalone page:',(Buffer.byteLength(html)/1024).toFixed(0),'KB');
