// NAV
const navbar=document.getElementById('navbar');
window.addEventListener('scroll',()=>navbar.classList.toggle('scrolled',window.scrollY>60));

// ─── HERO CURSOR MAGNETIC BACKGROUND ───
const heroEl   = document.getElementById('hero');
const heroOrb  = document.getElementById('heroOrb');
const heroOrb2 = document.getElementById('heroOrb2');
const heroHex  = document.getElementById('heroHex');
const heroCanvas = document.getElementById('heroCanvas');
const ctx = heroCanvas.getContext('2d');

// resize canvas
function resizeCanvas(){
  heroCanvas.width  = heroEl.offsetWidth;
  heroCanvas.height = heroEl.offsetHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// particles
const particles = [];
const PARTICLE_COUNT = window.innerWidth < 640 ? 30 : 60;
for(let i=0;i<PARTICLE_COUNT;i++){
  particles.push({
    x: Math.random()*heroCanvas.width,
    y: Math.random()*heroCanvas.height,
    vx:(Math.random()-0.5)*0.3,
    vy:(Math.random()-0.5)*0.3,
    size: Math.random()*1.5+0.4,
    alpha: Math.random()*0.5+0.1,
    hue: Math.random()<0.7?0:20,
  });
}
let heroMx=heroCanvas.width/2, heroMy=heroCanvas.height/2;

function drawParticles(){
  ctx.clearRect(0,0,heroCanvas.width,heroCanvas.height);
  particles.forEach(p=>{
    const dx=heroMx-p.x, dy=heroMy-p.y;
    const dist=Math.sqrt(dx*dx+dy*dy)||1;
    const force=Math.min(120/dist,0.4);
    p.vx += dx/dist*force*0.012;
    p.vy += dy/dist*force*0.012;
    p.vx*=0.98; p.vy*=0.98;
    p.x+=p.vx; p.y+=p.vy;
    if(p.x<-5) p.x=heroCanvas.width+5;
    if(p.x>heroCanvas.width+5) p.x=-5;
    if(p.y<-5) p.y=heroCanvas.height+5;
    if(p.y>heroCanvas.height+5) p.y=-5;
    ctx.beginPath();
    ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
    ctx.fillStyle=`hsla(${p.hue},100%,55%,${p.alpha})`;
    ctx.fill();
  });
  particles.forEach((a,i)=>{
    particles.slice(i+1).forEach(b=>{
      const dx=a.x-b.x,dy=a.y-b.y;
      const d=Math.sqrt(dx*dx+dy*dy);
      if(d<80){
        ctx.beginPath();
        ctx.moveTo(a.x,a.y);
        ctx.lineTo(b.x,b.y);
        ctx.strokeStyle=`rgba(204,0,0,${0.12*(1-d/80)})`;
        ctx.lineWidth=0.5;
        ctx.stroke();
      }
    });
  });
  requestAnimationFrame(drawParticles);
}
drawParticles();

// orb + hex parallax on mouse
let orbRaf;
heroEl.addEventListener('mousemove',e=>{
  const r=heroEl.getBoundingClientRect();
  const x=e.clientX-r.left, y=e.clientY-r.top;
  heroMx=x; heroMy=y;
  cancelAnimationFrame(orbRaf);
  orbRaf=requestAnimationFrame(()=>{
    heroOrb.style.left=x+'px';
    heroOrb.style.top=y+'px';
    heroOrb2.style.left=x+'px';
    heroOrb2.style.top=y+'px';
    const nx=(x/r.width-0.5)*18, ny=(y/r.height-0.5)*18;
    heroHex.style.backgroundPosition=`${nx}px ${ny}px`;
  });
});
heroEl.addEventListener('mouseleave',()=>{
  heroOrb.style.left='50%'; heroOrb.style.top='50%';
  heroOrb2.style.left='50%'; heroOrb2.style.top='50%';
  heroHex.style.backgroundPosition='0px 0px';
  heroMx=heroCanvas.width/2; heroMy=heroCanvas.height/2;
});
heroOrb.style.left='50%'; heroOrb.style.top='50%';
heroOrb2.style.left='50%'; heroOrb2.style.top='50%';

// ─── SCROLL ANIMATIONS ───
const obs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible');});},{threshold:0.12});
document.querySelectorAll('.reveal,.reveal-left,.reveal-right,.stagger').forEach(el=>obs.observe(el));

// LOGO SLIDE-IN
const logoEl=document.getElementById('sobreLogo');
const logoObs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){logoEl.classList.add('logo-visible');logoObs.unobserve(logoEl);}});},{threshold:0.2});
logoObs.observe(logoEl);

// COUNTERS
const cObs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){const el=e.target,target=parseInt(el.dataset.target);let cur=0;const inc=target/(1500/16);const t=setInterval(()=>{cur+=inc;if(cur>=target){cur=target;clearInterval(t);}el.textContent=Math.floor(cur);},16);cObs.unobserve(el);}});},{threshold:0.5});
document.querySelectorAll('[data-target]').forEach(el=>cObs.observe(el));

// TABS
function switchTab(id, btn){
  document.querySelectorAll('.htab-content').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('.htab').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + id).classList.add('active');
  btn.classList.add('active');
}
document.querySelectorAll('.htab').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab, btn));
});

// ─── GALERIA: marquee CSS-driven (GPU/compositor) ───
// Antes: requestAnimationFrame infinito + scrollLeft + drag/momentum custosos.
// Agora: animação CSS sobre transform (compositor thread), pausada via classe
//        quando offscreen ou em hover/touch. Muito menos main-thread work.
const galeriaOuter = document.getElementById('galeriaOuter');
const galeriaTrack = document.getElementById('galeriaTrack');

