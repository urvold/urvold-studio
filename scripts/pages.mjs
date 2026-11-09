import {readFile,mkdir,writeFile,stat} from 'node:fs/promises';
import path from 'node:path';

const {basePath,routes}=JSON.parse(await readFile('deployment.json','utf8'));
if(!/^\/[a-z0-9-]+\/$/.test(basePath))throw new Error('Expected a GitHub Pages project base path');
const html=await readFile('dist/index.html','utf8');
if(!html.includes(`src="${basePath}assets/`))throw new Error('Build is missing the configured asset prefix');
for(const route of routes){
 if(route==='/')continue;
 if(!/^\/[a-z0-9/-]+$/.test(route)||route.includes('..'))throw new Error('Unsafe route');
 const directory=path.join('dist',route);
 await mkdir(directory,{recursive:true});
 await writeFile(path.join(directory,'index.html'),html);
}
// Pages serves this shell for unknown paths; BrowserRouter renders the actual 404.
await writeFile('dist/404.html',html);
await writeFile('dist/.nojekyll','');
for(const route of routes)await stat(path.join('dist',route,'index.html'));
console.log(`Pages artifact ready: ${routes.length} page entries + 404 fallback, base ${basePath}`);
