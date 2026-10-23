export const bounds = {south:31.8,north:33.25,west:-84.25,east:-82.35};
export function inRegion(event) {
  return typeof event.Latitude === 'number' && typeof event.Longitude === 'number' && event.Latitude >= bounds.south && event.Latitude <= bounds.north && event.Longitude >= bounds.west && event.Longitude <= bounds.east;
}
export function createFeed({key,fetcher=fetch,now=Date.now}={}) {
  let cache, pending, lastAttempt = -Infinity;
  return async function getFeed() {
    if (!key) return {mode:'demo',events:demoEvents,alerts:[],updatedAt:null,stale:false};
    if (pending) return pending;
    if (now()-lastAttempt < 60000) {
      if(cache) return cache;
      throw new Error('Feed unavailable; next retry in one minute.');
    }
    lastAttempt=now();
    pending=(async()=>{
      try {
        const responses=await Promise.all(['event','alerts'].map(async resource=>{
          const url=new URL(`https://511ga.org/api/v2/get/${resource}`);
          url.searchParams.set('key',key);url.searchParams.set('format','json');
          const response=await fetcher(url,{signal:AbortSignal.timeout(15000)});
          if(!response.ok) throw new Error('GDOT request failed');
          const data=await response.json();
          if(!Array.isArray(data)) throw new Error('Unexpected GDOT response');
          return data;
        }));
        cache={mode:'live',events:responses[0].filter(inRegion),alerts:responses[1],updatedAt:new Date(now()).toISOString(),stale:false};
      } catch {
        if(!cache) throw new Error('Unable to reach GDOT. No live data available.');
        cache={...cache,stale:true};
      }
      return cache;
    })();
    try{return await pending;}finally{pending=null;}
  };
}
const demoEvents=[
  {ID:1,RoadwayName:'I-475',Latitude:32.813,Longitude:-83.742,EventType:'accidentsAndIncidents',IsFullClosure:false,Description:'DEMONSTRATION: Crash near the Macon campus. Right lane blocked.',LanesAffected:'Right lane blocked'},
  {ID:2,RoadwayName:'SR 247',Latitude:32.638,Longitude:-83.602,EventType:'roadwork',IsFullClosure:false,Description:'DEMONSTRATION: Road maintenance on SR 247. Expect reduced speeds.',LanesAffected:'One lane affected'},
  {ID:3,RoadwayName:'US 23',Latitude:32.405,Longitude:-83.341,EventType:'closures',IsFullClosure:true,Description:'DEMONSTRATION: Temporary full closure near Cochran.',LanesAffected:'All lanes blocked'},
  {ID:4,RoadwayName:'I-16',Latitude:32.498,Longitude:-82.971,EventType:'roadwork',IsFullClosure:false,Description:'DEMONSTRATION: Bridge maintenance south of Dublin.',LanesAffected:'One lane affected'},
  {ID:5,RoadwayName:'US 341',Latitude:32.235,Longitude:-83.145,EventType:'specialEvents',IsFullClosure:false,Description:'DEMONSTRATION: Special event traffic near Eastman.',LanesAffected:'Expect delays'}
];
