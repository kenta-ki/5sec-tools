(function(){
  const $=(id)=>document.getElementById(id);
  const track=(name,params={})=>window.fiveSecAnalytics?.track(name,params);

  const TOOL_INFO={
    schedule:{name:'日程候補メーカー',hint:'予定を決める',keywords:'日程 予定 カレンダー メール 候補 調整 会議'},
    diff:{name:'リスト比較',hint:'一覧を確認',keywords:'リスト 比較 差分 一覧 名簿'},
    email:{name:'メール宛先整形',hint:'メールを送る',keywords:'メール 宛先 Outlook Gmail'},
    businessday:{name:'営業日計算',hint:'締切を確認',keywords:'営業日 日付 締切 期限'},
    transpose:{name:'縦横変換',hint:'Excel前の整形',keywords:'縦横 Excel タブ カンマ'},
    dailyreport:{name:'日報メーカー',hint:'日報を出す',keywords:'日報 業務報告 進捗 課題'},
    agenda:{name:'会議アジェンダメーカー',hint:'会議を始める',keywords:'会議 アジェンダ 議題 時間配分'},
    worktime:{name:'勤務時間・残業計算',hint:'勤務時間を確認',keywords:'勤務時間 実働 残業 出勤 退勤'},
    dedupe:{name:'重複削除・並び替え',hint:'一覧を整える',keywords:'重複 削除 並び替え リスト'},
    textbatch:{name:'一括文字加工',hint:'文字列を整える',keywords:'一括 文字 加工 敬称 連番'}
  };

  function storageGet(key,fallback){
    try{return JSON.parse(localStorage.getItem(key)) ?? fallback}catch(e){return fallback}
  }
  function storageSet(key,value){
    try{localStorage.setItem(key,JSON.stringify(value))}catch(e){}
  }

  let favorites=storageGet('fiveSecFavorites',[]);
  if(!Array.isArray(favorites)) favorites=[];
  let recentTools=storageGet('fiveSecRecent',[]);
  if(!Array.isArray(recentTools)) recentTools=[];

  function addRecent(id){
    if(!TOOL_INFO[id]) return;
    recentTools=[id,...recentTools.filter(x=>x!==id)].slice(0,4);
    storageSet('fiveSecRecent',recentTools);
    renderPersonalAreas();
  }

  function toggleFavorite(id){
    favorites=favorites.includes(id)?favorites.filter(x=>x!==id):[id,...favorites];
    storageSet('fiveSecFavorites',favorites);
    renderPersonalAreas();
    syncFavoriteStars();
  }

  function compactToolHtml(id){
    const t=TOOL_INFO[id];
    return `<div class="compact-tool" data-compact-open="${id}">
      <strong>${t.name}</strong><span>${t.hint} →</span>
    </div>`;
  }

  function renderPersonalAreas(){
    const favArea=$('favoritesArea'),recentArea=$('recentArea');
    $('favoritesList').innerHTML=favorites.filter(id=>TOOL_INFO[id]).map(compactToolHtml).join('');
    $('recentList').innerHTML=recentTools.filter(id=>TOOL_INFO[id]).map(compactToolHtml).join('');
    favArea.hidden=favorites.length===0;
    recentArea.hidden=recentTools.length===0;
    document.querySelectorAll('[data-compact-open]').forEach(el=>{
      el.addEventListener('click',()=>showPage(el.dataset.compactOpen));
    });
  }

  function syncFavoriteStars(){
    document.querySelectorAll('[data-favorite]').forEach(btn=>{
      const active=favorites.includes(btn.dataset.favorite);
      btn.classList.toggle('active',active);
      btn.textContent=active?'★':'☆';
    });
  }

  document.querySelectorAll('[data-favorite]').forEach(btn=>{
    btn.addEventListener('click',(e)=>{
      e.stopPropagation();
      toggleFavorite(btn.dataset.favorite);
    });
  });

  // Tool search
  function filterTools(query){
    const q=query.trim().toLowerCase();
    let shown=0;
    document.querySelectorAll('#toolGrid .tool-card').forEach(card=>{
      const hay=(card.dataset.search+' '+card.textContent).toLowerCase();
      const ok=!q||hay.includes(q);
      card.style.display=ok?'':'none';
      if(ok) shown++;
    });
    $('toolCountLabel').textContent=q?`${shown}個見つかりました`:'10個のツール';
    $('noResults').hidden=shown!==0;
  }

  $('toolSearch').addEventListener('input',e=>filterTools(e.target.value));
  $('clearSearch').addEventListener('click',()=>{
    $('toolSearch').value='';
    filterTools('');
    $('toolSearch').focus();
  });
  document.querySelectorAll('[data-query]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      $('toolSearch').value=btn.dataset.query;
      filterTools(btn.dataset.query);
    });
  });

  // Browser bookmark coaching
  const isMac=/Mac|iPhone|iPad|iPod/.test(navigator.platform||navigator.userAgent);
  const shortcut=isMac?'⌘ D':'Ctrl + D';
  if($('modalShortcut')) $('modalShortcut').textContent=shortcut;
  if($('modalHelp')) {
    $('modalHelp').textContent=isMac
      ?'Macなら ⌘ + D を押すと、このページをブックマークできます。'
      :'Windowsなら Ctrl + D を押すと、このページをブックマークできます。';
  }

  function openBookmarkModal(){$('bookmarkModal').classList.add('show')}
  function closeBookmarkModal(){$('bookmarkModal').classList.remove('show')}
  $('bookmarkSite').addEventListener('click',openBookmarkModal);
  $('closeBookmarkModal').addEventListener('click',closeBookmarkModal);
  $('bookmarkModal').addEventListener('click',e=>{if(e.target===$('bookmarkModal'))closeBookmarkModal()});

  renderPersonalAreas();
  syncFavoriteStars();

  let measuredPage=null;
  function showPage(id,{updateUrl=true,scroll=true}={}){
    const target=$(id);
    if(!target) return;
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    document.querySelectorAll('.nav button').forEach(b=>b.classList.remove('active'));
    target.classList.add('active');
    const navBtn=document.querySelector(`.nav button[data-page="${id}"]`);
    if(navBtn) navBtn.classList.add('active');
    if(id!=='home') addRecent(id);
    if(measuredPage!==id){track('page_view',{tool:id});measuredPage=id}
    if(updateUrl){
      const next=id==='home' ? location.pathname : `${location.pathname}#${id}`;
      history.pushState({page:id},'',next);
    }
    if(scroll) window.scrollTo({top:0,behavior:'smooth'});
  }

  document.querySelectorAll('.nav button').forEach(btn=>btn.addEventListener('click',()=>showPage(btn.dataset.page)));
  document.querySelectorAll('[data-open]').forEach(card=>card.addEventListener('click',(e)=>{if(!e.target.closest('.favorite-star'))showPage(card.dataset.open)}));

  document.querySelectorAll('[data-open]').forEach(card=>card.addEventListener('keydown',(e)=>{
    if((e.key==='Enter'||e.key===' ')&&!e.target.closest('.favorite-star')){
      e.preventDefault();
      showPage(card.dataset.open);
    }
  }));
  $('brandHome').addEventListener('click',()=>showPage('home'));

  // URL hash routing: each tool can be bookmarked/shared directly.
  const validPages=new Set(['home',...Object.keys(TOOL_INFO)]);
  function routeFromUrl(){
    const requested=(location.hash||'').replace('#','')||'home';
    showPage(validPages.has(requested)?requested:'home',{updateUrl:false,scroll:false});
  }
  window.addEventListener('popstate',routeFromUrl);
  window.addEventListener('hashchange',routeFromUrl);

  function showToast(){
    const t=$('toast');t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1300);
  }
  function copyText(text,onSuccess=()=>{}){
    const success=()=>{showToast();onSuccess()};
    if(!text) return;
    const fallback=()=>{
      const ta=document.createElement('textarea');
      ta.value=text;ta.style.position='fixed';ta.style.opacity='0';
      document.body.appendChild(ta);ta.focus();ta.select();
      try{if(!document.execCommand('copy')) throw new Error('copy failed');success()}catch(e){track('copy_error');alert('コピーできませんでした。手動でコピーしてください。')}
      ta.remove();
    };
    if(navigator.clipboard&&window.isSecureContext){
      navigator.clipboard.writeText(text).then(success).catch(fallback);
    }else fallback();
  }

  // Calendar
  const START_HOUR=8,END_HOUR=20;
  let SLOT_MIN=30,weekOffset=0,isDragging=false,dragSelectMode=true,dragDay=null,selectedRangesMemory=[];

  function mondayOf(date){
    const d=new Date(date),day=d.getDay(),diff=(day===0?-6:1-day);
    d.setDate(d.getDate()+diff);d.setHours(0,0,0,0);return d;
  }
  function addDays(date,n){const d=new Date(date);d.setDate(d.getDate()+n);return d}
  function fmtISO(date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`}
  function getWeekStart(){const base=mondayOf(new Date());base.setDate(base.getDate()+weekOffset*7);return base}
  function timeFromIndex(idx){
    const total=START_HOUR*60+idx*SLOT_MIN,h=Math.floor(total/60),m=total%60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  }
  function minutesFromTime(t){const [h,m]=t.split(':').map(Number);return h*60+m}

  function renderCalendar(){
    const cal=$('calendar');cal.innerHTML='';
    const ws=getWeekStart(),we=addDays(ws,6);
    $('weekTitle').textContent=`${ws.getFullYear()}年${ws.getMonth()+1}月${ws.getDate()}日 〜 ${we.getMonth()+1}月${we.getDate()}日`;

    const corner=document.createElement('div');corner.className='corner';cal.appendChild(corner);
    const dows=['月','火','水','木','金','土','日'];
    for(let d=0;d<7;d++){
      const date=addDays(ws,d),head=document.createElement('div');
      head.className='day-head'+(d===5?' saturday':d===6?' sunday':'');
      head.innerHTML=`<div class="dow">${dows[d]}曜日</div><div class="date">${date.getMonth()+1}/${date.getDate()}</div>`;
      cal.appendChild(head);
    }

    const slotCount=((END_HOUR-START_HOUR)*60)/SLOT_MIN;
    for(let i=0;i<slotCount;i++){
      const label=document.createElement('div');
      label.className='time-label';
      const total=START_HOUR*60+i*SLOT_MIN;
      label.textContent=(total%60===0)?timeFromIndex(i):'';
      cal.appendChild(label);

      for(let d=0;d<7;d++){
        const date=addDays(ws,d),slot=document.createElement('div');
        slot.className='slot'+(d===5?' saturday':d===6?' sunday':'');
        slot.dataset.date=fmtISO(date);slot.dataset.index=String(i);
        slot.tabIndex=0;
        slot.setAttribute('role','button');
        slot.setAttribute('aria-label',`${jpDate(slot.dataset.date)} ${timeFromIndex(i)}〜${timeFromIndex(i+1)}`);
        slot.setAttribute('aria-pressed','false');
        slot.addEventListener('pointerdown',(e)=>{
          if(e.pointerType!=='mouse'||e.button!==0)return;
          e.preventDefault();isDragging=true;dragDay=slot.dataset.date;
          dragSelectMode=!slot.classList.contains('selected');
          setSlot(slot,dragSelectMode);
        });
        slot.addEventListener('pointerenter',()=>{if(isDragging&&slot.dataset.date===dragDay)setSlot(slot,dragSelectMode)});
        slot.addEventListener('click',e=>{if(e.pointerType!=='mouse' && e.detail!==0)setSlot(slot,!slot.classList.contains('selected'))});
        slot.addEventListener('keydown',e=>{
          if(e.key==='Enter'||e.key===' '){e.preventDefault();setSlot(slot,!slot.classList.contains('selected'))}
          const delta={ArrowRight:1,ArrowLeft:-1,ArrowDown:7,ArrowUp:-7}[e.key];
          if(delta){e.preventDefault();const slots=[...cal.querySelectorAll('.slot')];slots[slots.indexOf(slot)+delta]?.focus()}
        });
        cal.appendChild(slot);
      }
    }
    restoreRanges();updateScheduleText();
  }

  function setSlot(slot,on){slot.classList.toggle('selected',on);slot.setAttribute('aria-pressed',String(on));updateScheduleText();track('schedule_select',{slot_minutes:SLOT_MIN})}
  function getSelectedRanges(){
    const grouped={};
    document.querySelectorAll('.slot.selected').forEach(slot=>{
      const date=slot.dataset.date,idx=Number(slot.dataset.index);
      (grouped[date]??=[]).push(idx);
    });
    const ranges=[];
    Object.keys(grouped).sort().forEach(date=>{
      const arr=[...new Set(grouped[date])].sort((a,b)=>a-b);
      if(!arr.length)return;
      let start=arr[0],prev=arr[0];
      for(let i=1;i<=arr.length;i++){
        const cur=arr[i];
        if(cur===prev+1){prev=cur;continue}
        ranges.push({date,start:timeFromIndex(start),end:timeFromIndex(prev+1)});
        start=cur;prev=cur;
      }
    });
    return ranges;
  }
  function restoreRanges(){
    if(!selectedRangesMemory.length)return;
    document.querySelectorAll('.slot').forEach(slot=>{
      const date=slot.dataset.date,idx=Number(slot.dataset.index);
      const ss=START_HOUR*60+idx*SLOT_MIN,se=ss+SLOT_MIN;
      const hit=selectedRangesMemory.some(r=>r.date===date&&ss>=minutesFromTime(r.start)&&se<=minutesFromTime(r.end));
      if(hit){slot.classList.add('selected');slot.setAttribute('aria-pressed','true')}
    });
  }
  function jpDate(iso){
    const [y,m,d]=iso.split('-').map(Number),date=new Date(y,m-1,d),dow=['日','月','火','水','木','金','土'][date.getDay()];
    return `${m}月${d}日（${dow}）`;
  }
  function updateScheduleText(){
    const ranges=getSelectedRanges();
    $('copySchedule').disabled=!ranges.length;
    if(!ranges.length){$('scheduleOutput').textContent='カレンダーから候補時間を選択してください。';return}
    const intro=$('scheduleIntro').value.trim(),outro=$('scheduleOutro').value.trim();
    const body=ranges.map(r=>`・${jpDate(r.date)} ${r.start}〜${r.end}`).join('\n');
    $('scheduleOutput').textContent=`${intro}\n\n${body}\n\n${outro}`;
  }

  document.querySelectorAll('.slot-choice').forEach(btn=>btn.addEventListener('click',()=>{
    selectedRangesMemory=getSelectedRanges();
    SLOT_MIN=Number(btn.dataset.minutes);
    document.querySelectorAll('.slot-choice').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    document.documentElement.style.setProperty('--slot-h',SLOT_MIN===15?'24px':'36px');
    renderCalendar();
  }));
  $('prevWeek').addEventListener('click',()=>{weekOffset--;selectedRangesMemory=[];renderCalendar()});
  $('nextWeek').addEventListener('click',()=>{weekOffset++;selectedRangesMemory=[];renderCalendar()});
  $('todayWeek').addEventListener('click',()=>{weekOffset=0;selectedRangesMemory=[];renderCalendar()});
  $('clearSchedule').addEventListener('click',()=>{document.querySelectorAll('.slot.selected').forEach(s=>{s.classList.remove('selected');s.setAttribute('aria-pressed','false')});selectedRangesMemory=[];updateScheduleText()});
  $('scheduleIntro').addEventListener('input',updateScheduleText);
  $('scheduleOutro').addEventListener('input',updateScheduleText);
  $('copySchedule').addEventListener('click',()=>{if(getSelectedRanges().length)copyText($('scheduleOutput').textContent,()=>track('schedule_copy',{slot_minutes:SLOT_MIN}))});
  document.addEventListener('pointerup',()=>{isDragging=false;dragDay=null});
  document.addEventListener('pointercancel',()=>{isDragging=false;dragDay=null});
  window.addEventListener('blur',()=>{isDragging=false;dragDay=null});
  renderCalendar();
  routeFromUrl();

  // Diff
  function parseList(v){return [...new Set(v.split(/\r?\n/).map(s=>s.trim()).filter(Boolean))]}
  $('compareLists').addEventListener('click',()=>{
    const a=parseList($('listA').value),b=parseList($('listB').value),sa=new Set(a),sb=new Set(b);
    const onlyA=a.filter(x=>!sb.has(x)),onlyB=b.filter(x=>!sa.has(x)),common=a.filter(x=>sb.has(x));
    $('countOnlyA').textContent=onlyA.length;$('countOnlyB').textContent=onlyB.length;$('countCommon').textContent=common.length;
    $('onlyA').textContent=onlyA.join('\n')||'なし';$('onlyB').textContent=onlyB.join('\n')||'なし';$('common').textContent=common.join('\n')||'なし';
  });
  $('clearLists').addEventListener('click',()=>{
    $('listA').value='';$('listB').value='';$('countOnlyA').textContent='0';$('countOnlyB').textContent='0';$('countCommon').textContent='0';
    $('onlyA').textContent='';$('onlyB').textContent='';$('common').textContent='';
  });

  // Emails
  $('formatEmails').addEventListener('click',()=>{
    const items=$('emailInput').value.split(/[\s,;]+/).map(x=>x.trim()).filter(Boolean);
    $('emailOutput').textContent=items.join($('emailDelimiter').value+' ');
  });
  $('copyEmails').addEventListener('click',()=>copyText($('emailOutput').textContent));

  // Business day
  const today=new Date();
  $('bdDate').value=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  $('calcBusinessDay').addEventListener('click',()=>{
    const dateStr=$('bdDate').value;
    let n=Math.max(0,Number($('bdDays').value)||0);
    if(!dateStr){$('bdOutput').textContent='基準日を選択してください。';return}
    const [y,m,d]=dateStr.split('-').map(Number);
    const date=new Date(y,m-1,d);
    const step=$('bdDirection').value==='after'?1:-1;
    let count=0;
    while(count<n){
      date.setDate(date.getDate()+step);
      const day=date.getDay();
      if(day!==0&&day!==6)count++;
    }
    const dow=['日','月','火','水','木','金','土'][date.getDay()];
    $('bdOutput').textContent=`${date.getFullYear()}年${date.getMonth()+1}月${date.getDate()}日（${dow}）`;
  });

  // Transpose
  $('transposeBtn').addEventListener('click',()=>{
    const mode=$('transposeMode').value,input=$('transposeInput').value.trim();
    if(!input){$('transposeOutput').textContent='入力してください。';return}
    if(mode==='vertical_to_tab'){
      $('transposeOutput').textContent=input.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).join('\t');
    }else if(mode==='vertical_to_comma'){
      $('transposeOutput').textContent=input.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).join(', ');
    }else{
      $('transposeOutput').textContent=input.split(/[\t,;]+/).map(x=>x.trim()).filter(Boolean).join('\n');
    }
  });
  $('copyTranspose').addEventListener('click',()=>copyText($('transposeOutput').textContent));

  // Daily report
  function bulletize(value){
    return value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map(x=>x.startsWith('・')?x:`・${x}`).join('\n');
  }
  $('makeDailyReport').addEventListener('click',()=>{
    const sections=[
      ['【本日の業務】',bulletize($('drToday').value)],
      ['【成果・進捗】',bulletize($('drProgress').value)],
      ['【課題・気になる点】',bulletize($('drIssue').value)],
      ['【明日の予定】',bulletize($('drTomorrow').value)]
    ].filter(x=>x[1]);
    $('dailyReportOutput').textContent=sections.length?sections.map(x=>`${x[0]}\n${x[1]}`).join('\n\n'):'内容を入力してください。';
  });
  $('copyDailyReport').addEventListener('click',()=>copyText($('dailyReportOutput').textContent));

  // Agenda
  function timeToMinutes(t){const [h,m]=t.split(':').map(Number);return h*60+m}
  function minutesToTime(min){
    min=(min+1440)%1440;
    return `${String(Math.floor(min/60)).padStart(2,'0')}:${String(min%60).padStart(2,'0')}`;
  }
  $('makeAgenda').addEventListener('click',()=>{
    const topics=$('agendaTopics').value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
    if(!topics.length){$('agendaOutput').textContent='議題を1つ以上入力してください。';return}
    const start=timeToMinutes($('agendaStart').value||'10:00');
    const duration=Number($('agendaDuration').value);
    const wrap=Math.min(Number($('agendaWrap').value),duration);
    const main=Math.max(0,duration-wrap);
    const per=Math.floor(main/topics.length);
    let remainder=main-per*topics.length;
    let cursor=start;
    const lines=[];
    topics.forEach(topic=>{
      const span=per+(remainder>0?1:0);
      if(remainder>0) remainder--;
      const end=cursor+span;
      lines.push(`${minutesToTime(cursor)}〜${minutesToTime(end)}　${topic}`);
      cursor=end;
    });
    if(wrap>0) lines.push(`${minutesToTime(cursor)}〜${minutesToTime(start+duration)}　決定事項・確認`);
    $('agendaOutput').textContent=lines.join('\n');
  });
  $('copyAgenda').addEventListener('click',()=>copyText($('agendaOutput').textContent));

  // Worktime
  $('calcWorktime').addEventListener('click',()=>{
    const s=timeToMinutes($('workStart').value||'09:00');
    let e=timeToMinutes($('workEnd').value||'18:00');
    if($('overnight').value==='auto' && e<s) e+=1440;
    const breakMin=Math.max(0,Number($('breakMin').value)||0);
    const worked=Math.max(0,e-s-breakMin);
    const regular=Math.max(0,Number($('regularHours').value)||0)*60;
    const overtime=Math.max(0,worked-regular);
    const fmt=(m)=>`${Math.floor(m/60)}時間${m%60}分`;
    $('worktimeOutput').textContent=`実働：${fmt(worked)}\n残業：${fmt(overtime)}`;
  });

  // Dedupe
  $('runDedupe').addEventListener('click',()=>{
    const raw=$('dedupeInput').value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
    let out=[...new Set(raw)];
    if($('dedupeSort').value==='asc') out.sort((a,b)=>a.localeCompare(b,'ja'));
    if($('dedupeSort').value==='desc') out.sort((a,b)=>b.localeCompare(a,'ja'));
    $('dedupeMeta').textContent=`${raw.length}件 → ${out.length}件（重複 ${raw.length-out.length}件を削除）`;
    $('dedupeOutput').textContent=out.join('\n')||'結果が空です。';
  });
  $('copyDedupe').addEventListener('click',()=>copyText($('dedupeOutput').textContent));

  // Batch text
  function syncBatchInput(){
    $('batchTextWrap').style.display=['suffix','prefix'].includes($('batchMode').value)?'block':'none';
  }
  $('batchMode').addEventListener('change',syncBatchInput);
  syncBatchInput();
  $('runBatch').addEventListener('click',()=>{
    const rows=$('batchInput').value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
    const mode=$('batchMode').value,text=$('batchText').value;
    let out=rows;
    if(mode==='suffix') out=rows.map(x=>x+text);
    else if(mode==='prefix') out=rows.map(x=>text+x);
    else if(mode==='number') out=rows.map((x,i)=>`${i+1}. ${x}`);
    else if(mode==='trim') out=rows.map(x=>x.trim());
    $('batchOutput').textContent=out.join('\n')||'結果が空です。';
  });
  $('copyBatch').addEventListener('click',()=>copyText($('batchOutput').textContent));

})();
