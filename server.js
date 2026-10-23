import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {createFeed} from './feed.js';
const root=resolve('public');
const getFeed=createFeed({key:process.env.GDOT_API_KEY});
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.png':'image/png'};
const port=Number(process.env.PORT)||5110;
const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(url.pathname==='/api/feed') {
    res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');
    try{res.end(JSON.stringify(await getFeed()));}catch(error){res.statusCode=503;res.end(JSON.stringify({error:error.message}));}return;
  }
  try{
    const path=resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
    if(!path.startsWith(root+sep)) {res.writeHead(403);res.end();return;}
    const data=await readFile(path);res.setHeader('Content-Type',types[extname(path)]||'application/octet-stream');res.end(data);
  }catch{res.writeHead(404);res.end('Not found');}
});
server.on('error',error=>{
  if(error.code==='EADDRINUSE') {
    console.error(`Port ${port} is already in use. If MGA Traffic Watch is already running, open http://localhost:${port}. Otherwise, stop the other server or set PORT=5111 in .env and restart.`);
  } else {
    console.error(`Unable to start MGA Traffic Watch: ${error.message}`);
  }
  process.exitCode=1;
});
server.listen(port,'127.0.0.1',()=>console.log(`MGA traffic dashboard: http://localhost:${port}`));
