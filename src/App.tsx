import React, { useState, useEffect, useRef, useCallback } from 'react';
import { rels, tAr, tEn, sAr, dAr, dEn } from './data';

interface RelType { gender: string; call: string; idx: number }

function fill(text: string, r: RelType): string {
  const m = r.gender === 'm';
  return text
    .replace(/\{\{R\}\}/g, r.call)
    .replace(/\{\{PF\}\}/g, 'ل' + r.call)
    .replace(/\{\{H\}\}/g, m ? 'ه' : 'ها')
    .replace(/\{\{HM\}\}/g, m ? 'ه' : 'ها')
    .replace(/\{\{KN\}\}/g, m ? 'كان' : 'كانت')
    .replace(/\{\{RE\}\}/g, rels[r.idx].cf)
    .replace(/\{\{HM_EN\}\}/g, m ? 'him' : 'them')
    .replace(/\{\{H_EN\}\}/g, m ? 'his' : 'their');
}

export default function App() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [isDark, setIsDark] = useState(false);
  const [relIdx, setRelIdx] = useState(0);
  const [voiceIsMale, setVoiceIsMale] = useState(true);
  const [showOutput, setShowOutput] = useState(false);
  const [playingIdx, setPlayingIdx] = useState(-1);
  const [playingAll, setPlayingAll] = useState(false);
  const [progress, setProgress] = useState<Record<number, number>>({});
  const [shareIdx, setShareIdx] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const timerRef = useRef<number | null>(null);
  const qiRef = useRef(0);

  const getRel = useCallback((): RelType => {
    const v = rels[relIdx].v.split('|');
    return { gender: v[0], call: v[1], idx: relIdx };
  }, [relIdx]);

  const stopAll = useCallback(() => {
    try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch {}
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setPlayingAll(false);
    setPlayingIdx(-1);
    setProgress({});
  }, []);

  const finishDua = useCallback((i: number) => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setPlayingIdx(-1);
    setProgress(p => ({ ...p, [i]: 0 }));
    setPlayingAll(pa => {
      if (pa) {
        qiRef.current++;
        if (qiRef.current < 20) {
          setTimeout(() => playDuaByIdx(qiRef.current), 300);
        } else {
          return false;
        }
      }
      return pa;
    });
  }, []);

  const playDuaByIdx = useCallback((i: number) => {
    stopAll();
    setPlayingIdx(i);
    setProgress(p => ({ ...p, [i]: 0 }));

    const r = getRel();
    const m = r.gender === 'm';
    const arBody = fill(dAr[i], r);
    const enBody = fill(dEn[i], r);
    const arText = 'اللهم اغفر ' + r.call + ' وارحم' + (m ? 'ه' : 'ها') + '. ' + arBody;
    const enText = 'O Allah, forgive ' + rels[r.idx].cf + ' and have mercy on ' + (m ? 'him' : 'them') + '. ' + enBody;

    let prog = 0;
    timerRef.current = window.setInterval(() => {
      if (prog < 48) { prog += 0.6; setProgress(p => ({ ...p, [i]: prog })); }
    }, 100);

    const speak = (text: string, langCode: string, pitch: number, cb: () => void) => {
      if (!window.speechSynthesis) { cb(); return; }
      const u = new SpeechSynthesisUtterance(text);
      u.lang = langCode; u.rate = 0.82; u.pitch = pitch;
      let done = false;
      const fin = () => { if (!done) { done = true; cb(); } };
      u.onend = fin; u.onerror = fin;
      speechSynthesis.speak(u);
      setTimeout(fin, 25000);
    };

    const arP = voiceIsMale ? 0.5 : 1.15;
    const enP = voiceIsMale ? 0.65 : 1.25;
    speak(arText, 'ar-SA', arP, () => {
      setProgress(p => ({ ...p, [i]: 50 }));
      speak(enText, 'en-US', enP, () => {
        setProgress(p => ({ ...p, [i]: 100 }));
        setTimeout(() => finishDua(i), 300);
      });
    });
  }, [getRel, stopAll, finishDua, voiceIsMale]);

  const toggleDua = (i: number) => {
    if (playingIdx === i) { stopAll(); return; }
    playDuaByIdx(i);
  };

  const playAll = () => {
    if (playingAll) { stopAll(); return; }
    if (!showOutput) setShowOutput(true);
    setPlayingAll(true);
    qiRef.current = 0;
    playDuaByIdx(0);
  };

  const shareDua = (i: number) => {
    setShareIdx(i);
    setCopied(false);
  };

  const getShareText = (i: number) => {
    const r = getRel();
    const m = r.gender === 'm';
    const arBody = fill(dAr[i], r);
    const enBody = fill(dEn[i], r);
    const title = tAr[i];
    const call = r.call, callEn = rels[r.idx].cf;
    const prefix = '🤲 اللهم اغفر ' + call + ' وارحم' + (m ? 'ه' : 'ها');
    return prefix + '\n\n' + arBody + '\n\n── ' + title + ' ──\n\n🇬🇧 O Allah, forgive ' + callEn + ' and have mercy on ' + (m ? 'him' : 'them') + '. ' + enBody + '\n\n✨ نفحات الرحمة — الصدقة الجارية';
  };

  const copyText = () => {
    if (shareIdx === null) return;
    const text = getShareText(shareIdx);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const r = getRel();
  const m = r.gender === 'm';
  const pf = 'ل' + r.call;
  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';

  const hlText = (text: string) => {
    const escCall = r.call.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escPf = pf.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text
      .replace(new RegExp(escPf, 'g'), '<span class="pf">' + pf + '</span>')
      .replace(new RegExp(escCall, 'g'), '<span class="hl">' + r.call + '</span>');
  };

  return (
    <div className={'app' + (isDark ? ' dark' : '')} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box}
        .app{font-family:'Noto Naskh Arabic','Amiri',serif;background:${isDark ? '#0a0a0a' : '#0b3d2e'};min-height:100vh;max-width:460px;margin:0 auto;padding:12px 10px 30px;position:relative}
        .app:not([dir="rtl"]){font-family:'Inter','Noto Naskh Arabic',sans-serif}
        :root{--bg:${isDark ? '#0a0a0a' : '#0b3d2e'};--card:${isDark ? '#181818' : '#fdfaf3'};--text:${isDark ? '#e4e4d8' : '#1a2e25'};--gold:${isDark ? '#d4a843' : '#c9a84c'};--gold2:${isDark ? '#e8c060' : '#e8c95a'};--accent:${isDark ? '#1a5a42' : '#0b3d2e'};--accent2:${isDark ? '#1e6b50' : '#145a43'};--border:${isDark ? '#2a2a20' : '#ddd0a8'};--muted:${isDark ? '#6a6a5a' : '#8a8a7a'};--input-bg:${isDark ? '#222' : '#fff'};--dua-bg:${isDark ? '#1a1a18' : '#fff'};--hl-bg:rgba(201,168,76,.12);--shadow:0 20px 60px rgba(0,0,0,.35)}
        .hero{background:linear-gradient(135deg,${isDark ? '#142820' : '#0b3d2e'},${isDark ? '#0d4a3a' : '#0d5c4a'},${isDark ? '#163028' : '#145a43'});border-radius:20px;padding:30px 20px 24px;text-align:center;margin-bottom:12px;box-shadow:var(--shadow)}
        .hero h1{font-family:'Amiri',serif;font-size:28px;color:var(--gold2);text-shadow:0 2px 10px rgba(0,0,0,.3)}
        .hero p{font-size:12px;color:#a8d5ba;margin-top:6px;letter-spacing:1px}
        .bism{margin-top:12px;font-family:'Amiri',serif;font-size:16px;color:var(--gold);opacity:.9}
        .sec{background:var(--card);border-radius:16px;padding:16px;margin-bottom:10px;box-shadow:0 4px 20px rgba(0,0,0,.08);border:1px solid var(--border)}
        .tbar{display:flex;gap:8px;justify-content:center;margin-bottom:12px}
        .tb{padding:6px 14px;border:1.5px solid var(--border);border-radius:20px;background:var(--card);color:var(--text);font-size:12px;font-family:inherit;cursor:pointer;font-weight:600;transition:.2s}
        .tb:hover{border-color:var(--gold);color:var(--gold)}
        .tb.on{background:var(--accent);color:#fff;border-color:var(--accent)}
        .sec-lbl{font-size:12px;font-weight:700;color:${isDark ? '#d4a843' : '#0b3d2e'};margin-bottom:8px}
        select{width:100%;padding:12px 14px;border:2px solid var(--border);border-radius:12px;font-size:15px;font-family:inherit;background:var(--input-bg);color:var(--text);cursor:pointer;direction:rtl;text-align:right;transition:.3s}
        select:focus{border-color:var(--gold);outline:none}
        .voice-row{display:flex;align-items:center;justify-content:center;gap:12px}
        .vlbl{font-size:11px;color:var(--muted);transition:.2s;font-weight:500}.vlbl.on{color:var(--text);font-weight:700}
        .vtog{width:58px;height:30px;border-radius:15px;cursor:pointer;position:relative;border:none;outline:none;transition:.3s;background:linear-gradient(135deg,${voiceIsMale ? '#2a9d8f,#1a8d7f' : '#e07a5f,#d06040'})}
        .vknob{width:26px;height:26px;background:#fff;border-radius:50%;position:absolute;top:2px;transition:.3s cubic-bezier(.68,-.55,.27,1.55);box-shadow:0 2px 6px rgba(0,0,0,.2);left:${voiceIsMale ? '30px' : '2px'}}
        .btns{display:flex;gap:8px}
        .btn{flex:1;padding:12px;border:none;border-radius:12px;font-size:14px;font-family:inherit;font-weight:700;cursor:pointer;transition:.25s;text-align:center}
        .btn:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.2)}
        .btn-go{background:linear-gradient(135deg,var(--accent),#1a7a5a);color:#fff}
        .btn-all{background:linear-gradient(135deg,#8B6914,var(--gold));color:#fff}
        .btn-all.on{background:linear-gradient(135deg,#c0392b,#e74c3c)}
        .btn-stop{background:linear-gradient(135deg,#c0392b,#e74c3c);color:#fff}
        .soul-box{text-align:center;padding:10px;margin-bottom:12px;border:2px solid var(--gold);border-radius:12px;background:linear-gradient(135deg,rgba(201,168,76,.05),rgba(201,168,76,.02))}
        .soul-box small{font-size:10px;color:${isDark ? '#d4a843' : '#0b3d2e'};display:block}
        .soul-box b{font-family:'Amiri',serif;font-size:22px;color:${isDark ? '#d4a843' : '#0b3d2e'};display:block;margin-top:2px}
        .dua{margin-bottom:10px;border:1.5px solid var(--border);border-radius:14px;overflow:hidden;background:var(--dua-bg);transition:.3s;position:relative}
        .dua:hover{transform:translateY(-2px);box-shadow:0 8px 25px rgba(0,0,0,.1)}
        .dua.playing{border-color:var(--gold);box-shadow:0 0 0 3px rgba(201,168,76,.25);animation:pg 1.5s infinite}
        @keyframes pg{0%,100%{box-shadow:0 0 0 3px rgba(201,168,76,.25)}50%{box-shadow:0 0 0 5px rgba(201,168,76,.35)}}
        .dua-head{background:linear-gradient(135deg,var(--accent),${isDark ? '#0d4a3a' : '#0d5c4a'});padding:8px 12px;display:flex;justify-content:space-between;align-items:center}
        .dua-title{font-family:'Amiri',serif;font-size:13px;font-weight:700;color:var(--gold2)}
        .dua-num{background:var(--gold);color:var(--accent);width:22px;height:22px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:700}
        .dua-body{padding:12px;font-family:'Amiri',serif;font-size:15px;line-height:2.4;color:var(--text);text-align:center}
        .dua-body .hl{color:var(--accent);font-weight:700;text-decoration:underline;text-decoration-color:var(--gold);text-underline-offset:4px}
        .dua-body .pf{color:#8B6914;font-weight:700;background:var(--hl-bg);padding:2px 6px;border-radius:4px}
        .en-line{font-family:'Inter',sans-serif;font-size:12px;line-height:1.8;color:var(--muted);border-top:1px dashed var(--border);margin-top:10px;padding-top:8px;text-align:left;direction:ltr}
        .ltag{display:inline-block;font-size:8px;padding:1px 5px;border-radius:8px;font-weight:700;background:#2a6b9f;color:#fff;margin-right:4px}
        .dua-foot{padding:6px 12px;font-size:9px;color:var(--muted);border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center}
        .dua-prog{height:3px;background:var(--border);position:absolute;bottom:0;left:0;right:0}
        .dua-prog .bar{height:100%;background:linear-gradient(90deg,var(--gold),var(--gold2));transition:width .2s;border-radius:0 2px 2px 0}
        .dua-acts{display:flex;gap:6px;align-items:center}
        .dbtn{width:32px;height:32px;border-radius:50%;border:none;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;font-size:14px;transition:.2s}
        .dbtn:hover{transform:scale(1.1)}
        .dbtn-play{background:linear-gradient(135deg,var(--accent),#1a7a5a);color:#fff}
        .dbtn-play.on{background:linear-gradient(135deg,#c0392b,#e74c3c);animation:pls 1s infinite}
        @keyframes pls{0%,100%{opacity:1}50%{opacity:.6}}
        .dbtn-sh{background:linear-gradient(135deg,#6b3fa0,#9b59b6);color:#fff}
        .foot{text-align:center;padding:12px;font-size:9px;color:var(--muted);margin-top:8px}
        .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;justify-content:center;align-items:center;padding:20px}
        .modal{background:${isDark ? '#181818' : '#fdfaf3'};border-radius:20px;padding:24px;max-width:360px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.4);border:2px solid var(--gold)}
        .modal h3{font-family:'Amiri',serif;font-size:18px;color:${isDark ? '#d4a843' : '#0b3d2e'};text-align:center;margin-bottom:16px}
        .sh-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:12px}
        .sh-btn{display:flex;flex-direction:column;align-items:center;gap:6px;padding:16px 8px;border:2px solid var(--border);border-radius:14px;background:var(--dua-bg);text-decoration:none;color:var(--text);transition:.2s;font-family:inherit}
        .sh-btn:hover{transform:translateY(-2px);box-shadow:0 4px 15px rgba(0,0,0,.15)}
        .sh-btn .sh-icon{font-size:28px}
        .sh-btn .sh-name{font-size:13px;font-weight:700}
        .sh-btn.wa:hover{background:#25D366!important;color:#fff!important;border-color:#25D366!important}
        .sh-btn.tg:hover{background:#0088cc!important;color:#fff!important;border-color:#0088cc!important}
        .sh-btn.tw:hover{background:#1DA1F2!important;color:#fff!important;border-color:#1DA1F2!important}
        .sh-btn.fb:hover{background:#1877F2!important;color:#fff!important;border-color:#1877F2!important}
        .copy-btn{width:100%;padding:12px;border:2px solid var(--border);border-radius:12px;background:var(--dua-bg);cursor:pointer;font-family:inherit;font-size:14px;font-weight:700;color:var(--text);margin-bottom:10px;transition:.2s}
        .copy-btn:hover{background:var(--accent)!important;color:#fff!important}
        .close-btn{width:100%;padding:10px;border:none;border-radius:10px;background:var(--border);color:var(--text);font-family:inherit;font-size:13px;cursor:pointer;font-weight:600}
      `}</style>

      <div className="hero">
        <h1>{lang === 'ar' ? 'نَفَحَاتُ الرَّحْمَةِ' : 'Nafahat Al-Rahma'}</h1>
        <p>{lang === 'ar' ? 'الصَّدَقَةُ الجَارِيَةُ عَلَى أَرْوَاحِ الْمُسْلِمِينَ' : 'Ongoing Charity for the Souls of Muslims'}</p>
        <div className="bism">{lang === 'ar' ? 'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ' : 'In the Name of Allah, the Most Gracious, the Most Merciful'}</div>
      </div>

      <div className="sec">
        <div className="tbar">
          <button className={'tb' + (lang === 'ar' ? ' on' : '')} onClick={() => setLang('ar')}>🇸🇦 عربي</button>
          <button className={'tb' + (lang === 'en' ? ' on' : '')} onClick={() => setLang('en')}>🇬🇧 English</button>
          <button className="tb" onClick={() => setIsDark(!isDark)}>{isDark ? '☀️' : '🌙'}</button>
        </div>
        <div className="sec-lbl">{lang === 'ar' ? '🔗 صلة القرابة' : '🔗 Kinship'}</div>
        <select value={relIdx} onChange={e => { setRelIdx(+e.target.value); if (showOutput) setShowOutput(true); }}>
          {rels.map((r, i) => <option key={i} value={i}>{lang === 'ar' ? 'اللهم اغفر ل' + r.ar : r.en}</option>)}
        </select>
      </div>

      <div className="sec">
        <div className="voice-row">
          <span className={'vlbl' + (voiceIsMale ? ' on' : '')}>{lang === 'ar' ? '♂ رجل' : '♂ Male'}</span>
          <button className="vtog" onClick={() => setVoiceIsMale(!voiceIsMale)}><div className="vknob" /></button>
          <span className={'vlbl' + (!voiceIsMale ? ' on' : '')}>{lang === 'ar' ? '♀ أنثى' : '♀ Female'}</span>
          <span style={{ fontSize: 16 }}>🔊</span>
        </div>
      </div>

      <div className="sec">
        <div className="btns">
          <button className="btn btn-go" onClick={() => { setShowOutput(true); stopAll(); }}>{lang === 'ar' ? '🤲 ادعُ الآن' : '🤲 Pray Now'}</button>
          <button className={'btn btn-all' + (playingAll ? ' on' : '')} onClick={playAll}>
            {playingAll ? (lang === 'ar' ? '⏹ توقف' : '⏹ Stop') : (lang === 'ar' ? '🔊 اقرأ الكل' : '🔊 Read All')}
          </button>
        </div>
        {playingIdx >= 0 && (
          <div className="btns" style={{ marginTop: 8 }}>
            <button className="btn btn-stop" onClick={stopAll}>{lang === 'ar' ? '⏹ توقف' : '⏹ Stop'}</button>
          </div>
        )}
      </div>

      {showOutput && (
        <div>
          <div className="soul-box">
            <small>{lang === 'ar' ? 'الصدقة الجارية على' : 'Ongoing charity for'}</small>
            <b>{lang === 'ar' ? r.call : rels[r.idx].cf}</b>
          </div>
          {Array.from({ length: 20 }, (_, i) => {
            const arBody = fill(dAr[i], r);
            const enBody = fill(dEn[i], r);
            const title = lang === 'ar' ? tAr[i] : tEn[i];
            return (
              <div key={i} className={'dua' + (playingIdx === i ? ' playing' : '')}>
                <div className="dua-head">
                  <span className="dua-title">{title}</span>
                  <div className="dua-acts">
                    <button className={'dbtn dbtn-play' + (playingIdx === i ? ' on' : '')} onClick={() => toggleDua(i)}>
                      {playingIdx === i ? '⏸' : '▶'}
                    </button>
                    <button className="dbtn dbtn-sh" onClick={() => shareDua(i)}>📤</button>
                    <span className="dua-num">{i + 1}</span>
                  </div>
                </div>
                <div className="dua-body">
                  <span dangerouslySetInnerHTML={{ __html: hlText(arBody) }} />
                  <div className="en-line">
                    <span className="ltag">EN</span> {enBody}
                  </div>
                </div>
                <div className="dua-foot"><span>{sAr[i]}</span></div>
                <div className="dua-prog"><div className="bar" style={{ width: (progress[i] || 0) + '%' }} /></div>
              </div>
            );
          })}
        </div>
      )}

      <div className="foot">{lang === 'ar' ? 'نفحات الرحمة ✨' : 'Nafahat Al-Rahma ✨'}</div>

      {shareIdx !== null && (
        <div className="modal-bg" onClick={() => setShareIdx(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{lang === 'ar' ? '📤 مشاركة الدعاء' : '📤 Share Dua'}</h3>
            <div className="sh-grid">
              <a className="sh-btn wa" href={'https://wa.me/?text=' + encodeURIComponent(getShareText(shareIdx))} target="_blank" rel="noopener">
                <span className="sh-icon">💬</span><span className="sh-name">واتساب</span>
              </a>
              <a className="sh-btn tg" href={'https://t.me/share/url?url=' + encodeURIComponent(pageUrl) + '&text=' + encodeURIComponent(getShareText(shareIdx))} target="_blank" rel="noopener">
                <span className="sh-icon">✈️</span><span className="sh-name">تيليجرام</span>
              </a>
              <a className="sh-btn tw" href={'https://twitter.com/intent/tweet?text=' + encodeURIComponent(getShareText(shareIdx).substring(0, 240))} target="_blank" rel="noopener">
                <span className="sh-icon">🐦</span><span className="sh-name">تويتر</span>
              </a>
              <a className="sh-btn fb" href={'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(pageUrl)} target="_blank" rel="noopener">
                <span className="sh-icon">📘</span><span className="sh-name">فيسبوك</span>
              </a>
            </div>
            <button className="copy-btn" onClick={copyText}>
              {copied ? (lang === 'ar' ? '✅ تم النسخ!' : '✅ Copied!') : (lang === 'ar' ? '📋 نسخ النص' : '📋 Copy')}
            </button>
            <button className="close-btn" onClick={() => setShareIdx(null)}>✖ {lang === 'ar' ? 'إغلاق' : 'Close'}</button>
          </div>
        </div>
      )}
    </div>
  );
}
