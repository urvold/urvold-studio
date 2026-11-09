import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {MemoryRouter} from 'react-router-dom';
import {existsSync,writeFileSync,readFileSync} from 'node:fs';
import {build} from 'esbuild';
const {basePath,routes,notFoundRoutes}=JSON.parse(readFileSync('deployment.json','utf8'));
await build({entryPoints:['src/App.tsx'],bundle:true,platform:'node',format:'esm',packages:'external',outfile:'.qa/app.mjs'});
const {default:App}=await import('../.qa/app.mjs');
const errors=[];
for(const route of [...routes,...notFoundRoutes]){
 const html=renderToStaticMarkup(React.createElement(MemoryRouter,{basename:basePath,initialEntries:[basePath.slice(0,-1)+route]},React.createElement(App)));
 if((html.match(/<h1[ >]/g)||[]).length!==1)errors.push(route+': expected one h1');
 if(/<(form|input|textarea|iframe)\b/.test(html))errors.push(route+': forbidden input');
 if(notFoundRoutes.includes(route)&&!html.includes('МАРШРУТ НЕ НАЙДЕН'))errors.push(route+': expected 404');
 for(const [,href]of html.matchAll(/href="([^"]+)"/g)){
  if(!href.startsWith('/'))continue;
  if(!href.startsWith(basePath)){errors.push(route+': missing Pages prefix '+href);continue;}
  const target=href.slice(basePath.length-1).split('#')[0];
  if(!routes.includes(target)&&!existsSync('public'+target))errors.push(route+': broken link '+href);
 }
 for(const [,src]of html.matchAll(/src="([^"]+)"/g)){
  if(!src.startsWith(basePath)||!existsSync('public/'+src.slice(basePath.length)))errors.push(route+': missing image '+src);
 }
}
if(errors.length)throw Error(errors.join('\n'));
const report={routes:routes.length+notFoundRoutes.length,basePath,status:'passed',checks:['SSR route rendering with Pages basename','one h1 per route','internal link targets and Pages prefix','local image files and prefix','404 pages','no forms or input fields'],note:'Browser and published artifact checks are recorded separately.'};
writeFileSync('checks.json',JSON.stringify(report,null,2)+'\n');console.log(report);
