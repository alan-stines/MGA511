// Clip a polygon ring against a tile rectangle (Sutherland–Hodgman).
export function clipRing(ring,size=256){
  let points=ring;
  for(const [axis,edge,sign] of [[0,0,1],[0,size,-1],[1,0,1],[1,size,-1]]){
    const output=[];
    for(let i=0;i<points.length;i++){
      const a=points[i],b=points[(i+1)%points.length];
      const insideA=(a[axis]-edge)*sign>=0,insideB=(b[axis]-edge)*sign>=0;
      if(insideA)output.push(a);
      if(insideA!==insideB){const t=(edge-a[axis])/(b[axis]-a[axis]);output.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]);}
    }
    points=output;
  }
  return points;
}

export function regionalTiles(L,map,counties,bounds){
  const rings=counties.features.flatMap(f=>f.geometry.type==='MultiPolygon'?f.geometry.coordinates.flat(1):f.geometry.coordinates);
  const projected=new Map();
  const RegionalLayer=L.GridLayer.extend({
    createTile(coords,done){
      const tile=document.createElement('div');
      if(!projected.has(coords.z))projected.set(coords.z,rings.map(r=>r.map(([lng,lat])=>{const p=map.project([lat,lng],coords.z);return [p.x,p.y];})));
      const paths=projected.get(coords.z).map(r=>clipRing(r.map(([x,y])=>[x-coords.x*256,y-coords.y*256]))).filter(r=>r.length>=3);
      if(!paths.length){queueMicrotask(()=>done(null,tile));return tile;}
      const path=paths.map(r=>'M'+r.map(p=>p.map(v=>v.toFixed(2)).join(' ')).join('L')+'Z').join('');
      tile.style.clipPath=`path(evenodd, "${path}")`;
      const img=document.createElement('img');img.alt='';img.width=256;img.height=256;
      img.onload=()=>done(null,tile);img.onerror=()=>done(new Error('Map tile unavailable'),tile);
      img.src=`https://tile.openstreetmap.org/${coords.z}/${coords.x}/${coords.y}.png`;
      tile.append(img);return tile;
    }
  });
  return new RegionalLayer({bounds,noWrap:true,minZoom:7,maxZoom:16,keepBuffer:0,updateWhenIdle:true,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'});
}
