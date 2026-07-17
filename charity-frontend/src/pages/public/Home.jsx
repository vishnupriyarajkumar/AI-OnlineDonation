import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import axiosInstance from '../../api/axiosInstance';
import { useLanguage } from '../../context/LanguageContext';

const DEFAULT_STATS = { totalCampaigns:24, totalDonors:1450, totalRaised:8500000, totalVolunteers:320 };
const HERO_P = [{emoji:'💜',x:5,y:14,delay:0},{emoji:'🤝',x:87,y:8,delay:1.2},{emoji:'❤️',x:9,y:80,delay:2},{emoji:'🌟',x:86,y:68,delay:0.6}];
const HERO_IMGS = [
  {src:'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=500',alt:'Volunteers',style:{gridRow:'1/3',borderRadius:'20px 8px 8px 20px'}},
  {src:'https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=400',alt:'Children',style:{borderRadius:'8px 20px 8px 8px'}},
  {src:'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400',alt:'Medical',style:{borderRadius:'8px 8px 20px 8px'}},
];
const CATS = [{id:'All',icon:'🌐'},{id:'Food',icon:'🍱'},{id:'Medical',icon:'🏥'},{id:'Education',icon:'📚'},{id:'Emergency',icon:'🚨'},{id:'Shelter',icon:'🏠'},{id:'Animal Welfare',icon:'🐾'},{id:'Environment',icon:'🌿'},{id:'Elder Care',icon:'👴'},{id:'Women Empowerment',icon:'👩'},{id:'Disability Support',icon:'♿'},{id:'Disaster Relief',icon:'🆘'}];
const CATL = {en:{All:'All',Food:'Food',Medical:'Medical',Education:'Education',Emergency:'Emergency',Shelter:'Shelter','Animal Welfare':'Animal Welfare',Environment:'Environment','Elder Care':'Elder Care','Women Empowerment':'Women Empowerment','Disability Support':'Disability Support','Disaster Relief':'Disaster Relief'},ta:{All:'அனைத்தும்',Food:'உணவு',Medical:'மருத்துவம்',Education:'கல்வி',Emergency:'அவசரம்',Shelter:'வீடு','Animal Welfare':'விலங்கு நலன்',Environment:'சுற்றுச்சூழல்','Elder Care':'முதியோர்','Women Empowerment':'பெண் அதிகாரம்','Disability Support':'மாற்றுத்திறன்','Disaster Relief':'பேரிடர் நிவாரணம்'},hi:{All:'सभी',Food:'खाना',Medical:'चिकित्सा',Education:'शिक्षा',Emergency:'आपातकाल',Shelter:'आश्रय','Animal Welfare':'पशु कल्याण',Environment:'पर्यावरण','Elder Care':'वरिष्ठ देखभाल','Women Empowerment':'महिला सशक्तीकरण','Disability Support':'दिव्यांग सहायता','Disaster Relief':'आपदा राहत'},te:{All:'అన్నీ',Food:'ఆహారం',Medical:'వైద్యం',Education:'విద్య',Emergency:'అత్యవసరం',Shelter:'ఆశ్రయం','Animal Welfare':'జంతు సంక్షేమం',Environment:'పర్యావరణం','Elder Care':'వృద్ధుల సంరక్షణ','Women Empowerment':'మహిళా సాధికారత','Disability Support':'వికలాంగ','Disaster Relief':'విపత్తు సహాయం'},ml:{All:'എല്ലാം',Food:'ഭക്ഷണം',Medical:'വൈദ്യം',Education:'വിദ്യാഭ്യാസം',Emergency:'അടിയന്തരം',Shelter:'അഭയം','Animal Welfare':'മൃഗ ക്ഷേമം',Environment:'പരിസ്ഥിതി','Elder Care':'വൃദ്ധ സംരക്ഷണം','Women Empowerment':'വനിതാ ശാക്തീകരണം','Disability Support':'ഭിന്നശേഷി','Disaster Relief':'ദുരന്ത ആശ്വാസം'},kn:{All:'ಎಲ್ಲಾ',Food:'ಆಹಾರ',Medical:'ವೈದ್ಯ',Education:'ಶಿಕ್ಷಣ',Emergency:'ತುರ್ತು',Shelter:'ಆಶ್ರಯ','Animal Welfare':'ಪ್ರಾಣಿ ಕಲ್ಯಾಣ',Environment:'ಪರಿಸರ','Elder Care':'ಹಿರಿಯರ ಆರೈಕೆ','Women Empowerment':'ಮಹಿಳಾ ಸಬಲೀಕರಣ','Disability Support':'ವಿಕಲಾಂಗ','Disaster Relief':'ವಿಪತ್ತು ಪರಿಹಾರ'}};
const WHY = [{icon:'🔒',en:'Secure Payments',enD:'Razorpay-secured, bank-grade encryption.',ta:'பாதுகாப்பான கட்டணங்கள்',taD:'Razorpay மூலம் பாதுகாப்பு.',hi:'सुरक्षित भुगतान',hiD:'Razorpay बैंक-ग्रेड।'},{icon:'🏆',en:'Verified NGOs',enD:'Every campaign verified.',ta:'சரிபார்க்கப்பட்ட NGO',taD:'ஒவ்வொரு பிரச்சாரமும் சரிபார்க்கப்படும்.',hi:'सत्यापित NGO',hiD:'प्रत्येक अभियान सत्यापित।'},{icon:'📊',en:'Transparent Tracking',enD:'Track every rupee in real time.',ta:'வெளிப்படை கண்காணிப்பு',taD:'ஒவ்வொரு ரூபாயும் கண்காணிக்கப்படும்.',hi:'पारदर्शी ट्रैकिंग',hiD:'हर रुपये का उपयोग ट्रैक करें।'},{icon:'🤖',en:'AI Assistant',enD:'AI chatbot helps find campaigns.',ta:'AI உதவியாளர்',taD:'AI சேட்பாட் சரியான பிரச்சாரங்களை கண்டுபிடிக்க.',hi:'AI सहायक',hiD:'AI चैटबॉट सही अभियान खोजने में।'},{icon:'📧',en:'Automatic Receipts',enD:'Instant 80G receipts emailed.',ta:'தானியங்கி ரசீதுகள்',taD:'நன்கொடைக்கு பிறகு 80G ரசீது.',hi:'स्वचालित रसीदें',hiD:'हर दान के बाद 80G रसीद।'},{icon:'⚡',en:'Real-Time Updates',enD:'Live progress and updates.',ta:'நேரலை புதுப்பிப்புகள்',taD:'நேரலை முன்னேற்ற பட்டைகள்.',hi:'रियल-टाइम अपडेट',hiD:'लाइव प्रगति बार।'}];

