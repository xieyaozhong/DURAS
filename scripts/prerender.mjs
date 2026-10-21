import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
// Execute our presentation templates without a browser, network, or user data.
// Visitors still receive the interactive app; crawlers also receive meaningful HTML.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
for(const region of ['tw','cn']){
 const dist=path.join(root,region);
 const app=fs.readFileSync(path.join(dist,'app.js'),'utf8');
 const start=app.indexOf("document.querySelector('#app').innerHTML=");
 const end=app.indexOf('\nconst dialog=',start);
 const renderStart=app.indexOf('function renderCatalog(){');
 const renderEnd=app.indexOf('\n',renderStart);
 const renderCatalog=app.slice(renderStart,renderEnd);
 const renderPrefix=app.slice(0,start);
 const renderRoot=app.slice(start,end);
 for(const name of ['index','coffee','story','journal','connect','contact','privacy']){
  const elements=new Map();const querySelector=selector=>{if(!elements.has(selector))elements.set(selector,{innerHTML:'',textContent:'',value:'',addEventListener(){}});return elements.get(selector)};
  const context=vm.createContext({window:{},document:{body:{dataset:{page:name==='index'?'home':name}},querySelector},localStorage:{getItem:()=>null},location:{href:'https://example.invalid/'},URL,Date,console});
  vm.runInContext(fs.readFileSync(path.join(dist,'site-config.js'),'utf8'),context);
  vm.runInContext(fs.readFileSync(path.join(dist,'catalog.js'),'utf8'),context);
  const extra=name==='coffee'?`let category='roasted';${renderCatalog};renderCatalog();`:name==='connect'?'renderPlatforms();feed();':'';
  vm.runInContext(renderPrefix+renderRoot+'\n'+extra+'\n})();',context);
  let html=querySelector('#app').innerHTML;
  if(name==='coffee'){
   html=html.replace('<div id="coffee-results" class="coffee-grid"></div>',`<div id="coffee-results" class="coffee-grid">${querySelector('#coffee-results').innerHTML}</div>`);
   html=html.replace('<p id="result-count" aria-live="polite"></p>',`<p id="result-count" aria-live="polite">${querySelector('#result-count').textContent}</p>`);
  }
  if(name==='connect'){
   html=html.replace('<div class="platform-grid" id="platform-grid"></div>',`<div class="platform-grid" id="platform-grid">${querySelector('#platform-grid').innerHTML}</div>`);
   html=html.replace('<div id="social-feed"></div>',`<div id="social-feed">${querySelector('#social-feed').innerHTML}</div>`);
  }
  const filename=path.join(dist,name+'.html');let source=fs.readFileSync(filename,'utf8');
  source=source.replace(/<div id="app">[\s\S]*<\/div><noscript>/,'<div id="app"></div><noscript>');
  if(!source.includes('<div id="app"></div>'))throw new Error('Prerender expects a fresh build: '+filename);
  source=source.replace('<div id="app"></div>',`<div id="app">${html}</div>`);
  fs.writeFileSync(filename,source);
 }
 console.log(region+': 7 pages prerendered');
}
