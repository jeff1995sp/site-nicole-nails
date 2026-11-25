import {getStore} from "@netlify/blobs";
import webpush from "web-push";
export const config={schedule:"*/5 * * * *"};
export default async function handler(){
const pub=process.env.NICOLE_VAPID_PUBLIC,priv=process.env.NICOLE_VAPID_PRIVATE,contact=process.env.NICOLE_VAPID_CONTACT;
if(!pub||!priv||!contact)return new Response("Not configured");
webpush.setVapidDetails(contact,pub,priv);
const store=getStore({name:"nicole-push-"+(process.env.NICOLE_STORAGE_SCOPE==="production"?"prod":"preview"),consistency:"strong"}),now=Date.now(),start=Date.now();let sent=0;
const {blobs}=await store.list();
for(const batch of Array.from({length:Math.ceil(blobs.length/8)},(_,i)=>blobs.slice(i*8,i*8+8))){if(Date.now()-start>18000)break;await Promise.allSettled(batch.map(async({key})=>{const item=await store.get(key,{type:"json"});if(!item)return;if(item.appointment<=now){await store.delete(key);return}if(item.due>now)return;try{await webpush.sendNotification(item.subscription,JSON.stringify({test:false}),{TTL:Math.min(900,Math.floor((item.appointment-now)/1000)),timeout:4000});await store.delete(key);sent++}catch(e){if(e.statusCode===404||e.statusCode===410)await store.delete(key)}}))}
return new Response("Sent "+sent)
}