import React, { useState, useRef, useCallback } from 'react';
import { rels, tAr, tEn, sAr, dAr, dEn } from './data';

interface RelType { gender: string; call: string; idx: number }

function fill(text: string, r: RelType): string {
  const m = r.gender === 'm';
  return text.replace(/\{\{R\}\}/g, r.call).replace(/\{\{PF\}\}/g, 'ل'+r.call).replace(/\{\{H\}\}/g, m?'ه':'ها').replace(/\{\{HM\}\}/g, m?'ه':'ها').replace(/\{\{KN\}\}/g, m?'كان':'كانت').replace(/\{\{RE\}\}/g, rels[r.idx].cf).replace(/\{\{HM_EN\}\}/g, m?'him':'them').replace(/\{\{H_EN\}\}/g, m?'his':'their');
}

export default function App() {
  const [lang, setLang] = useState<'ar'|'en'>('ar');
  const [dark, setDark] = useState(false);
  const [relIdx, setRelIdx] = useState(0);
  const [male, setMale] = useState(true);
  const [show, setShow] = useState(false);
  const [pidx, setPidx] = useState(-1);
  const [pall, setPall] = useState(false);
  const [prog, setProg] = useState<Record<number,number>>({});
  const [shIdx, setShIdx] = useState<number|null>(null);
  const [copied, setCopied] = useState(false);
  const timer = useRef<any>(null);
  const qi = useRef(0);

  const getR = useCallback((): RelType => { const v=rels[relIdx].v.split('|'); return {gender:v[0],call:v[1],idx:relIdx}; }, [relIdx]);

  const stop = useCallback(() => {
    try{speechSynthesis.cancel()}catch{}
    if(timer.current){clearInterval(timer.current);timer.current=null}
    setPall(false); setPidx(-1); setProg({});
  }, []);

  const playOne = useCallback((i:number) => {
    stop(); setPidx(i); setProg(p=>({...p,[i]:0}));
    const r=getR(), m=r.gender==='m';
    const arT='اللهم اغفر '+r.call+' وارحم'+(m?'ه':'ها')+'. '+fill(dAr[i],r);
    const enT='O Allah, forgive '+rels[r.idx].cf+' and have mercy on '+(m?'him':'them')+'. '+fill(dEn[i],r);
    let p=0;
    timer.current=setInterval(()=>{if(p<48){p+=0.6;setProg(pp=>({...pp,[i]:p}))}},100);
    const sp=(t:string,l:string,pt:number,cb:()=>void)=>{
      const u=new SpeechSynthesisUtterance(t);u.lang=l;u.rate=0.82;u.pitch=pt;
      let d=false;const f=()=>{if(!d){d=true;cb()}};u.onend=f;u.onerror=f;
      speechSynthesis.speak(u);setTimeout(f,25000);
    };
    sp(arT,'ar-SA',male?0.5:1.15,()=>{
      setProg(p=>({...p,[i]:50}));
      sp(enT,'en-US',male?0.65:1.25,()=>{
        setProg(p=>({...p,[i]:100}));
        setTimeout(()=>{
          if(timer.current){clearInterval(timer.current);timer.current=null}
          setPidx(-1); setProg(p=>({...p,[i]:0}));
          setPall(pa=>{if(pa){qi.current++;if(qi.current<20)playOne(qi.current);else return false}return pa});
        },300);
      });
    });
  },[getR,stop,male]);

  const playAll=()=>{if(pall){stop();return}if(!show)setShow(true);setPall(true);qi.current=0;playOne(0)};
  const toggle=(i:number)=>{if(pidx===i){stop();return}playOne(i)};

  const shareText=(i:number)=>{
    const r=getR(),m=r.gender==='m';
    return '🤲 اللهم اغفر '+r.call+' وارحم'+(m?'ه':'ها')+'\n\n'+fill(dAr[i],r)+'\n\n── '+tAr[i]+' ──\n\n🇬🇧 O Allah, forgive '+rels[r.idx].cf+' and have mercy on '+(m?'him':'them')+'. '+fill(dEn[i],r)+'\n\n✨ نفحات الرحمة';
  };

  const doCopy=()=>{
    if(shIdx===null)return;
    const t=shareText(shIdx);
    navigator.clipboard.writeText(t).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000)}).catch(()=>{
      const a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();document.execCommand('copy');document.body.removeChild(a);
      setCopied(true);setTimeout(()=>setCopied(false),2000);
    });
  };

  const r=getR(), m=r.gender==='m', pf='ل'+r.call;
  const css=(v:string)=>v.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const hl=(t:string)=>t.replace(new RegExp(css(pf),'g'),'<span class="pf">'+pf+'</span>').replace(new RegExp(css(r.call),'g'),'<span class="hl">'+r.call+'</span>');
  const bg=dark?'#0a0a0a':'#0b3d2e', card=dark?'#181818':'#fdfaf3', txt=dark?'#e4e4d8':'#1a2e25', gold=dark?'#d4a843':'#c9a84c', acc=dark?'#1a5a42':'#0b3d2e', brd=dark?'#2a2a20':'#ddd0a8', dub=dark?'#1a1a18':'#fff', mut=dark?'#6a6a5a':'#8a8a7a';

  return (
    <div style={{fontFamily:"'Noto Naskh Arabic','Amiri',serif",background:bg,minHeight:'100vh',maxWidth:460,margin:'0 auto',padding:'12px 10px 30px',direction:lang==='ar'?'rtl':'ltr'}}>
      <div style={{background:`linear-gradient(135deg,${dark?'#142820':'#0b3d2e'},${dark?'#0d4a3a':'#0d5c4a'})`,borderRadius:20,padding:'30px 20px 24px',textAlign:'center',marginBottom:12,boxShadow:'0 20px 60px rgba(0,0,0,.35)'}}>
        <h1 style={{fontFamily:'Amiri,serif',fontSize:28,color:'#e8c95a'}}>{lang==='ar'?'نَفَحَاتُ الرَّحْمَةِ':'Nafahat Al-Rahma'}</h1>
        <p style={{fontSize:12,color:'#a8d5ba',marginTop:6}}>{lang==='ar'?'الصَّدَقَةُ الجَارِيَةُ عَلَى أَرْوَاحِ الْمُسْلِمِينَ':'Ongoing Charity for Muslims'}</p>
        <div style={{marginTop:12,fontFamily:'Amiri,serif',fontSize:16,color:gold,opacity:.9}}>{lang==='ar'?'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ':'In the Name of Allah'}</div>
      </div>

      <div style={{background:card,borderRadius:16,padding:16,marginBottom:10,border:'1px solid '+brd}}>
        <div style={{display:'flex',gap:8,justifyContent:'center',marginBottom:12}}>
          {[['ar','🇸🇦 عربي'],['en','🇬🇧 English']].map(([l,t])=><button key={l} onClick={()=>setLang(l as any)} style={{padding:'6px 14px',border:'1.5px solid '+(lang===l?acc:brd),borderRadius:20,background:lang===l?acc:card,color:lang===l?'#fff':txt,fontSize:12,cursor:'pointer',fontWeight:600,fontFamily:'inherit'}}>{t}</button>)}
          <button onClick={()=>setDark(!dark)} style={{padding:'6px 14px',border:'1.5px solid '+brd,borderRadius:20,background:card,fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>{dark?'☀️':'🌙'}</button>
        </div>
        <div style={{fontSize:12,fontWeight:700,color:gold,marginBottom:8}}>{lang==='ar'?'🔗 صلة القرابة':'🔗 Kinship'}</div>
        <select value={relIdx} onChange={e=>setRelIdx(+e.target.value)} style={{width:'100%',padding:'12px 14px',border:'2px solid '+brd,borderRadius:12,fontSize:15,fontFamily:'inherit',background:dark?'#222':'#fff',color:txt,cursor:'pointer',direction:'rtl',textAlign:'right'}}>
          {rels.map((rl,i)=><option key={i} value={i}>{lang==='ar'?'اللهم اغفر ل'+rl.ar:rl.en}</option>)}
        </select>
      </div>

      <div style={{background:card,borderRadius:16,padding:16,marginBottom:10,border:'1px solid '+brd}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:12}}>
          <span style={{fontSize:11,color:male?txt:mut,fontWeight:male?700:500}}>{lang==='ar'?'♂ رجل':'♂ Male'}</span>
          <button onClick={()=>setMale(!male)} style={{width:58,height:30,borderRadius:15,cursor:'pointer',border:'none',background:male?'linear-gradient(135deg,#2a9d8f,#1a8d7f)':'linear-gradient(135deg,#e07a5f,#d06040)',position:'relative',transition:'.3s'}}>
            <div style={{width:26,height:26,background:'#fff',borderRadius:'50%',position:'absolute',top:2,left:male?30:2,transition:'.3s',boxShadow:'0 2px 6px rgba(0,0,0,.2)'}}/>
          </button>
          <span style={{fontSize:11,color:!male?txt:mut,fontWeight:!male?700:500}}>{lang==='ar'?'♀ أنثى':'♀ Female'}</span>
          <span style={{fontSize:16}}>🔊</span>
        </div>
      </div>

      <div style={{background:card,borderRadius:16,padding:16,marginBottom:10,border:'1px solid '+brd}}>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>{setShow(true);stop()}} style={{flex:1,padding:12,border:'none',borderRadius:12,fontSize:14,fontWeight:700,cursor:'pointer',background:`linear-gradient(135deg,${acc},#1a7a5a)`,color:'#fff',fontFamily:'inherit'}}>{lang==='ar'?'🤲 ادعُ الآن':'🤲 Pray Now'}</button>
          <button onClick={playAll} style={{flex:1,padding:12,border:'none',borderRadius:12,fontSize:14,fontWeight:700,cursor:'pointer',background:pall?'linear-gradient(135deg,#c0392b,#e74c3c)':'linear-gradient(135deg,#8B6914,'+gold+')',color:'#fff',fontFamily:'inherit'}}>{pall?(lang==='ar'?'⏹ توقف':'⏹ Stop'):(lang==='ar'?'🔊 اقرأ الكل':'🔊 Read All')}</button>
        </div>
        {pidx>=0&&<div style={{marginTop:8}}><button onClick={stop} style={{width:'100%',padding:12,border:'none',borderRadius:12,fontSize:14,fontWeight:700,cursor:'pointer',background:'linear-gradient(135deg,#c0392b,#e74c3c)',color:'#fff',fontFamily:'inherit'}}>{lang==='ar'?'⏹ توقف':'⏹ Stop'}</button></div>}
      </div>

      {show&&<div>
        <div style={{textAlign:'center',padding:10,marginBottom:12,border:'2px solid '+gold,borderRadius:12,background:`linear-gradient(135deg,rgba(201,168,76,.05),rgba(201,168,76,.02))`}}>
          <small style={{fontSize:10,color:gold,display:'block'}}>{lang==='ar'?'الصدقة الجارية على':'Ongoing charity for'}</small>
          <b style={{fontFamily:'Amiri,serif',fontSize:22,color:gold,display:'block',marginTop:2}}>{lang==='ar'?r.call:rels[r.idx].cf}</b>
        </div>
        {Array.from({length:20},(_,i)=>{
          const playing=pidx===i;
          return <div key={i} style={{marginBottom:10,border:'1.5px solid '+(playing?gold:brd),borderRadius:14,overflow:'hidden',background:dub,position:'relative',boxShadow:playing?'0 0 0 3px rgba(201,168,76,.25)':'none'}}>
            <div style={{background:`linear-gradient(135deg,${acc},${dark?'#0d4a3a':'#0d5c4a'})`,padding:'8px 12px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontFamily:'Amiri,serif',fontSize:13,fontWeight:700,color:'#e8c95a'}}>{lang==='ar'?tAr[i]:tEn[i]}</span>
              <div style={{display:'flex',gap:6,alignItems:'center'}}>
                <button onClick={()=>toggle(i)} style={{width:32,height:32,borderRadius:'50%',border:'none',cursor:'pointer',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:14,background:playing?'linear-gradient(135deg,#c0392b,#e74c3c)':`linear-gradient(135deg,${acc},#1a7a5a)`,color:'#fff'}}>{playing?'⏸':'▶'}</button>
                <button onClick={()=>setShIdx(i)} style={{width:32,height:32,borderRadius:'50%',border:'none',cursor:'pointer',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:14,background:'linear-gradient(135deg,#6b3fa0,#9b59b6)',color:'#fff'}}>📤</button>
                <span style={{background:gold,color:acc,width:22,height:22,borderRadius:'50%',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700}}>{i+1}</span>
              </div>
            </div>
            <div style={{padding:12,fontFamily:'Amiri,serif',fontSize:15,lineHeight:2.4,color:txt,textAlign:'center'}}>
              <span dangerouslySetInnerHTML={{__html:hl(fill(dAr[i],r))}}/>
              <div style={{fontFamily:'Inter,sans-serif',fontSize:12,lineHeight:1.8,color:mut,borderTop:'1px dashed '+brd,marginTop:10,paddingTop:8,textAlign:'left',direction:'ltr'}}>
                <span style={{display:'inline-block',fontSize:8,padding:'1px 5px',borderRadius:8,fontWeight:700,background:'#2a6b9f',color:'#fff',marginRight:4}}>EN</span> {fill(dEn[i],r)}
              </div>
            </div>
            <div style={{padding:'6px 12px',fontSize:9,color:mut,borderTop:'1px solid '+brd}}><span>{sAr[i]}</span></div>
            <div style={{height:3,background:brd,position:'absolute',bottom:0,left:0,right:0}}><div style={{height:'100%',background:`linear-gradient(90deg,${gold},#e8c95a)`,width:(prog[i]||0)+'%',transition:'width .2s',borderRadius:'0 2px 2px 0'}}/></div>
          </div>;
        })}
      </div>}

      <div style={{textAlign:'center',padding:12,fontSize:9,color:mut,marginTop:8}}>{lang==='ar'?'نفحات الرحمة ✨':'Nafahat Al-Rahma ✨'}</div>

      {shIdx!==null&&<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:9999,display:'flex',justifyContent:'center',alignItems:'center',padding:20}} onClick={()=>setShIdx(null)}>
        <div style={{background:card,borderRadius:20,padding:24,maxWidth:360,width:'100%',boxShadow:'0 20px 60px rgba(0,0,0,.4)',border:'2px solid '+gold}} onClick={e=>e.stopPropagation()}>
          <h3 style={{fontFamily:'Amiri,serif',fontSize:18,color:gold,textAlign:'center',marginBottom:16}}>{lang==='ar'?'📤 مشاركة الدعاء':'📤 Share Dua'}</h3>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10,marginBottom:12}}>
            {[
              ['💬','واتساب','wa','https://wa.me/?text='+encodeURIComponent(shareText(shIdx))],
              ['✈️','تيليجرام','tg','https://t.me/share/url?url='+encodeURIComponent(location.href)+'&text='+encodeURIComponent(shareText(shIdx))],
              ['🐦','تويتر','tw','https://twitter.com/intent/tweet?text='+encodeURIComponent(shareText(shIdx).substring(0,240))],
              ['📘','فيسبوك','fb','https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(location.href)],
            ].map(([ic,nm,tp,ur])=><a key={tp} href={ur} target="_blank" rel="noopener" style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6,padding:'16px 8px',border:'2px solid '+brd,borderRadius:14,background:dub,textDecoration:'none',color:txt,cursor:'pointer',transition:'.2s'}}>
              <span style={{fontSize:28}}>{ic}</span><span style={{fontSize:13,fontWeight:700}}>{nm}</span>
            </a>)}
          </div>
          <button onClick={doCopy} style={{width:'100%',padding:12,border:'2px solid '+brd,borderRadius:12,background:dub,cursor:'pointer',fontSize:14,fontWeight:700,color:txt,fontFamily:'inherit',marginBottom:10}}>{copied?(lang==='ar'?'✅ تم النسخ!':'✅ Copied!'):(lang==='ar'?'📋 نسخ النص':'📋 Copy')}</button>
          <button onClick={()=>setShIdx(null)} style={{width:'100%',padding:10,border:'none',borderRadius:10,background:brd,color:txt,fontSize:13,cursor:'pointer',fontWeight:600,fontFamily:'inherit'}}>✖ {lang==='ar'?'إغلاق':'Close'}</button>
        </div>
      </div>}
    </div>
  );
}