function FP({emoji,x,y,delay}){return(<motion.div style={{position:'absolute',left:`${x}%`,top:`${y}%`,fontSize:20,pointerEvents:'none',zIndex:1}} animate={{y:[0,-20,0],opacity:[0.35,0.8,0.35],rotate:[-8,8,-8]}} transition={{duration:4+delay,repeat:Infinity,delay,ease:'easeInOut'}}>{emoji}</motion.div>);}
function Counter({target,suffix=''}){const[c,setC]=useState(0);const ref=useRef(null);const iv=useInView(ref,{once:true});useEffect(()=>{if(!iv)return;let s=0;const step=target/60;const t=setInterval(()=>{s+=step;if(s>=target){setC(target);clearInterval(t);}else setC(Math.floor(s));},16);return()=>clearInterval(t);},[iv,target]);return<span ref={ref}>{c.toLocaleString('en-IN')}{suffix}</span>;}
function CC({campaign:c,index,t}){const uc={LOW:'#10b981',MEDIUM:'#f59e0b',HIGH:'#ef4444',CRITICAL:'#dc2626'};const pct=c.goalAmount>0?Math.min(100,(c.collectedAmount/c.goalAmount)*100):c.progressPercent||0;const done=c.status==='CLOSED'||c.status==='COMPLETED'||(Number(c.collectedAmount)>=Number(c.goalAmount)&&Number(c.goalAmount)>0);return(<motion.div className="campaign-card" initial={{opacity:0,y:40}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:0.45,delay:(index%3)*0.08}} whileHover={{y:-8,transition:{duration:0.22}}}><div style={{position:'relative',overflow:'hidden',height:180}}><motion.img src={c.imageUrl||'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=600'} alt={c.campaignName} loading="lazy" style={{width:'100%',height:'100%',objectFit:'cover'}} whileHover={{scale:1.06}} transition={{duration:0.4}}/><div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(0,0,0,0.65),transparent)'}}/>{!done&&c.daysRemaining<=7&&(<motion.div style={{position:'absolute',top:10,left:10,background:'rgba(239,68,68,0.92)',color:'#fff',fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:99}} animate={{scale:[1,1.06,1]}} transition={{repeat:Infinity,duration:1.5}}>⏰ {c.daysRemaining}d</motion.div>)}{done?<div style={{position:'absolute',top:10,right:10,background:'linear-gradient(135deg,#10b981,#34d399)',color:'#fff',fontSize:11,fontWeight:700,padding:'3px 12px',borderRadius:99}}>🎉 COMPLETED</div>:<div style={{position:'absolute',top:10,right:10,background:`${uc[c.urgencyLevel]||'#7c3aed'}22`,border:`1px solid ${uc[c.urgencyLevel]||'#7c3aed'}66`,color:uc[c.urgencyLevel]||'#a78bfa',fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:99,backdropFilter:'blur(8px)'}}>⚡ {c.urgencyLevel||'MEDIUM'}</div>}</div><div style={{padding:'16px 18px',flex:1,display:'flex',flexDirection:'column'}}><span className="chip" style={{fontSize:11,marginBottom:6}}>{c.category||'General'}</span><h3 style={{fontWeight:700,fontSize:14,margin:'4px 0 5px',lineHeight:1.4}}>{c.campaignName}</h3><p style={{fontSize:12,color:'var(--text-muted)',lineHeight:1.6,flex:1,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{c.description}</p><div style={{marginTop:12}}><div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:5}}><span style={{color:'var(--text-muted)'}}>₹{Number(c.collectedAmount||0).toLocaleString('en-IN')} {t('camp.raised')||'raised'}</span><span style={{fontWeight:700,color:'#10b981'}}>{done?'100%':`${pct.toFixed(0)}%`}</span></div><div className="progress-bar"><motion.div className="progress-fill" initial={{width:0}} whileInView={{width:`${pct}%`}} viewport={{once:true}} transition={{duration:1.1,delay:0.3}} style={{background:done||pct>=80?'linear-gradient(90deg,#10b981,#34d399)':'linear-gradient(90deg,var(--primary),var(--primary-light))'}}/></div>{done?<button disabled style={{display:'block',width:'100%',marginTop:12,opacity:0.55,cursor:'not-allowed',background:'rgba(16,185,129,0.1)',color:'#10b981',border:'1px solid rgba(16,185,129,0.3)',fontWeight:700,borderRadius:8,padding:'9px 0',fontSize:13}}>🎉 Campaign Completed</button>:<Link to={`/user/donate/${c.campaignId}`} style={{display:'block',marginTop:12}}><motion.button className="btn-primary-full" whileHover={{scale:1.02}} whileTap={{scale:0.97}}>{t('btn.donateNow')||'Donate Now 💜'}</motion.button></Link>}</div></div></motion.div>);}