if (galeriaOuter && galeriaTrack) {
  const galeriaOriginals = Array.from(galeriaTrack.children).filter(el => !el.dataset?.clone);

  function galeriaGap() {
    const s = getComputedStyle(galeriaTrack);
    return parseFloat(s.columnGap || s.gap) || 0;
  }

  function galeriaRemoveClones() {
    galeriaTrack.querySelectorAll('[data-clone="true"]').forEach(el => el.remove());
  }

  function galeriaCloneOnce() {
    const frag = document.createDocumentFragment();
    galeriaOriginals.forEach(item => {
      const clone = item.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.dataset.clone = 'true';
      clone.querySelectorAll('img').forEach(img => { img.loading = 'eager'; });
      frag.appendChild(clone);
    });
    galeriaTrack.appendChild(frag);
  }

  function galeriaMeasureCycle() {
    const gap = galeriaGap();
    const cycle = galeriaOriginals.reduce((sum, el) => sum + el.offsetWidth + gap, 0);
    if (cycle <= 0) return;
    galeriaTrack.style.setProperty('--galeria-cycle', cycle + 'px');
    // velocidade alvo (px/s): mais lento em telas pequenas para conforto visual
    const speed = window.innerWidth < 640 ? 40 : 70;
    galeriaTrack.style.setProperty('--galeria-duration', (cycle / speed).toFixed(2) + 's');
  }

  function galeriaSetup() {
    galeriaRemoveClones();
    galeriaCloneOnce();
    galeriaMeasureCycle();
  }

  galeriaSetup();
  window.addEventListener('load', galeriaSetup);

  // Recalcula quando imagens carregarem (largura real)
  galeriaTrack.querySelectorAll('img').forEach(img => {
    if (!img.complete) img.addEventListener('load', galeriaMeasureCycle, { once: true });
  });

  // Re-medição em resize (debounced)
  let galeriaResizeT;
  window.addEventListener('resize', () => {
    clearTimeout(galeriaResizeT);
    galeriaResizeT = setTimeout(galeriaSetup, 180);
  });

  // Pausa quando a seção sai do viewport (zero CPU/GPU enquanto offscreen)
  const galeriaIO = new IntersectionObserver(entries => {
    entries.forEach(e => galeriaTrack.classList.toggle('is-paused', !e.isIntersecting));
  }, { threshold: 0 });
  galeriaIO.observe(galeriaOuter);

  // Pausa em hover (desktop)
  galeriaOuter.addEventListener('mouseenter', () => galeriaTrack.classList.add('is-paused'));
  galeriaOuter.addEventListener('mouseleave', () => galeriaTrack.classList.remove('is-paused'));

  // Pausa em touch (mobile) — retoma 1.8s após o fim do toque
  let galeriaTouchT;
  galeriaOuter.addEventListener('touchstart', () => {
    clearTimeout(galeriaTouchT);
    galeriaTrack.classList.add('is-paused');
  }, { passive: true });
  galeriaOuter.addEventListener('touchend', () => {
    clearTimeout(galeriaTouchT);
    galeriaTouchT = setTimeout(() => galeriaTrack.classList.remove('is-paused'), 1800);
  }, { passive: true });
}

// FORM → WhatsApp
function handleSubmit(e){
  e.preventDefault();
  const nome = document.getElementById('fNome').value;
  const phone = document.getElementById('fTel').value;
  const mod = document.getElementById('fModalidade').value;
  const turno = document.getElementById('fTurno').value;
  const msg = encodeURIComponent(`Opa! Me chamo ${nome} e vim pelo site da Mathelo Team.\nContato: ${phone ||'Não informado'}\nModalidade: ${mod||'A definir'}\nTurno preferido: ${turno||'A definir'}\n\nGostaria de agendar minha aula experimental!`);
  const toast = document.getElementById('toast');

  toast.style.transform ='translateY(0)';toast.style.opacity='1';
  setTimeout(()=>{window.open('https://wa.me/5537984038588?text='+msg,'_blank');toast.style.transform='translateY(100px)';toast.style.opacity='0';},700);
  e.target.reset();
}
const contatoForm = document.getElementById('contatoForm');
if (contatoForm) contatoForm.addEventListener('submit', handleSubmit);

// PARALLAX HERO
window.addEventListener('scroll',()=>{
  const sy=window.scrollY,hc=document.querySelector('.hero-content');
  if(hc&&sy<window.innerHeight){hc.style.transform=`translateY(${sy*0.3}px)`;hc.style.opacity=1-(sy/(window.innerHeight*0.8));}
});

// ─── PLANO GUERREIRO: TOGGLE 3x / 5x ───
(function(){
  const card = document.getElementById('plano-guerreiro');
  if(!card) return;
  const PRICES = { '3': '169,90','5': '199,90' } ;
  const priceEl = card.querySelector('.plano-price-value');
  const featEl  = card.querySelector('.plano-feat-freq');
  const btn     = card.querySelector('.plano-btn');
  const waBase  = btn ? btn.getAttribute('data-wa-base') : '';
  const opts    = card.querySelectorAll('.freq-opt');

  function setFreq(freq){
    if(!PRICES[freq]) return;
    if(priceEl){
      priceEl.classList.add('swap');
      setTimeout(()=>{
        priceEl.textContent = PRICES[freq];
        priceEl.classList.remove('swap');
      }, 140);
    }
    if(featEl) featEl.textContent = 'Acesso ' + freq + 'x por semana';
    if(btn && waBase){
      btn.setAttribute('href', 'https://wa.me/5537984038588?text=' + waBase.replace('{FREQ}', freq));
    }
    opts.forEach(o => {
      const isActive = o.dataset.freq === freq;
      o.classList.toggle('active', isActive);
      o.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  }
  opts.forEach(o => o.addEventListener('click', () => setFreq(o.dataset.freq)));
})();
