/* DURAS — a self-contained, keyboard-playable three-pair memory game. */
(() => {
  'use strict';
  function mount() {
    const root = document.getElementById('coffee-game-root');
    if (!root || root.dataset.ready === 'true') return;
    root.dataset.ready = 'true';
    const cn = /^zh-(hans|cn)(-|$)/i.test(document.documentElement.lang);
    const t = (tw, simplified) => cn ? simplified : tw;
    const kinds = [
      { label: t('花香', '花香'), en: 'FLORAL', icon: '<g><ellipse cx="24" cy="13" rx="5.5" ry="8"/><ellipse cx="24" cy="13" rx="5.5" ry="8" transform="rotate(72 24 24)"/><ellipse cx="24" cy="13" rx="5.5" ry="8" transform="rotate(144 24 24)"/><ellipse cx="24" cy="13" rx="5.5" ry="8" transform="rotate(216 24 24)"/><ellipse cx="24" cy="13" rx="5.5" ry="8" transform="rotate(288 24 24)"/><circle cx="24" cy="24" r="4.5"/></g>' },
      { label: t('莓果', '莓果'), en: 'BERRIES', icon: '<path d="M23 18c0-6 2-11 9-14m-7 11c1-6 7-8 14-7-2 6-6 9-14 7Z"/><circle cx="17" cy="24" r="8"/><circle cx="31" cy="23" r="8"/><circle cx="24" cy="35" r="7"/><path d="m14 23 2-2m13 1 2-2m-9 15 2-2"/>' },
      { label: t('可可', '可可'), en: 'CACAO', icon: '<path d="M17 38C6 28 12 14 24 10l8-2 3 6c6 14-3 25-18 24Zm0 0c-2-11 4-23 15-30m-15 30c10-7 15-18 15-30m0 0 3-5"/>' }
    ];
    const glyph = k => '<svg viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">'+kinds[k].icon+'</svg>';
    const num = n => String(n).padStart(2, '0');
    // Rejection sampling keeps each card as likely as the next.
    function randomBelow(n) {
      if (!globalThis.crypto?.getRandomValues) return Math.floor(Math.random()*n);
      const x = new Uint32Array(1), limit = Math.floor(4294967296 / n) * n;
      do { globalThis.crypto.getRandomValues(x); } while (x[0] >= limit);
      return x[0] % n;
    }
    function shuffled() {
      const a = [0,1,2,0,1,2];
      for (let i=a.length-1;i>0;i--) { const j=randomBelow(i+1); [a[i],a[j]]=[a[j],a[i]]; }
      return a;
    }
    root.innerHTML = `
      <div class="dg-table">
        <header class="dg-head"><div><span class="dg-over">DURAS &nbsp; / &nbsp; MESA DE CAFÉ</span><h3>${t('風味配對桌','风味配对桌')}</h3></div><div class="dg-score"><strong data-pairs>0 / 3</strong><span>${t('組已配對','组已配对')}</span></div></header>
        <p class="dg-rules" id="dg-rules">${t('每次翻兩張牌，找到花香、莓果與可可各自的另一半。三組都找到，就能抽一張咖啡祝福卡。','每次翻两张牌，找到花香、莓果与可可各自的另一半。三组都找到，就能抽一张咖啡祝福卡。')}</p>
        <div class="dg-board" role="group" aria-label="${t('六張風味記憶牌','六张风味记忆牌')}" aria-describedby="dg-rules"></div>
        <div class="dg-progress"><span class="dg-attempts"></span><span class="dg-dots" aria-hidden="true"><i></i><i></i><i></i></span></div>
        <p class="dg-status" role="status" aria-live="polite" aria-atomic="true"></p>
        <div class="dg-actions"><button type="button" class="dg-start"></button><button type="button" class="dg-draw" disabled>${t('抽一張咖啡祝福卡','抽一张咖啡祝福卡')} <span aria-hidden="true">↗</span></button></div>
      </div>
      <div class="dg-result" hidden></div>`;
    const $ = sel => root.querySelector(sel);
    const board=$('.dg-board'), start=$('.dg-start'), draw=$('.dg-draw'), result=$('.dg-result'), status=$('.dg-status');
    const dots=[...root.querySelectorAll('.dg-dots i')], buttons=[];
    let phase='ready', deck=[0,1,2,0,1,2], open=[], matched=new Set(), turns=0, timer=0, serial=0, copied='';
    function say(message) { status.textContent=message; }
    function paint() {
      const n=matched.size/2;
      $('[data-pairs]').textContent=n+' / 3';
      $('.dg-attempts').textContent=t('翻牌回合：','翻牌回合：')+turns;
      dots.forEach((d,i)=>d.classList.toggle('dg-dot-on',i<n));
      buttons.forEach((button,i)=>{
        const kept=matched.has(i), up=kept||open.includes(i), state=kept?'matched':up?'open':'back';
        button.disabled=phase==='ready'; button.tabIndex=kept?-1:0;
        button.setAttribute('aria-pressed',String(up)); button.setAttribute('aria-disabled',String(kept||phase==='ready'));
        button.setAttribute('aria-label',t('第 ','第 ')+(i+1)+t(' 張：',' 张：')+(up?kinds[deck[i]].label+(kept?t('，已配對','，已配对'):''):t('蓋著的牌','盖着的牌')));
        if(button.dataset.state===state && button.dataset.face===String(deck[i])) return;
        button.dataset.state=state;button.dataset.face=String(deck[i]);
        if(!up) {
          button.innerHTML='<span class="dg-stamp" aria-hidden="true">D</span><span class="dg-deck-no" aria-hidden="true">Nº '+num(i+1)+'</span>';
        } else {
          const k=deck[i];
          button.innerHTML='<span class="dg-pip" aria-hidden="true">'+(kept?'✓':num(i+1))+'</span>'+glyph(k)+'<strong>'+kinds[k].label+'</strong><small aria-hidden="true">'+kinds[k].en+'</small>';
        }
      });
      start.textContent=phase==='ready'?t('洗牌開始','洗牌开始'):phase==='drawn'?t('再玩一次','再玩一次'):t('重新洗牌','重新洗牌');
      draw.disabled=phase!=='won'; draw.setAttribute('aria-disabled',String(draw.disabled));
    }
    function flip(i) {
      if(phase!=='playing'||matched.has(i)||open.includes(i)) return;
      open.push(i);
      if(open.length===1) {paint();say(kinds[deck[i]].label+t('。再翻一張，找找它的搭檔。','。再翻一张，找找它的搭档。'));return;}
      turns++;
      const [a,b]=open;
      if(deck[a]===deck[b]) {
        matched.add(a);matched.add(b);open=[];
        phase=matched.size===6?'won':'playing';paint();
        if(phase==='won') {say(t('三組風味都找到了！可以抽取你的咖啡祝福卡。','三组风味都找到了！可以抽取你的咖啡祝福卡。'));draw.focus();}
        else {say(kinds[deck[a]].label+t('配對成功！已找到 ','配对成功！已找到 ')+(matched.size/2)+t(' 組，繼續下一組。',' 组，继续下一组。'));buttons.find((_,j)=>!matched.has(j))?.focus({preventScroll:true});}
      } else {
        phase='mismatch';paint();
        say(kinds[deck[a]].label+'、'+kinds[deck[b]].label+t('：兩張不同。記住位置，蓋牌後再試一次。','：两张不同。记住位置，盖牌后再试一次。'));
        const thisRound=serial;
        timer=window.setTimeout(()=>{if(thisRound!==serial)return;timer=0;open=[];phase='playing';paint();},1450);
      }
    }
    for(let i=0;i<6;i++) {
      const b=document.createElement('button');b.type='button';b.className='dg-tile';
      b.addEventListener('click',()=>flip(i));
      b.addEventListener('keydown',e=>{
        const delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:-3,ArrowDown:3}[e.key];
        if(!delta)return;e.preventDefault();
        let j=i;
        for(let k=0;k<6;k++){j=(j+delta+6)%6;if(!matched.has(j)){buttons[j].focus();break;}}
      });
      buttons.push(b);board.append(b);
    }
    function begin(){
      serial++;clearTimeout(timer);timer=0;phase='playing';deck=shuffled();open=[];matched=new Set();turns=0;copied='';
      result.replaceChildren();result.hidden=true;paint();say(t('新的一輪開始了。選一張牌翻開吧。','新的一轮开始了。选一张牌翻开吧。'));buttons[0].focus();
    }
    start.addEventListener('click',begin);
    function node(tag,cls,value) {
      const el=document.createElement(tag);if(cls)el.className=cls;if(value!=null)el.textContent=String(value);return el;
    }
    function showCard(){
      if(phase!=='won') return;
      const region=cn?'cn':'tw', pool=(globalThis.DURAS_BLESSINGS||[]);
      const eligible=Array.isArray(pool)?pool.filter(x=>x&&x.es&&x[region]?.id&&x[region]?.bean&&x[region]?.title):[];
      if(!eligible.length){say(t('祝福卡暫時無法載入，請重新整理頁面再試。','祝福卡暂时无法载入，请刷新页面再试。'));return;}
      phase='drawn';paint();
      const pick=eligible[randomBelow(eligible.length)], data=pick[region], notes=Array.isArray(data.notes)?data.notes.join(' · '):String(data.notes||'');
      const card=node('article','dg-card');card.setAttribute('aria-labelledby','dg-card-title');
      const rail=node('div','dg-card-rail');rail.append(node('span','','DURAS  /  TARJETA DE CAFÉ'),node('i','','Nº '+num(pick.no)));
      const body=node('div','dg-card-body'), head=node('h4','dg-card-title',data.title);head.id='dg-card-title';head.tabIndex=-1;
      const bean=node('p','dg-bean',data.bean);bean.append(node('small','dg-bean-notes',notes));
      const quote=node('blockquote','dg-quote');const es=node('p','',pick.es);es.lang='es';quote.append(es,node('p','dg-translation',data.translation));
      const cited=typeof pick.source==='string'?pick.source:pick.source?.url;
      if(cited){try {const url=new URL(cited);if(url.protocol==='https:'){const a=node('a','dg-source',t('諺語出處（西文 PDF）','谚语出处（西语 PDF）')+' ↗');a.href=url.href;a.target='_blank';a.rel='noopener noreferrer';quote.append(a);}}catch{/* Source may be a bibliographic note, rather than a URL. */}}
      const shop=node('a','dg-shop',t('查看這款咖啡：','查看这款咖啡：')+data.bean+' ↗');shop.href='../'+region+'/coffee.html?bean='+encodeURIComponent(data.id);
      body.append(node('div','dg-card-kicker',t('你的咖啡祝福卡','你的咖啡祝福卡')),head,bean,node('p','dg-meaning',data.meaning),quote,shop);card.append(rail,body);
      const share=node('div','dg-share');const copy=node('button','dg-copy',t('複製這份祝福','复制这份祝福'));copy.type='button';const note=node('p','dg-copy-note');note.setAttribute('role','status');
      copied=[data.title,data.bean+' · '+notes,data.meaning,pick.es,data.translation,shop.href].join('\n');
      copy.addEventListener('click',async()=>{const thisRound=serial;
        try{await navigator.clipboard.writeText(copied);if(thisRound===serial)note.textContent=t('已複製，可以分享給朋友了。','已复制，可以分享给朋友了。');}
        catch{if(thisRound!==serial)return;let manual=share.querySelector('textarea');if(!manual){manual=node('textarea','dg-manual');manual.readOnly=true;manual.setAttribute('aria-label',t('可複製的祝福內容','可复制的祝福内容'));share.append(manual);}manual.value=copied;manual.focus();manual.select();note.textContent=t('請複製已選取的祝福內容。','请复制已选取的祝福内容。');}
      });
      const replay=node('button','dg-replay',t('再玩一次','再玩一次'));replay.type='button';replay.addEventListener('click',begin);
      share.append(copy,replay,note);result.replaceChildren(card,share);result.hidden=false;say(t('已抽出本輪的咖啡祝福卡。','已抽出本轮的咖啡祝福卡。'));
      head.focus({preventScroll:true});result.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    }
    draw.addEventListener('click',showCard);
    window.addEventListener('pagehide',()=>{clearTimeout(timer);timer=0;if(phase==='mismatch'){open=[];phase='playing';paint();}});
    paint();say(t('準備好了嗎？洗牌後，選兩張你想翻開的牌。','准备好了吗？洗牌后，选两张你想翻开的牌。'));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
