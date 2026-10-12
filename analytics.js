(function(){
  const id=window.FIVE_SEC_ANALYTICS?.measurementId||'';
  const configured=/^G-[A-Z0-9]+$/.test(id);
  const key='fiveSecAnalyticsConsent';
  let consent=false,started=false,lastPage='home';
  try{consent=localStorage.getItem(key)==='granted'}catch(e){}
  const blocked=navigator.globalPrivacyControl===true||navigator.doNotTrack==='1';
  const allowed=new Set(['home','schedule','schedule_intro','diff','email','businessday','transpose','dailyreport','agenda','worktime','dedupe','textbatch']);
  function start(){
    if(started||!configured||!consent||blocked)return;
    started=true;
    window.dataLayer=window.dataLayer||[];
    window.gtag=function(){window.dataLayer.push(arguments)};
    window.gtag('js',new Date());
    window.gtag('config',id,{send_page_view:false,page_location:location.origin+location.pathname,page_referrer:(()=>{try{return document.referrer?new URL(document.referrer).origin:''}catch(e){return ''}})(),allow_google_signals:false,allow_ad_personalization_signals:false});
    const script=document.createElement('script');script.async=true;
    script.src='https://www.googletagmanager.com/gtag/js?id='+id;
    document.head.appendChild(script);
  }
  function track(name,params={}){
    if(!['page_view','schedule_select','schedule_copy','copy_error','schedule_start','feedback_open'].includes(name))return;
    const safe={};
    if(name==='page_view'){
      lastPage=allowed.has(params.tool)?params.tool:'home';
      safe.tool=lastPage;
      safe.page_location=location.origin+location.pathname+(['home','schedule_intro'].includes(lastPage)?'':'#'+lastPage);
      safe.page_title='5秒ツール / '+lastPage;
      try{safe.page_referrer=document.referrer?new URL(document.referrer).origin:''}catch(e){safe.page_referrer=''}
    }else if([15,30].includes(params.slot_minutes))safe.slot_minutes=params.slot_minutes;
    // テスト用の揮発イベント。入力内容・日時・検索語・クエリ文字列を含めません。
    window.dispatchEvent(new CustomEvent('five-sec-metric',{detail:{name,params:safe}}));
    if(configured&&consent&&!blocked){start();window.gtag('event',name,safe)}
  }
  window.fiveSecAnalytics={track};
  const landingStart=document.getElementById('scheduleStart');
  if(landingStart){
    track('page_view',{tool:'schedule_intro'});
    landingStart.addEventListener('click',()=>track('schedule_start'));
  }
  const banner=document.getElementById('analyticsConsent');
  const settings=document.getElementById('analyticsSettings');
  if(configured&&!blocked){
    settings.hidden=false;
    let choice=null;try{choice=localStorage.getItem(key)}catch(e){}
    banner.hidden=choice==='granted'||choice==='denied';
    settings.onclick=()=>{banner.hidden=false};
    document.getElementById('analyticsAccept').onclick=()=>{
      consent=true;try{localStorage.setItem(key,'granted')}catch(e){}
      banner.hidden=true;start();track('page_view',{tool:lastPage});
    };
    document.getElementById('analyticsReject').onclick=()=>{
      consent=false;try{localStorage.setItem(key,'denied')}catch(e){}
      banner.hidden=true;
      if(started)location.reload();
    };
  }
})();
