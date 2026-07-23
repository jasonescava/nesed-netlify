import { NextRequest,NextResponse } from "next/server";

const MAKES=["Acura","Alfa Romeo","Aston Martin","Audi","Bentley","BMW","Buick","Cadillac","Chevrolet","Chrysler","Dodge","Ferrari","Fiat","Ford","Genesis","GMC","Honda","Hyundai","Infiniti","Jaguar","Jeep","Kia","Lamborghini","Land Rover","Lexus","Lincoln","Lucid","Maserati","Mazda","McLaren","Mercedes-Benz","Mercedes","Mini","Mitsubishi","Nissan","Polestar","Porsche","Ram","Rivian","Rolls-Royce","Subaru","Tesla","Toyota","Volkswagen","Volvo"];
const firstUrl=(...xs:any[])=>xs.flat(3).find(x=>typeof x==="string"&&/^https?:\/\//.test(x));
const clean=(x:any)=>typeof x==="string"?x.trim():x;

const normAuto=(r:any)=>({
  id:r.vin||r.vehicle?.vin,
  year:Number(r.vehicle?.year)||0,
  make:clean(r.vehicle?.make)||"",
  model:clean(r.vehicle?.model)||"",
  trim:clean(r.vehicle?.trim)||"",
  price:Number(r.retailListing?.price)||0,
  miles:Number(r.retailListing?.miles??r.retailListing?.mileage)||0,
  fuel:clean(r.vehicle?.fuel||r.vehicle?.fuelType)||"Other",
  image:firstUrl(r.media?.photoLinks,r.media?.photo_links,r.media?.photos?.map((x:any)=>x?.url||x),r.retailListing?.photoLinks,r.retailListing?.photos,r.retailListing?.primaryImage,r.primaryImage,r.image),
  location:r.retailListing?.city&&r.retailListing?.state?`${r.retailListing.city}, ${r.retailListing.state}`:clean(r.location?.city&&r.location?.state?`${r.location.city}, ${r.location.state}`:r.location),
  distance:Number(r.distance??r.distanceFromOrigin)||0,
  source:"Auto.dev",
  url:firstUrl(r.retailListing?.vdp,r.retailListing?.vdpUrl,r.retailListing?.vdp_url,r.vdpUrl,r.url)
});

const normMarket=(r:any)=>({
  id:r.id||r.vin,year:Number(r.build?.year)||0,make:clean(r.build?.make)||"",model:clean(r.build?.model)||"",trim:clean(r.build?.trim)||"",
  price:Number(r.price)||0,miles:Number(r.miles)||0,fuel:clean(r.build?.fuel_type||r.build?.fuel)||"Other",
  image:firstUrl(r.media?.photo_links,r.media?.photoLinks,r.media?.photos?.map((x:any)=>x?.url||x),r.primary_photo_url,r.image),
  location:r.dealer?.city&&r.dealer?.state?`${r.dealer.city}, ${r.dealer.state}`:"Local dealer",distance:Number(r.dist)||0,source:"MarketCheck",url:firstUrl(r.vdp_url,r.vdpUrl)
});

const parseSearch=(raw:string)=>{
  const query=raw.trim(),lower=query.toLowerCase();
  const make=MAKES.find(x=>lower.includes(x.toLowerCase()));
  const fuel=lower.includes("electric")?"Electric":lower.includes("hybrid")?"Hybrid":lower.includes("diesel")?"Diesel":"";
  const year=query.match(/\b(19|20)\d{2}\b/)?.[0]||"";
  const under=query.match(/(?:under|below|max)\s*\$?([\d,.]+)\s*(k)?/i);
  const maxPrice=under?Math.round(Number(under[1].replace(/,/g,""))*(under[2]?1000:1)):0;
  let model=make?query.replace(new RegExp(make,"i"),""):"";
  model=model.replace(/\b(19|20)\d{2}\b|\b(electric|hybrid|diesel|gas|used|new|car|cars|suv|truck|coupe|sedan|under|below|max)\b|\$?[\d,.]+k?/gi," ").replace(/\s+/g," ").trim();
  if(!make&&query.split(/\s+/).length<=2&&!fuel&&!year&&!maxPrice) model=query;
  return{make:make==="Mercedes"?"Mercedes-Benz":make||"",model,fuel,year,maxPrice};
};

export async function GET(req:NextRequest){
  const q=req.nextUrl.searchParams,zip=q.get("zip")||"10001",limit=Math.min(Math.max(Number(q.get("limit")||20),1),20),page=Math.max(Number(q.get("page")||1),1);
  const parsed=parseSearch(q.get("q")||"");
  const make=q.get("make")||parsed.make,model=q.get("model")||parsed.model;
  const jobs:Promise<{ok:boolean;data:any[];total?:number;source:string}>[]=[];

  if(process.env.AUTO_DEV_API_KEY){
    const p=new URLSearchParams({limit:String(limit),page:String(page),zip,distance:"100",includes:"total",sort:"updatedAt.desc"});
    if(make)p.set("vehicle.make",make);if(model)p.set("vehicle.model",model);if(parsed.fuel)p.set("vehicle.fuel",parsed.fuel);if(parsed.year)p.set("vehicle.year",parsed.year);if(parsed.maxPrice)p.set("retailListing.price",`1-${parsed.maxPrice}`);
    jobs.push(fetch(`https://api.auto.dev/listings?${p}`,{headers:{Authorization:`Bearer ${process.env.AUTO_DEV_API_KEY}`,Accept:"application/json"},cache:"no-store"}).then(async r=>{if(!r.ok)return{ok:false,data:[],source:"Auto.dev"};const x=await r.json();return{ok:true,data:(x.data||[]).map(normAuto),total:Number(x.total)||undefined,source:"Auto.dev"}}).catch(()=>({ok:false,data:[],source:"Auto.dev"})));
  }
  if(process.env.MARKETCHECK_API_KEY){
    const p=new URLSearchParams({api_key:process.env.MARKETCHECK_API_KEY,rows:String(limit),start:String((page-1)*limit),zip,radius:"100"});
    if(make)p.set("make",make);if(model)p.set("model",model);if(parsed.fuel)p.set("fuel_type",parsed.fuel);if(parsed.year)p.set("year",parsed.year);if(parsed.maxPrice)p.set("price_range",`0-${parsed.maxPrice}`);
    jobs.push(fetch(`https://api.marketcheck.com/v2/search/car/active?${p}`,{cache:"no-store"}).then(async r=>{if(!r.ok)return{ok:false,data:[],source:"MarketCheck"};const x=await r.json();return{ok:true,data:(x.listings||[]).map(normMarket),total:Number(x.num_found)||undefined,source:"MarketCheck"}}).catch(()=>({ok:false,data:[],source:"MarketCheck"})));
  }

  const responses=await Promise.all(jobs),all=responses.flatMap(x=>x.data),valid=all.filter(x=>x.id&&x.year&&x.make&&x.model&&x.price);
  const unique=[...new Map(valid.map(x=>[x.id,x])).values()];
  const healthy=responses.filter(x=>x.ok),total=healthy.reduce((n,x)=>n+(x.total||0),0)||undefined;
  return NextResponse.json({data:unique,total,page,hasMore:unique.length>=limit,sources:healthy.map(x=>x.source),mode:healthy.length?"live":jobs.length?"error":"demo"},{headers:{"Cache-Control":"no-store"}});
}
