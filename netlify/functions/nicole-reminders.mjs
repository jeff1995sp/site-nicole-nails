import {getStore} from "@netlify/blobs";
import webpush from "web-push";
export const config={schedule:"*/5 * * * *"};
export default async function handler(){
const pub=process.env.NICOLE_VAPID_PUBLIC,priv=process.env.NICOLE_VAPID_PRIVATE,contact=process.env.NICOLE_VAPID_CONTACT;
if(!pub||!priv||!contact)return new Response("Not configured");
webpush.setVapidDetails(contact,pub,priv);
const store=getStore({name:"nicole-push-"+(process.env.NICOLE_STORAGE_SCOPE==="production"?"prod":"preview"),consistency:"strong"}),now=Date.now(),start=Date.now();let sent=0;
const {blobs}=await store.list();
for(const batch of Array.from({length:Math.ceil(blobs.length/8)},(_,i)=>blobs.slice(i*8,i*8+8))){
 if(Date.now()-start>18000)break;
 await Promise.allSettled(batch.map(async({key})=>{
 const item=await store.get(key,{type:"json"});if(!item)return;
 if(!Number.isFinite(item.appointment)||item.appointment<=now){await store.delete(key);return}
 // Migrate the previous single-reminder schema without sending two delayed notices.
 const pending=Array.isArray(item.pending)?item.pending:[{stage:"24h",due:item.appointment-24*3600000},{stage:"2h",due:item.appointment-2*3600000}];
 const eligible=pending.filter(x=>["24h","2h"].includes(x.stage)&&Number.isFinite(x.due));
 const due=eligible.filter(x=>x.due<=now).sort((a,b)=>b.due-a.due)[0];if(!due)return;
 try{
 await webpush.sendNotification(item.subscription,JSON.stringify({test:false,stage:due.stage}),{TTL:Math.max(1,Math.min(900,Math.floor((item.appointment-now)/1000))),timeout:4000});
 const remaining=eligible.filter(x=>x.due>now);
 // Keep the later reminder, rather than deleting the whole subscription at the first notice.
 const latest=await store.get(key,{type:"json"});
 if(latest&&latest.appointment===item.appointment&&JSON.stringify(latest.pending??null)===JSON.stringify(item.pending??null)){
 if(remaining.length)await store.setJSON(key,{subscription:item.subscription,appointment:item.appointment,pending:remaining});else await store.delete(key);
 }
 sent++;
 }catch(e){if(e.statusCode===404||e.statusCode===410){const latest=await store.get(key,{type:"json"});if(latest?.appointment===item.appointment)await store.delete(key)}}
 }));
}
return new Response("Sent "+sent)
}