import {build} from 'esbuild';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const directory=dirname(fileURLToPath(import.meta.url));
const temporary=await mkdtemp(join(tmpdir(),'de-haas-check-'));
try{
  for(const name of ['model','animation','ship-clearance']){
    const outfile=join(temporary,name+'.mjs');
    await build({entryPoints:[join(directory,name+'.mjs')],outfile,bundle:true,platform:'node',format:'esm',logLevel:'silent'});
    await import(pathToFileURL(outfile));
  }
}finally{await rm(temporary,{recursive:true,force:true});}
