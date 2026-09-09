(() => {
  const classes = [
    {id:'sentinel',name:'Sentinel',role:'Vanguard',resource:'Resolve',tagline:'An iron-wall bruiser who converts pressure into retaliation.'},
    {id:'aetherblade',name:'Aetherblade',role:'Spellblade',resource:'Flux',tagline:'A mobile duelist weaving blade arcs through unstable aether.'},
    {id:'thornspeaker',name:'Thornspeaker',role:'Wildcaller',resource:'Bloom',tagline:'A nature hexer who roots prey and lets the wild finish the job.'},
    {id:'revenant',name:'Revenant',role:'Bloodbound',resource:'Essence',tagline:'A relentless melee hunter who steals life and refuses to stay down.'},
    {id:'tempest',name:'Tempest',role:'Stormweaver',resource:'Charge',tagline:'A ranged storm caster chaining violent weather through clustered foes.'},
    {id:'starbinder',name:'Starbinder',role:'Astral Sage',resource:'Astral',tagline:'A control-support mage bending gravity, wards, and distant light.'}
  ];

  const $ = id => document.getElementById(id);
  const grid = $('class-grid');
  const enter = $('enter-btn');
  let selected = null;

  function showError(err){
    const box=$('fatal-error'), text=$('fatal-error-text');
    if(box && text){
      text.textContent = err?.stack || err?.message || String(err);
      box.classList.remove('hidden');
    }
    $('boot-status').textContent='Startup failed — error shown above';
  }
  window.__gptRealmsShowError = showError;

  grid.innerHTML='';
  for(const c of classes){
    const card=document.createElement('button');
    card.type='button';
    card.className='class-card';
    card.dataset.classId=c.id;
    card.innerHTML=`<strong>${c.name}</strong><span>${c.role} · ${c.resource}</span><p>${c.tagline}</p>`;
    card.addEventListener('click',()=>{
      selected=c.id;
      [...grid.children].forEach(x=>x.classList.remove('selected'));
      card.classList.add('selected');
      $('picked-name').textContent=c.name;
      $('picked-tagline').textContent=c.tagline;
      enter.disabled=false;
    });
    grid.appendChild(card);
  }

  $('boot-status').textContent='Ready — choose a class';

  enter.addEventListener('click', async ()=>{
    if(!selected) return;
    enter.disabled=true;
    enter.textContent='Entering…';
    $('boot-status').textContent='Building Aestra…';
    try{
      const mod=await import('/game-bundle.js?v=032');
      await mod.startGame(selected);
      $('launcher').classList.add('hidden');
      $('hud').classList.remove('hidden');
      $('boot-status').textContent='World loaded';
      setTimeout(()=>$('boot-status')?.classList.add('hidden'),1200);
    }catch(err){
      enter.disabled=false;
      enter.textContent='Enter Aestra';
      showError(err);
    }
  });

  window.addEventListener('error',e=>showError(e.error||e.message||'JavaScript error'));
  window.addEventListener('unhandledrejection',e=>showError(e.reason||'Unhandled promise rejection'));
})();