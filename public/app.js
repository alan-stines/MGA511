import {regionalTiles} from './regional-tiles.js';
const $=s=>document.querySelector(s);
const campuses=await fetch('/data/campuses.json').then(r=>r.json());
let map, markers, circles, countyLayer, regionBounds, feed, selected='all';
const colors={accidentsAndIncidents:'#cf6d3d',closures:'#c54c58',roadwork:'#bd9134',specialEvents:'#3c8592'};
const labels={accidentsAndIncidents:'INCIDENT',closures:'CLOSURE',roadwork:'ROADWORK',specialEvents:'SPECIAL EVENT'};
function textNode(tag,text,cls){const el=document.createElement(tag);el.textContent=text;if(cls)el.className=cls;return el;}
function miles(a,b){const rad=d=>d*Math.PI/180;const dlat=rad(b.Latitude-a.lat),dlng=rad(b.Longitude-a.lng);const x=Math.sin(dlat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.Latitude))*Math.sin(dlng/2)**2;return 3958.8*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));}
function nearest(event){return campuses.map(c=>({...c,distance:miles(c,event)})).sort((a,b)=>a.distance-b.distance)[0];}
function popup(title,description){const div=document.createElement('div');div.append(textNode('div',title,'popup-title'),textNode('div',description,'popup-description'));return div;}
for(const c of campuses){const button=textNode('button',c.name);button.dataset.campus=c.id;$('#campus-nav').append(button);}
$('#campus-nav').addEventListener('click',e=>{const button=e.target.closest('button');if(!button)return;selected=button.dataset.campus;document.querySelectorAll('[data-campus]').forEach(b=>b.classList.toggle('active',b===button));if(map){const c=campuses.find(c=>c.id===selected);if(c)map.setView([c.lat,c.lng],11);else fit();}render();});
function fit(){map?.fitBounds(regionBounds||campuses.map(c=>[c.lat,c.lng]),{padding:[20,20]});}
try{
 if(!window.L)throw new Error('Map library unavailable');
 map=L.map('map',{zoomControl:false,minZoom:7,maxZoom:16,maxBoundsViscosity:1}).setView([32.53,-83.35],9);
 L.control.zoom({position:'topright'}).addTo(map);
 map.attributionControl.addAttribution('County boundaries: <a href="https://github.com/plotly/datasets/blob/master/geojson-counties-fips.json">Census / Plotly</a>');
 markers=L.layerGroup().addTo(map);circles=L.layerGroup().addTo(map);
 campuses.forEach(c=>L.marker([c.lat,c.lng],{icon:L.divIcon({className:'campus-pin',html:'M',iconSize:[26,26]})}).addTo(map).bindTooltip(c.name,{permanent:true,direction:'right',className:'campus-label',offset:[14,0]}).bindPopup(popup(`${c.name} campus`,`${c.address} · ${c.county} County. Approximate campus location; verify before operational use.`)));
 fit();
 const counties=await fetch('/data/counties.json').then(r=>{if(!r.ok)throw new Error();return r.json();});
 countyLayer=L.geoJSON(counties,{style:{color:'#89918f',weight:1.4,fill:false},onEachFeature:(feature,layer)=>layer.bindTooltip(feature.properties.NAME.toUpperCase(),{permanent:true,direction:'center',className:'county-label'})}).addTo(map);countyLayer.bringToBack();
 regionBounds=countyLayer.getBounds();
 map.setMaxBounds(regionBounds.pad(.03));
 function constrainZoom(){map.setMinZoom(Math.max(7,map.getBoundsZoom(regionBounds,false,L.point(40,40))));}
 constrainZoom();map.on('resize',constrainZoom);fit();
 regionalTiles(L,map,counties,regionBounds).on('tileerror',()=>{$('#boundary-status').textContent='Map tiles unavailable · county outlines remain visible';}).addTo(map);
 $('#boundary-status').textContent=`${counties.features.length} counties · campus locations approximate`;
}catch{$('#boundary-status').textContent='Map or county data unavailable';if(!map)$('#map').replaceChildren(textNode('p','Map unavailable. Internet access is required to load Leaflet. Traffic activity remains available below.','map-fallback'));}
function render(){
 if(!feed)return;
 const radius=Number($('#radius').value),campus=campuses.find(c=>c.id===selected),query=$('#search').value.toLowerCase();
 const events=feed.events.map(e=>({...e,near:nearest(e)})).filter(e=>(campus?miles(campus,e):e.near.distance)<=radius).filter(e=>$('#type').value==='all'||e.EventType===$('#type').value).filter(e=>`${e.RoadwayName} ${e.Description}`.toLowerCase().includes(query)).sort((a,b)=>Number(b.IsFullClosure)-Number(a.IsFullClosure)||a.near.distance-b.near.distance);
 $('#count').textContent=events.length;$('#events').replaceChildren();markers?.clearLayers();circles?.clearLayers();
 if(campus&&map)L.circle([campus.lat,campus.lng],{radius:radius*1609.344,color:'#79569b',weight:1,fillOpacity:.04,dashArray:'4 6'}).addTo(circles);
 for(const e of events){
   const color=colors[e.EventType]||'#718090',card=textNode('button','','event');
   const top=textNode('div','','event-top'),tag=textNode('span',labels[e.EventType]||'EVENT','event-tag');tag.style.color=color;top.append(tag,textNode('span',feed.mode==='demo'?'SAMPLE':e.LastUpdated?new Date(e.LastUpdated*1000).toLocaleTimeString('en-US',{timeZone:'America/New_York',hour:'numeric',minute:'2-digit'}):'Time unavailable'));
   const bottom=textNode('div','','event-bottom');bottom.append(textNode('span',`${e.near.name} · ${e.near.distance.toFixed(1)} mi`),textNode('span','View on map ↗'));
   card.append(top,textNode('h3',e.RoadwayName||'Traffic event'),textNode('p',e.Description||'No description provided.'),bottom);
   if(e.IsFullClosure)card.append(textNode('p','All lanes closed'));
   let marker;if(map)marker=L.marker([e.Latitude,e.Longitude],{icon:L.divIcon({className:'event-pin',html:`<span style="background:${color};width:100%;height:100%;display:grid;place-items:center;border-radius:3px">${e.IsFullClosure?'×':'!'}</span>`,iconSize:[23,23]})}).addTo(markers).bindPopup(popup(e.RoadwayName,e.Description));
   card.addEventListener('click',()=>{document.querySelectorAll('.event').forEach(c=>c.classList.remove('selected'));card.classList.add('selected');if(map){map.setView([e.Latitude,e.Longitude],12);marker.openPopup();}});
   $('#events').append(card);
 }
 if(!events.length)$('#events').append(textNode('p','No events match these filters. Try a wider radius or another campus.','empty'));
 $('#alerts').replaceChildren();
 const active=feed.alerts.filter(a=>!a.EndTime||a.EndTime*1000>Date.now());
 for(const a of active){const notice=textNode('div');notice.append(textNode('p',a.Message),textNode('p',`Regions: ${(a.Regions||[]).join(', ')||'Unspecified'}`,'muted'));$('#alerts').append(notice);}
 if(!active.length)$('#alerts').append(textNode('p',feed.mode==='demo'?'Live notices will appear after the API key is configured.':'No active notices returned by GDOT.','muted'));
}
async function refresh(){
 $('#refresh').disabled=true;
 try{const response=await fetch('/api/feed');const data=await response.json();if(!response.ok)throw new Error(data.error||'Feed unavailable');feed=data;$('#mode').textContent=data.mode==='demo'?'DEMO · API KEY PENDING':data.stale?'LIVE FEED · STALE':'GDOT CONNECTED';$('#mode').className=`badge ${data.stale?'error':data.mode==='live'?'live':''}`;$('#freshness').textContent=data.stale?'Connection lost · showing last successful feed':data.updatedAt?`Updated ${new Date(data.updatedAt).toLocaleTimeString('en-US',{timeZone:'America/New_York',hour:'numeric',minute:'2-digit'})} ET`:'Preview with sample traffic events';$('#demo-note').hidden=data.mode!=='demo';render();}
 catch(error){$('#mode').textContent='FEED UNAVAILABLE';$('#mode').className='badge error';$('#freshness').textContent=error.message;if(feed){$('#freshness').textContent+=' · previous data remains displayed';}else $('#events').replaceChildren(textNode('p','Traffic data is unavailable. Refresh to retry.','empty'));}
 finally{$('#refresh').disabled=false;}
}
$('#fit').addEventListener('click',fit);$('#refresh').addEventListener('click',refresh);['search','type','radius'].forEach(id=>$('#'+id).addEventListener('input',render));
function clock(){$('#clock').textContent=new Date().toLocaleString('en-US',{timeZone:'America/New_York',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})+' ET';}clock();setInterval(clock,30000);await refresh();setInterval(refresh,60000);
