import {getStore} from "@netlify/blobs";
import webpush from "web-push";
import {createHash} from "node:crypto";
export const config={rateLimit:{windowLimit:8,windowSize:60,aggregateBy:["ip","domain"]}};
const reply=(d,s=200)=>Response.json(d,{status:s,headers:{"Cache-Control":"no-store"}});
function validSub(s){try{const u=new URL(s.endpoint);const allowed=["fcm.googleapis.com","updates.push.services.mozilla.com","web.push.apple.com","wns2-par02p.notify.windows.com"];return u.protocol==="https:"&&!u.username&&!u.password&&!u.port&&u.href.length<1800&&(allowed.includes(u.hostname)||u.hostname.endsWith(".push.apple.com")||u.hostname.endsWith(".notify.windows.com"))&&/^[-_A-Za-z0-9]{87}$/.test(s.keys.p256dh)&&/^[-_A-Za-z0-9]{22}$/.test(s.keys.auth)}catch{return false}}
export default async function handler(req){
const pub=process.env.NICOLE_VAPID_PUBLIC,priv=process.env.NICOLE_VAPID_PRIVATE,contact=process.env.NICOLE_VAPID_CONTACT;
if(!pub||!priv||!contact)return reply({error:"Lembretes ainda não ativados pelo studio."},503);
if(req.method==="GET")return reply({publicKey:pub});
if(req.method!=="POST")return reply({error:"Método inválido."},405);
try{if(Number(req.headers.get("content-length")||0)>8000)return reply({error:"Dados inválidos."},413);
const {action,subscription,date,time,stage}=await req.json();if(!validSub(subscription))return reply({error:"Navegador incompatível com lembretes."},400);
const store=getStore({name:"nicole-push-"+(process.env.NICOLE_STORAGE_SCOPE==="production"?"prod":"preview"),consistency:"strong"});
const key=createHash("sha256").update(subscription.endpoint+"|"+subscription.keys.auth).digest("hex");
if(action==="cancel"){await store.delete(key);return reply({ok:true})}
webpush.setVapidDetails(contact,pub,priv);
if(action==="test"){await webpush.sendNotification(subscription,JSON.stringify({test:true,stage:stage==="24h"?"24h":stage==="2h"?"2h":"welcome"}),{TTL:60,timeout:8000});return reply({ok:true})}
if(action!=="schedule"||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^\d{1,2}:\d{2}$/.test(time))return reply({error:"Horário inválido."},400);
const appointment=Date.parse(date+"T"+time.padStart(5,"0")+":00-03:00"),now=Date.now();if(!Number.isFinite(appointment)||appointment<=now||appointment>now+366*86400000)return reply({error:"Data fora do período permitido."},400);
const pending=[{stage:"24h",due:appointment-24*3600000},{stage:"2h",due:appointment-2*3600000}].filter(x=>x.due>now);
if(!pending.length){await store.delete(key);return reply({ok:true,scheduled:0})}
await store.setJSON(key,{subscription,appointment,pending});
return reply({ok:true,scheduled:pending.length})
}catch{return reply({error:"Não foi possível ativar o lembrete."},502)}
}