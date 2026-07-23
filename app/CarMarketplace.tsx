"use client";
import React,{useEffect,useMemo,useRef,useState}from"react";

type Car={id:string;year:number;make:string;model:string;trim:string;price:number;monthly:number;miles:number;fuel:string;image?:string;source:string;location:string;distance:number;url?:string};
const money=(n:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n);
const FALLBACK:Car[]=[];

export default function CarMarketplace(){
  const[query,setQuery]=useState("");
  const[fuel,setFuel]=useState("All");
  const[sort,setSort]=useState("recommended");
  const[inventory,setInventory]=useState<Car[]>(FALLBACK);
  const[dataMode,setDataMode]=useState<"demo"|"live"|"error">("demo");
  const[total,setTotal]=useState<number>();
  const[searching,setSearching]=useState(true);
  const[page,setPage]=useState(1);
  const[hasMore,setHasMore]=useState(false);
  const[saved,setSaved]=useState<string[]>([]);
  const[menu,setMenu]=useState(false);
  const[intro,setIntro]=useState(true);
  const[journey,setJourney]=useState(0);
  const journeyRef=useRef<HTMLElement>(null);

  const normalize=(data:any[]):Car[]=>data.map(x=>({id:x.id,year:Number(x.year),make:x.make,model:x.model,trim:x.trim||"",price:Number(x.price),monthly:Math.round(Number(x.price)*.014),miles:Number(x.miles)||0,fuel:x.fuel||"Other",image:x.image||undefined,source:x.source||"Provider",location:x.location||"Dealer location unavailable",distance:Number(x.distance)||0,url:x.url||undefined}));

  useEffect(()=>{const t=setTimeout(()=>setIntro(false),1100);return()=>clearTimeout(t)},[]);
  useEffect(()=>{const onScroll=()=>{const el=journeyRef.current;if(!el)return;const r=el.getBoundingClientRect(),max=el.offsetHeight-innerHeight;setJourney(Math.max(0,Math.min(1,-r.top/Math.max(1,max))))};onScroll();addEventListener("scroll",onScroll,{passive:true});return()=>removeEventListener("scroll",onScroll)},[]);
  useEffect(()=>{const controller=new AbortController(),timer=setTimeout(()=>{setSearching(true);setPage(1);const routes=query?[query]:["","BMW","Porsche","Mercedes-Benz","Toyota","Tesla","Audi","Ford"];Promise.all(routes.map(term=>fetch(`/api/vehicles?zip=10001&limit=${query?20:8}&page=1&q=${encodeURIComponent(term)}`,{signal:controller.signal}).then(r=>r.json()))).then(results=>{const first=results[0]||{};const merged=results.flatMap(x=>Array.isArray(x.data)?normalize(x.data):[]);setDataMode(first.mode);setTotal(first.total);setHasMore(query?results.some(x=>x.hasMore):false);setPage(1);setInventory(first.mode==="live"?[...new Map(merged.map(x=>[x.id,x])).values()]:[])}).catch(e=>{if(e.name!=="AbortError"){setDataMode("error");setInventory([])}}).finally(()=>setSearching(false))},query?450:0);return()=>{clearTimeout(timer);controller.abort()}},[query]);

  const loadMore=()=>{const next=page+1;setSearching(true);fetch(`/api/vehicles?zip=10001&limit=20&page=${next}&q=${encodeURIComponent(query)}`).then(r=>r.json()).then(({data,mode,hasMore})=>{if(mode==="live"){setInventory(old=>{const merged=[...old,...normalize(Array.isArray(data)?data:[])];return[...new Map(merged.map(x=>[x.id,x])).values()]});setPage(next);setHasMore(!!hasMore)}}).finally(()=>setSearching(false))};

  const filtered=useMemo(()=>{let rows=inventory.filter(c=>fuel==="All"||c.fuel.toLowerCase().includes(fuel.toLowerCase()));if(sort==="price")rows=[...rows].sort((a,b)=>a.price-b.price);if(sort==="miles")rows=[...rows].sort((a,b)=>a.miles-b.miles);if(sort==="year")rows=[...rows].sort((a,b)=>b.year-a.year);return rows},[inventory,fuel,sort]);
  const diverse=useMemo(()=>{if(query.trim())return filtered;const seen=new Set<string>();return filtered.filter(c=>{const key=`${c.make} ${c.model}`.toLowerCase();if(seen.has(key))return false;seen.add(key);return true})},[filtered,query]);
  const showcase=diverse.filter(c=>c.image).slice(0,4);
  const phase=journey<.24?0:journey<.5?1:journey<.76?2:3;
  const driftKeys=[{t:0,x:16,y:8,r:0,s:.82},{t:.18,x:4,y:3,r:-3,s:.88},{t:.38,x:-18,y:10,r:-14,s:.94},{t:.58,x:2,y:15,r:8,s:.82},{t:.76,x:34,y:4,r:18,s:.62},{t:1,x:75,y:-18,r:27,s:.28}];
  const driftIndex=Math.min(driftKeys.length-2,Math.max(0,driftKeys.findIndex((k,i)=>i<driftKeys.length-1&&journey>=k.t&&journey<=driftKeys[i+1].t)));
  const driftA=driftKeys[driftIndex],driftB=driftKeys[driftIndex+1],driftMix=(journey-driftA.t)/(driftB.t-driftA.t),drift=(a:number,b:number)=>a+(b-a)*driftMix;
  const save=(id:string)=>setSaved(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);

  return <>
    <div className={`film-loader ${intro?"":"gone"}`}><div className="loader-road"><i/><b/></div><div className="loader-brand"><span className="logo-mark">N</span><strong>NESED</strong></div><small>IGNITING THE MARKET</small></div>
    <header className="nav-shell cinematic-nav"><a className="brand" href="#top"><span className="logo-mark">N</span><span>NESED</span></a><nav className={menu?"open":""}><a href="#journey">Experience</a><a href="#collection">Collection</a><a href="#inventory">Live search</a></nav><div className="nav-actions"><button className="save">Saved <b>{saved.length}</b></button><button className="menu" onClick={()=>setMenu(!menu)} aria-label="Menu">{menu?"×":"☰"}</button></div></header>

    <main id="top">
      <section className={`road-journey journey-phase-${phase}`} id="journey" ref={journeyRef} style={{"--journey":journey,"--film-x":`${journey*5}%`,"--film-y":`${journey*2}%`,"--film-scale":1+journey*.08,"--car-x":`${drift(driftA.x,driftB.x)}vw`,"--car-y":`${drift(driftA.y,driftB.y)}vh`,"--car-r":`${drift(driftA.r,driftB.r)}deg`,"--car-s":drift(driftA.s,driftB.s),"--smoke":Math.max(0,Math.sin(journey*Math.PI)*1.25)} as React.CSSProperties}>
        <div className="journey-sticky">
          <div className="journey-film"/>
          <div className="drift-smoke smoke-a"/><div className="drift-smoke smoke-b"/><div className="drift-trail"/>
          <img className="drift-car" src="/nesed-drift-car-v2.png" alt="Blue performance car drifting through the NESED journey"/>
          <div className="journey-vignette"/><div className="film-noise"/>
          <div className="terrain terrain-coast"/><div className="terrain terrain-alpine"/><div className="terrain terrain-forest"/><div className="terrain terrain-desert"/>
          <div className="journey-header"><span>NESED / CINEMATIC MARKET</span><b>LIVE INVENTORY · NEW YORK</b></div>
          <div className="journey-copy">
            <article><small>CHAPTER 01 · IGNITION</small><h1>Find the car.<br/><em>Feel the road.</em></h1><p>The entire market, transformed into one continuous drive.</p></article>
            <article><small>CHAPTER 02 · COAST</small><h2>Turn through<br/><em>every possibility.</em></h2><p>Search hundreds of thousands of dealer listings without losing the feeling.</p></article>
            <article><small>CHAPTER 03 · APEX</small><h2>Data becomes<br/><em>direction.</em></h2><p>Price, mileage and distance move with the car—not against it.</p></article>
            <article><small>CHAPTER 04 · ARRIVAL</small><h2>One road.<br/><em>Your car.</em></h2><p>From discovery to the original dealer page in a single clean handoff.</p></article>
          </div>
          <div className="journey-search"><label><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search make, model, year or fuel" aria-label="Search vehicles"/></label><button onClick={()=>document.getElementById("inventory")?.scrollIntoView()}>Search the road <span>↗</span></button></div>
          <div className="journey-hud"><span>{String(phase+1).padStart(2,"0")} / 04</span><i><b style={{width:`${journey*100}%`}}/></i><span>{["IGNITION","COAST","APEX","ARRIVAL"][phase]}</span></div>
          <div className="road-marker"><span>SCROLL TO DRIVE</span><i/></div>
        </div>
      </section>

      <section className="live-ribbon"><span><i/> {dataMode==="live"?"LIVE PROVIDER CONNECTED":dataMode==="error"?"PROVIDER OFFLINE":"CONNECTING"}</span><b>{total?.toLocaleString()||"—"} VEHICLES IN RANGE</b><em>REAL PHOTOS · ORIGINAL DEALER LINKS</em></section>

      <section className="collection" id="collection"><header><small>CURATED FROM THE LIVE FEED</small><h2>Different roads.<br/><em>Different machines.</em></h2><p>One cinematic chapter per model. Repeated trims stay grouped instead of flooding the page.</p></header>{showcase.map((car,i)=><article className={`vehicle-chapter chapter-${i}`} key={car.id}><div className="chapter-image"><img src={car.image} alt={`${car.year} ${car.make} ${car.model} dealer photo`}/><div className="chapter-wash"/></div><div className="chapter-index">0{i+1}</div><div className="chapter-copy"><span>{car.year} · {car.fuel} · {car.miles.toLocaleString()} MI</span><h3>{car.make}<br/><em>{car.model}</em></h3><p>{car.location} · via {car.source}</p><div><b>{money(car.price)}</b>{car.url?<a href={car.url} target="_blank" rel="noreferrer">Drive to dealer ↗</a>:<span>Dealer link pending</span>}</div></div></article>)}</section>

      <section className="market" id="inventory"><div className="market-head"><div><small>THE LIVE MARKET</small><h2>Choose your<br/><em>next road.</em></h2></div><p>{query?`Live results for “${query}”.`:"A diverse view of live models. Search a specific vehicle to reveal every available trim."}</p></div>
        <div className="market-search"><label><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Try “2025 Porsche Taycan”" aria-label="Search live inventory"/></label><button>{searching?"Searching…":"Live search"}</button></div>
        <div className="market-tools"><div>{["All","Electric","Hybrid","Gas"].map(x=><button key={x} className={fuel===x?"active":""} onClick={()=>setFuel(x)}>{x}</button>)}</div><span>{query?`${filtered.length} loaded results`:`${diverse.length} distinct models loaded`}</span><select value={sort} onChange={e=>setSort(e.target.value)}><option value="recommended">Recently updated</option><option value="year">Newest model year</option><option value="price">Lowest price</option><option value="miles">Lowest mileage</option></select></div>
        <div className="model-grid">{diverse.map((car,i)=><article className="model-card" key={car.id} style={{"--delay":`${Math.min(i,12)*55}ms`} as React.CSSProperties}><div className="model-media">{car.image?<img src={car.image} alt={`${car.year} ${car.make} ${car.model} dealer photo`}/>:<div className="model-placeholder">PHOTO<br/>PENDING</div>}<div className="verified-seal" aria-label="Verified provider listing"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.2 4L19 7.5"/></svg><span>LIVE</span></div><button className={`model-save ${saved.includes(car.id)?"on":""}`} onClick={()=>save(car.id)} aria-label="Save vehicle">{saved.includes(car.id)?"♥":"♡"}</button><span className="model-number">{String(i+1).padStart(2,"0")}</span></div><div className="model-body"><small>{car.year} · {car.trim||car.fuel}</small><h3>{car.make} <em>{car.model}</em></h3><div className="model-price"><b>{money(car.price)}</b><span>{money(car.monthly)}/mo est.</span></div><div className="model-facts"><span>{car.miles.toLocaleString()} mi</span><span>{car.location}</span></div>{car.url?<a className="dealer-button" href={car.url} target="_blank" rel="noreferrer"><span>Open original listing</span><b>↗</b></a>:<span className="dealer-button disabled">Dealer link unavailable</span>}</div></article>)}</div>
        {!searching&&!diverse.length&&<div className="market-empty"><h3>No exact live match.</h3><p>Try another make, model, year or remove a filter.</p><button onClick={()=>{setQuery("");setFuel("All")}}>Reset the route</button></div>}
        {hasMore&&<button className="load-road" onClick={loadMore} disabled={searching}><span>{searching?"Loading the next stretch…":"Load 20 more live listings"}</span><i>→</i></button>}
      </section>

      <section className="final-road"><div><small>THE ROAD IS OPEN</small><h2>Stop searching.<br/><em>Start moving.</em></h2></div><a href="#top">Return to ignition ↗</a></section>
    </main>
    <footer className="cinematic-footer"><a className="brand" href="#top"><span className="logo-mark">N</span><span>NESED</span></a><p>Live automotive discovery, without the noise.</p><span>© 2026 · POWERED BY LIVE PROVIDER DATA</span></footer>
  </>;
}
