import { getStore } from "@netlify/blobs";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
export const config={rateLimit:{windowLimit:60,windowSize:60,aggregateBy:["ip","domain"]}};
const base={theme:"natal",animations:true,notice:"",music:"",photos:[],promotion:"",deposit:25,closedDays:[0,1],blockedDates:[],hoursFrom:"00:00",hoursTo:"23:59",interval:0,services:{},pointsPerVisit:10,referralBonus:10,birthdayBonus:10};
const reply=(data,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
const digest=s=>createHash("sha256").update(s).digest();
const safeUrl=s=>{if(!s)return "";try{const u=new URL(String(s));return u.protocol==="https:"&&u.href.length<=1000?u.href:""}catch{return ""}};
const str=(s,n)=>String(s??"").slice(0,n);
const number=(v,min,max,d)=>Number.isFinite(Number(v))&&Number(v)>=min&&Number(v)<=max?Number(v):d;
const hh=s=>/^([01]\d|2[0-3]):[0-5]\d$/.test(s);
function normalize(v){v=v||{};const out={...base,theme:v.theme==="classic"?"classic":"natal",animations:v.animations!==false,notice:str(v.notice,220),music:safeUrl(v.music),photos:Array.isArray(v.photos)?v.photos.slice(0,8).map(safeUrl).filter(Boolean):[],promotion:str(v.promotion,220),deposit:number(v.deposit,0,1000,25),closedDays:Array.isArray(v.closedDays)?[...new Set(v.closedDays.filter(x=>Number.isInteger(x)&&x>=0&&x<=6))]:base.closedDays,blockedDates:Array.isArray(v.blockedDates)?[...new Set(v.blockedDates.filter(x=>typeof x==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(x)))].slice(0,365):[],hoursFrom:hh(v.hoursFrom)?v.hoursFrom:base.hoursFrom,hoursTo:hh(v.hoursTo)?v.hoursTo:base.hoursTo,interval:number(v.interval,0,120,0),pointsPerVisit:Math.floor(number(v.pointsPerVisit,0,1000,10)),referralBonus:Math.floor(number(v.referralBonus,0,1000,10)),birthdayBonus:Math.floor(number(v.birthdayBonus,0,1000,10)),services:{}};
if(out.hoursFrom>=out.hoursTo)throw new Error("Horário inicial deve ser anterior ao final.");
for(const [key,val] of Object.entries(v.services||{}).slice(0,20)){if(key.length<=120&&key!=="__proto__"&&key!=="constructor")out.services[key]={price:number(val?.price,0,10000,0),duration:number(val?.duration,15,480,60)}}
return out}
export default async function handler(req){
const secret=process.env.NICOLE_ADMIN_KEY||"";
const scope=process.env.CONTEXT==="production"?"prod":"preview";
const store=getStore({name:"nicole-studio-"+scope,consistency:"strong"});
const url=new URL(req.url),action=url.searchParams.get("action")||"settings";
try{
if(req.method==="GET"&&action==="settings")return reply(normalize(await store.get("settings",{type:"json"})));
if(req.method==="GET"&&action==="card"){const code=url.searchParams.get("code")||"";if(!/^[a-f0-9]{48}$/.test(code))return reply({error:"Código inválido."},400);const card=await store.get("card/"+digest(code).toString("hex"),{type:"json"});if(!card)return reply({error:"Cartão não encontrado."},404);return reply({points:card.points,visits:card.visits,referrals:card.referrals,birthday:card.birthday})}
if(req.method!=="POST")return reply({error:"Método não permitido."},405);
if(secret.length<24)return reply({error:"Configure NICOLE_ADMIN_KEY no Netlify (mínimo 24 caracteres)."},503);
const auth=req.headers.get("authorization")||"";if(!timingSafeEqual(digest(auth),digest("Bearer "+secret)))return reply({error:"Chave administrativa inválida."},401);
if(Number(req.headers.get("content-length")||0)>50000)return reply({error:"Dados muito grandes."},413);
const data=await req.json();
if(action==="settings"){const value=normalize(data);await store.setJSON("settings",value);return reply(value)}
if(action==="issue"||action==="sync"){const id=str(data.id,80);if(!/^\d+$/.test(id))return reply({error:"Cliente inválida."},400);const mapKey="client/"+createHmac("sha256",secret).update(id).digest("hex");const prev=await store.get(mapKey,{type:"json"});if(action==="sync"&&!prev?.code)return reply({skipped:true});const code=prev?.code||randomBytes(24).toString("hex");const key="card/"+digest(code).toString("hex");const old=await store.get(key,{type:"json"});const settings=normalize(await store.get("settings",{type:"json"}));const visits=Math.floor(number(data.visits,0,100000,0));const referrals=Math.floor(number(data.referrals??old?.referrals,0,10000,0));const birthday=Boolean(data.birthday??old?.birthday);const points=visits*settings.pointsPerVisit+referrals*settings.referralBonus+(birthday?settings.birthdayBonus:0);
await store.setJSON(key,{visits,referrals,birthday,points});await store.setJSON(mapKey,{code});return reply({code,visits,referrals,birthday,points})}
return reply({error:"Ação inválida."},400)
}catch(e){return reply({error:e?.message==="Horário inicial deve ser anterior ao final."?e.message:"Não foi possível concluir. Verifique a configuração do Netlify."},500)}
}