export default function Home(){
  const{t,lang}=useLanguage();
  const[stats,setStats]=useState(DEFAULT_STATS);
  const[all,setAll]=useState([]);
  const[loading,setLoading]=useState(true);
  const[search,setSearch]=useState('');
  const[cat,setCat]=useState('All');

  useEffect(()=>{Promise.all([axiosInstance.get('/api/stats/public').catch(()=>({data:{data:DEFAULT_STATS}})),axiosInstance.get('/api/campaigns/public').catch(()=>({data:{data:[]}}))]).then(([s,c])=>{setStats(s.data?.data||DEFAULT_STATS);setAll(c.data?.data||[]);}).finally(()=>setLoading(false));},[]);

  const filtered=all.filter(c=>{const mc=cat==='All'||c.category===cat;const q=search.toLowerCase();const ms=!q||c.campaignName?.toLowerCase().includes(q)||c.description?.toLowerCase().includes(q)||c.category?.toLowerCase().includes(q);return mc&&ms;});
  const clear=()=>{setSearch('');setCat('All');};
  const labels=CATL[lang]||CATL.en;
  const cTxt=lang==='ta'?'வடிப்பான்களை அழிக்கவும்':lang==='hi'?'फ़िल्टर हटाएं':'Clear Filters';
  const noCTxt=lang==='ta'?'பிரச்சாரங்கள் கிடைக்கவில்லை':lang==='hi'?'कोई अभियान नहीं मिला':'No campaigns found.';
  const noCDTxt=lang==='ta'?'உங்கள் தேடலுக்கு பொருந்தும் பிரச்சாரங்கள் இல்லை.':lang==='hi'?'आपकी खोज से मेल खाने वाले अभियान नहीं मिले।':"We couldn't find any campaigns matching your search.";
  const whyTitle=lang==='ta'?'ஏன் ':lang==='hi'?'क्यों चुनें ':lang==='te'?'ఎందుకు ':lang==='ml'?'എന്തുകൊണ്ട് ':lang==='kn'?'ಏಕೆ ':'Why Choose ';
  const whySub=lang==='ta'?'வெளிப்படையான, பாதுகாப்பான மற்றும் தாக்கமான கொடையின் அடித்தளம்':lang==='hi'?'पारदर्शी, सुरक्षित और प्रभावशाली दान का आधार':'The foundation of transparent, secure, and impactful giving';

  return(
    <div style={{background:'var(--bg)',minHeight:'100vh'}}>
      <Navbar/>

      {/* HERO */}
      <section style={{position:'relative',minHeight:'92vh',display:'flex',alignItems:'center',overflow:'hidden',paddingTop:66}}>
        <motion.div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 90% 70% at 40% -10%, rgba(124,58,237,0.4) 0%, transparent 60%)',zIndex:0}} animate={{opacity:[0.7,1,0.7]}} transition={{duration:5,repeat:Infinity}}/>
        <motion.div style={{position:'absolute',width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle,rgba(16,185,129,0.1) 0%,transparent 70%)',right:-100,bottom:-100,zIndex:0}} animate={{scale:[1,1.15,1],rotate:[0,30,0]}} transition={{duration:14,repeat:Infinity}}/>
        {HERO_P.map((p,i)=><FP key={i} {...p}/>)}
        <div className="container" style={{position:'relative',zIndex:2}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:56,alignItems:'center'}}>
            <div>
              <motion.span className="chip chip-glow" style={{marginBottom:20,display:'inline-block'}} initial={{opacity:0,y:-16}} animate={{opacity:1,y:0}} transition={{duration:0.5}}>🌍 {t('transparentGiving')||'Transparent & Secure Giving'}</motion.span>
              <motion.h1 style={{fontSize:'clamp(32px,4.5vw,60px)',fontWeight:900,lineHeight:1.1,marginBottom:20}} initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{duration:0.6,delay:0.1}}>Together We Can<br/><span className="gradient-text">Change Lives</span> ❤️</motion.h1>
              <motion.p style={{fontSize:17,color:'var(--text-muted)',marginBottom:36,lineHeight:1.75,maxWidth:480}} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.6,delay:0.2}}>{t('landing.heroSubtitle')||'Support verified campaigns through secure, transparent, and impactful donations.'}</motion.p>
              <motion.div style={{display:'flex',gap:14,flexWrap:'wrap'}} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.6,delay:0.3}}>
                <a href="#campaigns"><motion.button className="btn-hero-primary" whileHover={{scale:1.05,y:-2}} whileTap={{scale:0.97}}>🔍 {t('browseCampaigns')||'Explore Campaigns'}</motion.button></a>
                <Link to="/register"><motion.button className="btn-hero-secondary" whileHover={{scale:1.05,y:-2}} whileTap={{scale:0.97}}>💜 {t('btn.getStarted')||'Start Fundraising'}</motion.button></Link>
              </motion.div>
              <motion.div style={{display:'flex',gap:20,marginTop:28,flexWrap:'wrap'}} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.6}}>
                {[t('trustBadge1')||'🔒 Bank-grade Security',t('trustBadge2')||'📄 80G Receipts',t('trustBadge3')||'✅ Verified'].map((b,i)=><span key={i} style={{fontSize:12,color:'var(--text-muted)'}}>{b}</span>)}
              </motion.div>
            </div>
            <motion.div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gridTemplateRows:'1fr 1fr',gap:12,height:420}} initial={{opacity:0,x:40}} animate={{opacity:1,x:0}} transition={{duration:0.7,delay:0.2}}>
              {HERO_IMGS.map((img,i)=><motion.div key={i} style={{...img.style,overflow:'hidden'}} whileHover={{scale:1.03}} transition={{duration:0.3}}><img src={img.src} alt={img.alt} style={{width:'100%',height:'100%',objectFit:'cover'}} loading="lazy"/></motion.div>)}
              <motion.div style={{borderRadius:'8px 8px 20px 8px',background:'linear-gradient(135deg,rgba(124,58,237,0.2),rgba(16,185,129,0.12))',border:'1px solid rgba(167,139,250,0.2)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:4}} animate={{y:[0,-6,0]}} transition={{duration:3,repeat:Infinity}}>
                <div style={{fontSize:30,fontWeight:900,color:'var(--primary-light)'}}><Counter target={stats.totalDonors||1450} suffix="+"/></div>
                <div style={{fontSize:12,color:'var(--text-muted)'}}>{t('totalDonors')||'Donors'}</div>
                <div style={{fontSize:22}}>💜</div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{padding:'60px 0',borderTop:'1px solid var(--border)',borderBottom:'1px solid var(--border)'}}>
        <div className="container"><div className="grid-4">
          {[{icon:'🎯',label:t('dashboard.activeCampaigns')||'Active Campaigns',value:stats.totalCampaigns,suffix:'+',color:'#a78bfa'},{icon:'👥',label:t('totalDonors')||'Total Donors',value:stats.totalDonors,suffix:'+',color:'#34d399'},{icon:'💰',label:t('amountRaised')||'Amount Raised',value:stats.totalRaised,big:true,color:'#fbbf24'},{icon:'🤝',label:t('volunteers')||'Volunteers',value:stats.totalVolunteers,suffix:'+',color:'#60a5fa'}].map((s,i)=>(
            <motion.div key={i} className="stat-glass-card" initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:0.5,delay:i*0.1}} whileHover={{y:-4}}>
              <div style={{fontSize:32,marginBottom:8}}>{s.icon}</div>
              <div style={{fontSize:s.big?26:32,fontWeight:900,color:s.color,lineHeight:1}}>{s.big?<span>₹{((s.value||0)/100000).toFixed(1)}L</span>:<Counter target={s.value||0} suffix={s.suffix||''}/>}</div>
              <div style={{fontSize:12,color:'var(--text-muted)',marginTop:6}}>{s.label}</div>
            </motion.div>
          ))}
        </div></div>
      </section>

      {/* SEARCH */}
      <section id="campaigns" style={{padding:'60px 0 24px'}}>
        <div className="container"><motion.div style={{maxWidth:680,margin:'0 auto'}} initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}}>
          <div style={{position:'relative'}}>
            <span style={{position:'absolute',left:20,top:'50%',transform:'translateY(-50%)',fontSize:20,opacity:0.5,pointerEvents:'none'}}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} className="form-control"
              placeholder={lang==='ta'?'பிரச்சாரங்கள், NGO அல்லது காரணங்களை தேடுங்கள்…':lang==='hi'?'अभियान, NGO या कारण खोजें…':'Search campaigns, NGOs, or causes…'}
              style={{paddingLeft:52,paddingRight:search?48:20,fontSize:15,height:54,borderRadius:14,border:'1px solid rgba(167,139,250,0.3)',boxShadow:'0 4px 24px rgba(124,58,237,0.08)'}}/>
            {search&&<button onClick={()=>setSearch('')} style={{position:'absolute',right:16,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',fontSize:18,opacity:0.6,padding:4}}>✕</button>}
          </div>
        </motion.div></div>
      </section>

      {/* CATEGORIES */}
      <section style={{padding:'8px 0 36px'}}><div className="container">
        <div style={{display:'flex',gap:10,flexWrap:'wrap',justifyContent:'center'}}>
          {CATS.map((c2,i)=>{const active=cat===c2.id;return(
            <motion.button key={c2.id} onClick={()=>setCat(c2.id)}
              initial={{opacity:0,y:14}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.04}}
              whileHover={{y:-3,scale:1.05}} whileTap={{scale:0.96}}
              style={{display:'flex',alignItems:'center',gap:6,padding:'8px 18px',borderRadius:99,border:'1px solid',cursor:'pointer',fontSize:13,fontWeight:600,transition:'all 0.2s',
                background:active?'linear-gradient(135deg,var(--primary),var(--primary-light))':'rgba(255,255,255,0.05)',
                borderColor:active?'transparent':'var(--border)',color:active?'#fff':'var(--text-muted)',
                boxShadow:active?'0 4px 16px rgba(124,58,237,0.35)':'none'}}>
              <span>{c2.icon}</span><span>{labels[c2.id]||c2.id}</span>
            </motion.button>
          );})}
        </div>
      </div></section>

      {/* CAMPAIGN GRID */}
      <section style={{padding:'0 0 80px'}}><div className="container">
        {(search||cat!=='All')&&(<motion.div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}} initial={{opacity:0}} animate={{opacity:1}}>
          <span style={{fontSize:14,color:'var(--text-muted)'}}>{filtered.length} {lang==='ta'?'பிரச்சாரங்கள்':lang==='hi'?'अभियान':'campaign(s)'}{cat!=='All'&&<span style={{marginLeft:8,padding:'2px 10px',borderRadius:99,background:'rgba(124,58,237,0.15)',color:'var(--primary-light)',fontSize:12}}>{labels[cat]}</span>}</span>
          <motion.button onClick={clear} whileHover={{scale:1.04}} whileTap={{scale:0.97}} style={{background:'none',border:'1px solid var(--border)',borderRadius:8,padding:'5px 14px',cursor:'pointer',fontSize:12,color:'var(--text-muted)'}}>✕ {cTxt}</motion.button>
        </motion.div>)}
        {loading?(<div className="grid-3">{[0,1,2,3,4,5].map(i=>(<div key={i} className="skeleton-card"><div className="skeleton" style={{height:180}}/><div style={{padding:18}}><div className="skeleton" style={{height:14,width:'55%',marginBottom:10,borderRadius:8}}/><div className="skeleton" style={{height:12,width:'88%',marginBottom:6,borderRadius:8}}/><div className="skeleton" style={{height:12,width:'72%',borderRadius:8}}/></div></div>))}</div>
        ):filtered.length===0?(<motion.div style={{textAlign:'center',padding:'72px 24px'}} initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}}><div style={{fontSize:64,marginBottom:16}}>🔍</div><h3 style={{fontWeight:800,fontSize:22,marginBottom:8}}>{noCTxt}</h3><p style={{color:'var(--text-muted)',marginBottom:28}}>{noCDTxt}</p><motion.button onClick={clear} className="btn-primary-full" style={{width:'auto',padding:'12px 32px',margin:'0 auto',display:'inline-block'}} whileHover={{scale:1.04}} whileTap={{scale:0.97}}>{cTxt}</motion.button></motion.div>
        ):(<div className="grid-3">{filtered.map((c2,i)=><CC key={c2.campaignId} campaign={c2} index={i} t={t}/>)}</div>)}
      </div></section>

      {/* WHY CHOOSE US */}
      <section style={{padding:'80px 0',background:'rgba(124,58,237,0.03)',borderTop:'1px solid var(--border)'}}>
        <div className="container">
          <motion.div style={{textAlign:'center',marginBottom:52}} initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}}>
            <h2 style={{fontSize:'clamp(26px,4vw,40px)',fontWeight:900,marginBottom:10}}>{whyTitle}<span className="gradient-text">New Dawn Foundation?</span></h2>
            <p style={{color:'var(--text-muted)',fontSize:16}}>{whySub}</p>
          </motion.div>
          <div className="grid-3">
            {WHY.map((w,i)=>(
              <motion.div key={i} className="why-feature-card" initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:0.4,delay:i*0.08}} whileHover={{y:-6}}>
                <div style={{fontSize:38,marginBottom:14}}>{w.icon}</div>
                <h3 style={{fontWeight:800,fontSize:16,marginBottom:8}}>{(w[lang]||w.en)}</h3>
                <p style={{fontSize:13,color:'var(--text-muted)',lineHeight:1.65}}>{(w[lang+'D']||w.enD)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{padding:'80px 0'}}><div className="container">
        <motion.div className="cta-glass" style={{textAlign:'center'}} initial={{opacity:0,scale:0.95}} whileInView={{opacity:1,scale:1}} viewport={{once:true}}>
          <h2 style={{fontSize:'clamp(26px,4vw,42px)',fontWeight:900,marginBottom:16,position:'relative',zIndex:1}}>{t('landing.readyTo')||'Ready to'} <span className="gradient-text">{t('landing.makeImpact')||'Make an Impact?'}</span></h2>
          <p style={{color:'var(--text-muted)',fontSize:16,marginBottom:32,position:'relative',zIndex:1}}>{t('landing.ctaSubtitle')||'Join 10,000+ donors who trust New Dawn Foundation for transparent, impactful giving.'}</p>
          <div style={{display:'flex',gap:16,justifyContent:'center',flexWrap:'wrap',position:'relative',zIndex:1}}>
            <Link to="/register"><motion.button className="btn-hero-primary" whileHover={{scale:1.05}} whileTap={{scale:0.97}}>{t('btn.getStarted')||'Get Started Free'}</motion.button></Link>
            <a href="#campaigns"><motion.button className="btn-hero-secondary" whileHover={{scale:1.05}} whileTap={{scale:0.97}}>{t('browseCampaigns')||'Browse Campaigns'}</motion.button></a>
          </div>
        </motion.div>
      </div></section>

      <Footer/>
    </div>
  );
}
