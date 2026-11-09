import assert from 'node:assert/strict';
import {readFile,stat,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const {basePath,routes,notFoundRoutes}=JSON.parse(await readFile('deployment.json','utf8'));
const resources=new Set();
for(const route of routes){
 const file=path.join('dist',route,'index.html');
 const html=await readFile(file,'utf8');
 assert.match(html,/<meta name="robots" content="noindex,nofollow"/);
 for(const [,url]of html.matchAll(/(?:src|href)="([^"]+)"/g)){
  assert.ok(url.startsWith(basePath),`Resource outside Pages base: ${url}`);
  const target='dist/'+url.slice(basePath.length);
  assert.ok((await stat(target)).size>0,`Empty resource: ${target}`);
  resources.add(target);
 }
}
assert.equal(await readFile('dist/404.html','utf8'),await readFile('dist/index.html','utf8'));
for(const route of notFoundRoutes){
 assert.ok(!await stat(path.join('dist',route,'index.html')).catch(()=>false),'404 test path unexpectedly exists');
}
let fonts=0;
for(const css of [...resources].filter(file=>file.endsWith('.css'))){
 const content=await readFile(css,'utf8');
 for(const [,url]of content.matchAll(/url\(["']?([^\)"']+)["']?\)/g)){
  assert.ok(!/^https?:/.test(url),'Remote font or CSS resource found');
  if(url.startsWith('data:'))continue;
  const target=url.startsWith(basePath)?'dist/'+url.slice(basePath.length):path.join(path.dirname(css),url);
  const bytes=await readFile(target);assert.ok(bytes.length>0);
  if(target.endsWith('.woff2')){assert.equal(bytes.subarray(0,4).toString(),'wOF2');fonts++;}
  resources.add(target);
 }
}
assert.ok(fonts>=2,'Expected local Cyrillic and Latin font resources');
for(const name of ['urvold-original.jpg','apex.webp','forma.webp','elan.webp','putem.webp','potok.webp','randomwheel.webp']){
 const original=await readFile('public/assets/'+name),built=await readFile('dist/assets/'+name);
 assert.equal(createHash('sha256').update(original).digest('hex'),createHash('sha256').update(built).digest('hex'),'Image differs: '+name);
 if(name.endsWith('.webp')){assert.equal(built.subarray(0,4).toString(),'RIFF');assert.equal(built.subarray(8,12).toString(),'WEBP');}
 else assert.equal(built.subarray(0,3).toString('hex'),'ffd8ff');
 resources.add('dist/assets/'+name);
}
const report={status:'passed',basePath,knownRoutes:routes.length,notFoundScenarios:notFoundRoutes.length,localFontFiles:fonts,verifiedResourceFiles:resources.size,checks:['HTML entry for every known route','404 fallback shell','Pages prefixes in HTML/CSS','local font signatures','source/build image SHA-256 equality','prototype noindex retained'],limitation:'Static artifact checks; not a browser or deployment verification.'};
await writeFile('pages-checks.json',JSON.stringify(report,null,2)+'\n');console.log(report);
