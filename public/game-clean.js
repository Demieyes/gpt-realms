import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';

const CLASS_DEF = {
  sentinel:    { name:'Sentinel',    hp:155, power:15, speed:7.0, color:0x557fa8, resource:'Resolve', abilities:['Shieldbreak','Bulwark','Iron Rush','Last Bastion'], gear:'swordShield' },
  aetherblade: { name:'Aetherblade', hp:112, power:20, speed:7.6, color:0x8657d4, resource:'Flux',    abilities:['Rift Cut','Phase Step','Arc Echo','Zero Meridian'], gear:'dualBlade' },
  thornspeaker:{ name:'Thornspeaker',hp:120, power:17, speed:7.2, color:0x4f9c5f, resource:'Bloom',   abilities:['Briar Lash','Grasping Soil','Verdant Mend','Ancient Grove'], gear:'staff' },
  revenant:    { name:'Revenant',    hp:135, power:19, speed:7.3, color:0x8e4249, resource:'Essence', abilities:['Gravehook','Siphon','Wraithwalk','Debt of Death'], gear:'scythe' },
  tempest:     { name:'Tempest',     hp:98,  power:23, speed:7.4, color:0x3f9fc5, resource:'Charge',  abilities:['Static Spear','Thunder Ring','Gale Shift','Skyfall'], gear:'stormStaff' },
  starbinder:  { name:'Starbinder',  hp:108, power:18, speed:7.2, color:0xb692d0, resource:'Astral',  abilities:['Comet Thread','Gravity Well','Astral Ward','Constellation'], gear:'wand' }
};


const ABILITY_PROFILE = {
  Shieldbreak:    { anim:'Punch',    vfx:'slash',      mult:1.35, range:5.5, color:0xe6c36a },
  Bulwark:        { anim:'Yes',      vfx:'shield',     mult:0,    range:0,   color:0x8eb7ff, self:true },
  'Iron Rush':    { anim:'Running',  vfx:'dash',       mult:1.15, range:6.5, color:0xb9d2ff },
  'Last Bastion': { anim:'Jump',     vfx:'nova',       mult:1.85, range:7.0, color:0xffd76b },

  'Rift Cut':     { anim:'Punch',    vfx:'arc',        mult:1.4,  range:6.0, color:0xb783ff },
  'Phase Step':   { anim:'Running',  vfx:'dash',       mult:1.1,  range:7.0, color:0x9b66ff },
  'Arc Echo':     { anim:'Wave',     vfx:'pulse',      mult:1.35, range:8.0, color:0xc7a4ff },
  'Zero Meridian':{ anim:'Dance',    vfx:'beam',       mult:2.05, range:9.0, color:0xe1c8ff },

  'Briar Lash':   { anim:'Punch',    vfx:'projectile', mult:1.3,  range:9.0, color:0x6edb6e },
  'Grasping Soil':{ anim:'Wave',     vfx:'root',       mult:1.0,  range:9.0, color:0x77a44f },
  'Verdant Mend': { anim:'ThumbsUp', vfx:'heal',       mult:0,    range:0,   color:0x70ef92, self:true, heal:38 },
  'Ancient Grove':{ anim:'Dance',    vfx:'nova',       mult:1.75, range:8.0, color:0x8edb6b },

  Gravehook:      { anim:'Punch',    vfx:'hook',       mult:1.35, range:8.0, color:0xc86570 },
  Siphon:         { anim:'Wave',     vfx:'leech',      mult:1.15, range:8.0, color:0xd16478, leech:.55 },
  Wraithwalk:     { anim:'Running',  vfx:'dash',       mult:1.2,  range:7.0, color:0x8c6aad },
  'Debt of Death':{ anim:'Jump',     vfx:'nova',       mult:1.9,  range:7.5, color:0xa24a66 },

  'Static Spear': { anim:'Punch',    vfx:'projectile', mult:1.45, range:12.0,color:0x67d9ff },
  'Thunder Ring': { anim:'Jump',     vfx:'nova',       mult:1.45, range:8.0, color:0x8fe7ff },
  'Gale Shift':   { anim:'Running',  vfx:'dash',       mult:1.0,  range:7.0, color:0xb4f5ff },
  Skyfall:        { anim:'Wave',     vfx:'sky',        mult:2.15, range:13.0,color:0x75cfff },

  'Comet Thread': { anim:'Punch',    vfx:'projectile', mult:1.35, range:11.0,color:0xd7b1ff },
  'Gravity Well': { anim:'Wave',     vfx:'gravity',    mult:1.15, range:10.0,color:0x8b6bb4 },
  'Astral Ward':  { anim:'Yes',      vfx:'shield',     mult:0,    range:0,   color:0xca9fff, self:true },
  Constellation:  { anim:'Dance',    vfx:'stars',      mult:1.9,  range:9.0, color:0xead2ff }
};

const $ = id => document.getElementById(id);
const clamp = (n,a,b) => Math.max(a, Math.min(b,n));
let running = false;

function clipByName(clips, wanted) {
  return clips.find(c => c.name.toLowerCase() === wanted.toLowerCase())
    || clips.find(c => c.name.toLowerCase().includes(wanted.toLowerCase()))
    || clips[0];
}

function makeAnimationController(root, clips) {
  const mixer = new THREE.AnimationMixer(root);
  const actions = {};
  clips.forEach(clip => {
    actions[clip.name] = mixer.clipAction(clip);
  });

  let current = null;
  function action(name) {
    return actions[name] || Object.entries(actions).find(([k]) => k.toLowerCase() === name.toLowerCase())?.[1];
  }
  function loop(name, fade=.18) {
    const next = action(name);
    if (!next || next === current) return;
    if (current) current.fadeOut(fade);
    next.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(fade).play();
    current = next;
  }
  function once(name, onDone, fade=.08) {
    const next = action(name);
    if (!next) { onDone?.(); return; }
    if (current) current.fadeOut(fade);
    next.reset().setLoop(THREE.LoopOnce,1);
    next.clampWhenFinished = true;
    next.fadeIn(fade).play();
    current = next;
    const done = e => {
      if (e.action !== next) return;
      mixer.removeEventListener('finished', done);
      onDone?.();
    };
    mixer.addEventListener('finished', done);
  }
  return { mixer, actions, loop, once, get current(){ return current; } };
}

function tintModel(root, color) {
  const tint = new THREE.Color(color);
  root.traverse(obj => {
    if (!obj.isMesh) return;
    obj.castShadow = true;
    obj.receiveShadow = true;
    if (obj.material) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      const cloned = mats.map(m => {
        const c = m.clone();
        if (c.color) c.color.lerp(tint, .28);
        if ('roughness' in c) c.roughness = Math.max(.55, c.roughness ?? .8);
        return c;
      });
      obj.material = Array.isArray(obj.material) ? cloned : cloned[0];
    }
  });
}

function findHand(root, right=true) {
  const names = [];
  root.traverse(o => names.push(o));
  const patterns = right
    ? [/right.*hand/i,/hand.*right/i,/hand[_ .-]?r$/i,/r[_ .-]?hand/i]
    : [/left.*hand/i,/hand.*left/i,/hand[_ .-]?l$/i,/l[_ .-]?hand/i];
  return names.find(o => patterns.some(p => p.test(o.name))) || null;
}

function makeWeapon(def, playerRoot) {
  const group = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({color:def.color,metalness:.65,roughness:.28,emissive:new THREE.Color(def.color).multiplyScalar(.12)});
  const dark = new THREE.MeshStandardMaterial({color:0x2a2622,metalness:.15,roughness:.75});

  const blade = (len=.9,w=.10) => {
    const g=new THREE.Group();
    const b=new THREE.Mesh(new THREE.BoxGeometry(w,len,.06),metal); b.position.y=len/2+.08; g.add(b);
    const h=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,.28,8),dark); h.position.y=-.06; g.add(h);
    return g;
  };
  const staff = (orbColor=def.color) => {
    const g=new THREE.Group();
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.04,.055,1.65,8),dark); pole.position.y=.7;g.add(pole);
    const orb=new THREE.Mesh(new THREE.SphereGeometry(.13,12,8),new THREE.MeshStandardMaterial({color:orbColor,emissive:orbColor,emissiveIntensity:1.2})); orb.position.y=1.58;g.add(orb);
    return g;
  };

  if(def.gear==='swordShield'){
    const sw=blade(1.0,.11); sw.rotation.z=-.12; group.add(sw);
    const shield=new THREE.Mesh(new THREE.CylinderGeometry(.36,.36,.10,8),metal);shield.rotation.x=Math.PI/2;shield.position.set(-.45,.55,.15);group.add(shield);
  } else if(def.gear==='dualBlade'){
    const a=blade(.82,.085);a.position.x=.22;a.rotation.z=-.14;group.add(a);
    const b=blade(.82,.085);b.position.x=-.22;b.rotation.z=.14;group.add(b);
  } else if(def.gear==='scythe'){
    const s=staff(0xd26472);group.add(s);
    const arc=new THREE.Mesh(new THREE.TorusGeometry(.34,.055,6,16,Math.PI),metal);arc.position.set(.25,1.56,0);arc.rotation.z=-.35;group.add(arc);
  } else if(def.gear==='staff' || def.gear==='stormStaff'){
    group.add(staff(def.gear==='stormStaff'?0x65d9ff:def.color));
  } else {
    const w=blade(.55,.06);w.position.y=.18;group.add(w);
  }

  // Do not parent prototype weapons directly to RobotExpressive bones.
  // That rig uses bone-space transforms that can massively scale child meshes.
  // Mount gear on the outer player group at a stable world scale for now.
  group.scale.setScalar(.42);
  const safeRoot = playerRoot.parent || playerRoot;
  safeRoot.add(group);

  if(def.gear==='swordShield'){
    group.position.set(.52,.82,.05);
    group.rotation.set(0,0,-.18);
  } else if(def.gear==='dualBlade'){
    group.position.set(.48,.88,.02);
    group.rotation.set(0,0,-.12);
  } else if(def.gear==='scythe'){
    group.position.set(.62,.62,.06);
    group.rotation.set(0,0,-.20);
  } else if(def.gear==='staff' || def.gear==='stormStaff'){
    group.position.set(.58,.48,.08);
    group.rotation.set(0,0,-.10);
  } else {
    group.position.set(.50,.92,.04);
    group.rotation.set(0,0,-.18);
  }

  return group;
}

function makeSlash(scene, pos, color) {
  const mat=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.95,side:THREE.DoubleSide,depthWrite:false});
  const geo=new THREE.RingGeometry(.65,1.0,28,1,0,Math.PI*1.45);
  const mesh=new THREE.Mesh(geo,mat);
  mesh.position.copy(pos).add(new THREE.Vector3(0,1.15,0));
  mesh.rotation.set(-.15,0,0);
  scene.add(mesh);
  const start=performance.now();
  function tick(){
    const t=(performance.now()-start)/260;
    if(t>=1){scene.remove(mesh);geo.dispose();mat.dispose();return}
    mesh.scale.setScalar(.75+t*.8);
    mesh.rotation.z=-.9+t*1.6;
    mat.opacity=1-t;
    requestAnimationFrame(tick);
  }
  tick();
}


function makePulse(scene, pos, color, radius=1.2, duration=420) {
  const mat=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.9,side:THREE.DoubleSide,depthWrite:false});
  const geo=new THREE.RingGeometry(.18,.28,40);
  const ring=new THREE.Mesh(geo,mat);
  ring.rotation.x=-Math.PI/2;
  ring.position.copy(pos).add(new THREE.Vector3(0,.05,0));
  scene.add(ring);
  const start=performance.now();
  function tick(){
    const t=(performance.now()-start)/duration;
    if(t>=1){scene.remove(ring);geo.dispose();mat.dispose();return}
    ring.scale.setScalar(.6+t*radius*3.5);
    mat.opacity=(1-t)*.9;
    requestAnimationFrame(tick);
  }
  tick();
}

function makeShield(scene, pos, color) {
  const geo=new THREE.SphereGeometry(1.15,20,14);
  const mat=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.24,wireframe:true,depthWrite:false});
  const mesh=new THREE.Mesh(geo,mat);
  mesh.position.copy(pos).add(new THREE.Vector3(0,1.05,0));
  scene.add(mesh);
  const start=performance.now();
  function tick(){
    const t=(performance.now()-start)/700;
    if(t>=1){scene.remove(mesh);geo.dispose();mat.dispose();return}
    mesh.rotation.y+=.06;
    mesh.scale.setScalar(.95+Math.sin(t*Math.PI)*.18);
    mat.opacity=.28*(1-t);
    requestAnimationFrame(tick);
  }
  tick();
}

function makeProjectile(scene, from, to, color, kind='orb') {
  const mat=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.95});
  const geo=kind==='hook' ? new THREE.TorusGeometry(.16,.04,6,12,Math.PI*1.6) : new THREE.SphereGeometry(.11,10,8);
  const mesh=new THREE.Mesh(geo,mat);
  const a=from.clone().add(new THREE.Vector3(0,1.15,0));
  const b=to.clone().add(new THREE.Vector3(0,1.0,0));
  mesh.position.copy(a);
  scene.add(mesh);
  const start=performance.now();
  function tick(){
    const t=Math.min(1,(performance.now()-start)/260);
    mesh.position.lerpVectors(a,b,t);
    mesh.rotation.z+=.22;
    if(t>=1){scene.remove(mesh);geo.dispose();mat.dispose();return}
    requestAnimationFrame(tick);
  }
  tick();
}

function makeBeam(scene, from, to, color, vertical=false) {
  const a=vertical ? to.clone().add(new THREE.Vector3(0,7,0)) : from.clone().add(new THREE.Vector3(0,1.2,0));
  const b=to.clone().add(new THREE.Vector3(0,1.0,0));
  const mid=a.clone().add(b).multiplyScalar(.5);
  const len=a.distanceTo(b);
  const geo=new THREE.CylinderGeometry(.07,.14,len,10);
  const mat=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.7});
  const mesh=new THREE.Mesh(geo,mat);
  mesh.position.copy(mid);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize());
  scene.add(mesh);
  const start=performance.now();
  function tick(){
    const t=(performance.now()-start)/330;
    if(t>=1){scene.remove(mesh);geo.dispose();mat.dispose();return}
    mesh.scale.x=mesh.scale.z=1+Math.sin(t*Math.PI)*1.8;
    mat.opacity=.75*(1-t);
    requestAnimationFrame(tick);
  }
  tick();
}

function makeStars(scene, pos, color) {
  const group=new THREE.Group();
  group.position.copy(pos).add(new THREE.Vector3(0,1.0,0));
  const mat=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.95});
  for(let i=0;i<10;i++){
    const m=new THREE.Mesh(new THREE.OctahedronGeometry(.08,0),mat);
    const a=i*Math.PI*2/10;
    m.position.set(Math.cos(a)*1.1,(i%3)*.32,Math.sin(a)*1.1);
    group.add(m);
  }
  scene.add(group);
  const start=performance.now();
  function tick(){
    const t=(performance.now()-start)/650;
    if(t>=1){scene.remove(group);mat.dispose();return}
    group.rotation.y+=.08;
    group.scale.setScalar(.8+t*.8);
    mat.opacity=1-t;
    requestAnimationFrame(tick);
  }
  tick();
}

function floatingDamage(container, camera, worldPos, amount, color='#ffd46b') {
  const el=document.createElement('div');
  el.textContent='-'+amount;
  el.style.cssText=`position:fixed;z-index:40;pointer-events:none;color:${color};font:700 20px system-ui;text-shadow:0 2px 4px #000;transform:translate(-50%,-50%);transition:opacity .18s;`;
  document.body.appendChild(el);
  const start=performance.now();
  function frame(){
    const t=(performance.now()-start)/650;
    if(t>=1){el.remove();return}
    const p=worldPos.clone().add(new THREE.Vector3(0,1.5+t*.8,0)).project(camera);
    el.style.left=((p.x*.5+.5)*innerWidth)+'px';
    el.style.top=((-p.y*.5+.5)*innerHeight)+'px';
    el.style.opacity=String(1-t);
    requestAnimationFrame(frame);
  }
  frame();
}

export async function startGame(classId) {
  if (running) return;
  running = true;

  const def = CLASS_DEF[classId] || CLASS_DEF.sentinel;
  const mount = $('game');
  $('boot-status').textContent='Loading animated character rigs…';

  const loader = new GLTFLoader();
  const loadGLB = url => new Promise((resolve,reject)=>loader.load(url,resolve,undefined,reject));
  const [playerGltf, foxGltf] = await Promise.all([
    loadGLB('/assets/models/wayfarer.glb'),
    loadGLB('/assets/models/ember-fox.glb')
  ]);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x728f9b);
  scene.fog = new THREE.FogExp2(0x728f9b,.0045);

  const camera = new THREE.PerspectiveCamera(58,innerWidth/innerHeight,.1,650);
  const renderer = new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));
  renderer.setSize(innerWidth,innerHeight);
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  mount.replaceChildren(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xcce7ff,0x3b2b1b,1.5));
  const sun=new THREE.DirectionalLight(0xffe3b4,2.15);sun.position.set(-35,55,22);sun.castShadow=true;
  sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-70;sun.shadow.camera.right=70;sun.shadow.camera.top=70;sun.shadow.camera.bottom=-70;scene.add(sun);

  const groundMat=new THREE.MeshStandardMaterial({color:0x76593d,roughness:1});
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(420,420,30,30),groundMat);
  ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);

  const road=new THREE.Mesh(new THREE.PlaneGeometry(13,180),new THREE.MeshStandardMaterial({color:0x4b4338,roughness:1}));
  road.rotation.x=-Math.PI/2;road.position.set(0,.025,-38);road.receiveShadow=true;scene.add(road);

  function box(x,y,z,w,h,d,color){
    const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,roughness:.88}));
    m.position.set(x,y+h/2,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;
  }
  box(-13,0,-15,12,6,9,0x6e573e);box(14,0,-18,10,5,8,0x5e4a38);box(-20,0,-39,8,5,8,0x745e45);
  for(let i=0;i<46;i++){
    const a=i*2.399,r=29+(i%10)*10.4,x=Math.cos(a)*r,z=Math.sin(a)*r-25;
    const trunk=box(x,0,z,.7,3.2+(i%3)*.5,.7,0x4b3323);
    const crown=new THREE.Mesh(new THREE.ConeGeometry(2.0+(i%3)*.24,5.2,8),new THREE.MeshStandardMaterial({color:i%2?0x3d6440:0x496f45,roughness:1}));
    crown.position.set(x,trunk.position.y+4,z);crown.castShadow=true;scene.add(crown);
  }
  for(let i=0;i<36;i++) box((i*19)%126-63,0,((i*37)%126)-70,.8+(i%4),.4+(i%3)*.25,.9+(i%5)*.55,0x574a3d);

  const player=new THREE.Group();
  scene.add(player);player.position.set(0,0,8);

  const playerModel=playerGltf.scene;
  tintModel(playerModel,def.color);
  playerModel.scale.setScalar(.62);
  playerModel.position.y=0;
  playerModel.rotation.y=Math.PI;
  player.add(playerModel);
  makeWeapon(def,playerModel);

  const pAnim=makeAnimationController(playerModel,playerGltf.animations);
  pAnim.loop('Idle',0);

  const targetRing=new THREE.Mesh(
    new THREE.RingGeometry(.75,.92,36),
    new THREE.MeshBasicMaterial({color:0xffc45e,transparent:true,opacity:.9,side:THREE.DoubleSide,depthWrite:false})
  );
  targetRing.rotation.x=-Math.PI/2;targetRing.position.y=.035;targetRing.visible=false;scene.add(targetRing);

  const enemies=[];
  const foxClips=foxGltf.animations;
  function spawnEnemy(i){
    const root=new THREE.Group();
    const model=cloneSkinned(foxGltf.scene);
    model.scale.setScalar(.025);
    model.rotation.y=0;
    model.traverse(o=>{
      if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.userData.enemyRoot=root}
    });
    root.add(model);
    root.position.set(((i*19)%70)-35,0,-26-((i*29)%82));
    root.userData={
      id:'mob'+i,name:i%2?'Cinderling Prowler':'Saltfang',hp:52+(i%2)*20,maxHp:52+(i%2)*20,
      home:root.position.clone(),wanderPhase:i*1.7,dead:false,flashUntil:0
    };
    root.traverse(o=>o.userData.enemyRoot=root);
    root.userData.anim=makeAnimationController(model,foxClips);
    root.userData.anim.loop('Survey',0);
    scene.add(root);enemies.push(root);
  }
  for(let i=0;i<12;i++) spawnEnemy(i);

  let yaw=Math.PI,camYaw=Math.PI,camPitch=-.25,camDist=8.5,vy=0,onGround=true,target=null;
  let combatLocked=false,locomotion='Idle';
  const keys=new Set(),mouse={left:false,right:false,lastX:0,lastY:0};
  const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
  let level=1,maxHp=def.hp,power=def.power,hp=maxHp,xp=0,xpNeeded=100,kills=0,lastAttack=0;

  $('player-name').textContent=def.name;
  $('level-text').textContent='1';
  $('hp-text').textContent=`${hp} / ${maxHp}`;
  $('resource-text').textContent=`100 ${def.resource}`;
  $('zone-mood').textContent='Ash winds over the copper coast.';
  const bar=$('actionbar');bar.innerHTML='';
  def.abilities.forEach((name,i)=>{
    const d=document.createElement('div');d.className='slot';d.innerHTML=`<em>${i+1}</em><b>${name}</b>`;bar.appendChild(d);
  });

  const showToast=t=>{const x=$('toast');x.textContent=t;x.style.opacity='1';setTimeout(()=>x.style.opacity='0',850)};
  updateProgressUI();
  function setTarget(t){
    target=t&&!t.userData.dead?t:null;
    if(!target){$('target-frame').classList.add('hidden');targetRing.visible=false;return}
    $('target-frame').classList.remove('hidden');
    $('target-name').textContent=target.userData.name;
    $('target-hp').style.width=(100*target.userData.hp/target.userData.maxHp)+'%';
    targetRing.visible=true;
  }

  function playOneShot(name,done){
    combatLocked=true;
    pAnim.once(name,()=>{
      combatLocked=false;
      pAnim.loop(locomotion);
      done?.();
    });
  }

  function updateProgressUI(){
    $('level-text').textContent=String(level);
    $('hp-text').textContent=`${hp} / ${maxHp}`;
    $('hp-fill').style.width=(100*hp/maxHp)+'%';
    $('xp-fill').style.width=(100*xp/xpNeeded)+'%';
    $('xp-text').textContent=`${xp} / ${xpNeeded} XP`;
  }

  function awardXP(amount){
    xp+=amount;
    let leveled=false;
    while(xp>=xpNeeded){
      xp-=xpNeeded;
      level++;
      xpNeeded=Math.round(100*Math.pow(1.28,level-1));
      maxHp=Math.round(def.hp*(1+0.09*(level-1)));
      power=Math.round(def.power*(1+0.07*(level-1)));
      hp=maxHp;
      leveled=true;
    }
    if(leveled){
      showToast(`LEVEL ${level}! HP and Power increased`);
      makePulse(scene,player.position.clone(),0xffdf79,2.4,800);
    }
    updateProgressUI();
  }

  function damageTarget(amount, profile){
    if(!target||target.userData.dead)return;
    const victim=target;
    victim.userData.hp=Math.max(0,victim.userData.hp-amount);
    victim.userData.flashUntil=performance.now()+120;
    floatingDamage(document.body,camera,victim.position.clone(),amount);
    $('target-hp').style.width=(100*victim.userData.hp/victim.userData.maxHp)+'%';

    if(profile?.leech){
      const heal=Math.max(1,Math.round(amount*profile.leech));
      hp=Math.min(maxHp,hp+heal);
      updateProgressUI();
    }

    if(victim.userData.hp<=0){
      victim.userData.dead=true;
      victim.userData.anim.loop('Survey');
      kills++;
      awardXP(25);
      $('quest-text').textContent=`Cinderlings slain: ${Math.min(kills,5)} / 5`;
      setTarget(null);
      const start=performance.now();
      const shrink=()=>{
        const t=(performance.now()-start)/420;
        if(t>=1){scene.remove(victim);return}
        victim.scale.setScalar(1-t*.85);victim.position.y=-t*.35;requestAnimationFrame(shrink);
      };
      shrink();
    }
  }

  function useAbility(index){
    const name=def.abilities[index];
    const profile=ABILITY_PROFILE[name] || {anim:'Punch',vfx:'slash',mult:1.2,range:6,color:def.color};
    const now=performance.now();
    if(now-lastAttack<620)return;
    lastAttack=now;

    if(profile.self){
      playOneShot(profile.anim);
      if(profile.vfx==='shield')makeShield(scene,player.position.clone(),profile.color);
      if(profile.vfx==='heal'){
        makePulse(scene,player.position.clone(),profile.color,2.0,650);
        hp=Math.min(maxHp,hp+(profile.heal||30));
        updateProgressUI();
        floatingDamage(document.body,camera,player.position.clone(),profile.heal||30,'#7cff9a');
      }
      showToast(name);
      return;
    }

    if(!target||target.userData.dead){showToast('Select a target');return}
    const dist=player.position.distanceTo(target.position);
    if(dist>(profile.range||6)){showToast('Out of range');return}

    const victim=target;
    const damage=Math.round(power*(profile.mult||1));
    playOneShot(profile.anim);

    switch(profile.vfx){
      case 'slash': makeSlash(scene,player.position.clone(),profile.color); break;
      case 'arc': makeSlash(scene,victim.position.clone(),profile.color); makePulse(scene,victim.position.clone(),profile.color,.8,300); break;
      case 'dash': {
        const dir=victim.position.clone().sub(player.position);dir.y=0;if(dir.lengthSq()>0)dir.normalize();
        makePulse(scene,player.position.clone(),profile.color,.7,260);
        player.position.addScaledVector(dir,Math.min(2.3,Math.max(0,dist-1.8)));
        makePulse(scene,player.position.clone(),profile.color,.7,260);
        break;
      }
      case 'nova': makePulse(scene,player.position.clone(),profile.color,2.2,520); break;
      case 'pulse': makePulse(scene,victim.position.clone(),profile.color,1.5,430); break;
      case 'projectile': makeProjectile(scene,player.position.clone(),victim.position.clone(),profile.color,'orb'); break;
      case 'hook': makeProjectile(scene,player.position.clone(),victim.position.clone(),profile.color,'hook'); break;
      case 'root': makePulse(scene,victim.position.clone(),profile.color,1.1,700); break;
      case 'leech': makeBeam(scene,victim.position.clone(),player.position.clone(),profile.color,false); break;
      case 'beam': makeBeam(scene,player.position.clone(),victim.position.clone(),profile.color,false); break;
      case 'sky': makeBeam(scene,player.position.clone(),victim.position.clone(),profile.color,true); break;
      case 'gravity': makePulse(scene,victim.position.clone(),profile.color,1.9,650); break;
      case 'stars': makeStars(scene,victim.position.clone(),profile.color); break;
      default: makeSlash(scene,player.position.clone(),profile.color);
    }

    setTimeout(()=>damageTarget(damage,profile),profile.vfx==='projectile'||profile.vfx==='hook'?250:150);
    showToast(name);
  }

  function attack(mult=1,label='Attack'){
    if(!target||target.userData.dead)return;
    const dist=player.position.distanceTo(target.position);
    if(dist>5.5){showToast('Out of range');return}
    const now=performance.now();if(now-lastAttack<560)return;lastAttack=now;
    const damage=Math.round(power*mult);
    playOneShot('Punch');
    makeSlash(scene,player.position.clone(),def.color);
    setTimeout(()=>{
      if(!target||target.userData.dead)return;
      target.userData.hp=Math.max(0,target.userData.hp-damage);
      target.userData.flashUntil=performance.now()+110;
      floatingDamage(document.body,camera,target.position.clone(),damage);
      $('target-hp').style.width=(100*target.userData.hp/target.userData.maxHp)+'%';
      if(target.userData.hp<=0){
        const dead=target;dead.userData.dead=true;
        dead.userData.anim.loop('Survey');
        kills++;
        awardXP(25);
        $('quest-text').textContent=`Cinderlings slain: ${Math.min(kills,5)} / 5`;
        setTarget(null);
        const start=performance.now();
        const shrink=()=>{
          const t=(performance.now()-start)/420;
          if(t>=1){scene.remove(dead);return}
          dead.scale.setScalar(1-t*.85);dead.position.y=-t*.35;requestAnimationFrame(shrink);
        };shrink();
      }
    },150);
    showToast(label);
  }

  addEventListener('keydown',e=>{
    if(['KeyW','KeyA','KeyS','KeyD','KeyQ','KeyE','KeyF','Space','Tab','Digit1','Digit2','Digit3','Digit4'].includes(e.code))e.preventDefault();
    keys.add(e.code);
    if(e.code==='Space'&&onGround){
      vy=6.2;onGround=false;
      playOneShot('Jump');
    }
    if(e.code==='Tab'){
      const alive=enemies.filter(x=>x.parent&&!x.userData.dead);
      if(alive.length){const idx=Math.max(-1,alive.indexOf(target));setTarget(alive[(idx+1)%alive.length])}
    }
    if(e.code==='KeyF')attack(1,'Basic attack');
    if(/^Digit[1-4]$/.test(e.code)){
      const n=Number(e.code.at(-1))-1;
      useAbility(n);
    }
  },{passive:false});
  addEventListener('keyup',e=>keys.delete(e.code));

  renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());
  renderer.domElement.addEventListener('mousedown',e=>{if(e.button===0)mouse.left=true;if(e.button===2)mouse.right=true;mouse.lastX=e.clientX;mouse.lastY=e.clientY});
  addEventListener('mouseup',e=>{if(e.button===0)mouse.left=false;if(e.button===2)mouse.right=false});
  addEventListener('mousemove',e=>{
    const dx=e.clientX-mouse.lastX,dy=e.clientY-mouse.lastY;mouse.lastX=e.clientX;mouse.lastY=e.clientY;
    if(mouse.right){camYaw-=dx*.0045;camPitch=clamp(camPitch-dy*.0035,-1.05,.35);yaw=camYaw}
    else if(mouse.left){camYaw-=dx*.0045;camPitch=clamp(camPitch-dy*.0035,-1.05,.35)}
  });
  renderer.domElement.addEventListener('wheel',e=>{camDist=clamp(camDist+Math.sign(e.deltaY)*1.05,3.2,19)},{passive:true});
  renderer.domElement.addEventListener('click',e=>{
    const rect=renderer.domElement.getBoundingClientRect();
    pointer.x=((e.clientX-rect.left)/rect.width)*2-1;pointer.y=-((e.clientY-rect.top)/rect.height)*2+1;
    ray.setFromCamera(pointer,camera);
    const meshes=[];
    enemies.forEach(r=>{if(r.parent&&!r.userData.dead)r.traverse(o=>{if(o.isMesh)meshes.push(o)})});
    const hit=ray.intersectObjects(meshes,true)[0];
    if(hit?.object?.userData?.enemyRoot)setTarget(hit.object.userData.enemyRoot);
  });
  renderer.domElement.addEventListener('dblclick',()=>attack(1,'Basic attack'));

  const clock=new THREE.Clock();
  function tick(){
    const dt=Math.min(clock.getDelta(),.04);
    let turn=0;if(keys.has('KeyA')&&!mouse.right)turn+=1;if(keys.has('KeyD')&&!mouse.right)turn-=1;
    yaw+=turn*Math.PI*dt;if(mouse.right)camYaw=yaw;

    let f=0,s=0;
    if(keys.has('KeyW'))f+=1;if(keys.has('KeyS'))f-=.62;
    if(keys.has('KeyQ')||(keys.has('KeyA')&&mouse.right))s-=1;
    if(keys.has('KeyE')||(keys.has('KeyD')&&mouse.right))s+=1;
    const moving=Math.abs(f)+Math.abs(s)>.01;
    const len=Math.hypot(f,s)||1;f/=len;s/=len;
    const fx=-Math.sin(yaw),fz=-Math.cos(yaw),rx=Math.cos(yaw),rz=-Math.sin(yaw);
    player.position.x+=(fx*f+rx*s)*def.speed*dt;
    player.position.z+=(fz*f+rz*s)*def.speed*dt;
    player.rotation.y=yaw;

    vy-=16*dt;player.position.y+=vy*dt;
    if(player.position.y<=0){player.position.y=0;vy=0;onGround=true}
    player.position.x=clamp(player.position.x,-195,195);player.position.z=clamp(player.position.z,-195,195);

    const wanted = moving ? (f<-.1?'Walking':'Running') : 'Idle';
    locomotion=wanted;
    if(!combatLocked&&onGround)pAnim.loop(wanted,.16);
    pAnim.mixer.update(dt);

    for(const e of enemies){
      if(!e.parent||e.userData.dead)continue;
      const d=e.position.distanceTo(player.position);
      let desired='Survey';
      if(d<15&&d>2.2){
        const dir=player.position.clone().sub(e.position);dir.y=0;dir.normalize();
        e.position.addScaledVector(dir,3.2*dt);
        e.rotation.y=Math.atan2(dir.x,dir.z)+Math.PI;
        desired='Run';
      }else if(d>=15){
        e.userData.wanderPhase+=dt*.45;
        const dest=e.userData.home.clone().add(new THREE.Vector3(Math.sin(e.userData.wanderPhase)*3,0,Math.cos(e.userData.wanderPhase*.8)*3));
        const dir=dest.sub(e.position);dir.y=0;
        if(dir.length()>.4){dir.normalize();e.position.addScaledVector(dir,1.1*dt);e.rotation.y=Math.atan2(dir.x,dir.z)+Math.PI;desired='Walk'}
      }
      e.userData.anim.loop(desired,.22);
      e.userData.anim.mixer.update(dt);
      if(performance.now()<e.userData.flashUntil){
        e.traverse(o=>{if(o.isMesh&&o.material?.emissive)o.material.emissive.setHex(0xff3333)})
      }else{
        e.traverse(o=>{if(o.isMesh&&o.material?.emissive)o.material.emissive.setHex(0x000000)})
      }
    }

    if(target&&target.parent&&!target.userData.dead){
      targetRing.position.x=target.position.x;targetRing.position.z=target.position.z;
      targetRing.rotation.z+=dt*.45;
    }

    const focus=player.position.clone().add(new THREE.Vector3(0,1.35,0));
    const cp=Math.cos(camPitch),sp=Math.sin(camPitch);
    camera.position.set(
      focus.x+Math.sin(camYaw)*cp*camDist,
      focus.y-sp*camDist,
      focus.z+Math.cos(camYaw)*cp*camDist
    );
    camera.lookAt(focus);

    renderer.render(scene,camera);
    drawMinimap();
    requestAnimationFrame(tick);
  }

  function drawMinimap(){
    const c=$('minimap'),ctx=c.getContext('2d'),w=c.width,h=c.height;
    ctx.clearRect(0,0,w,h);ctx.fillStyle='#172321';ctx.fillRect(0,0,w,h);
    ctx.strokeStyle='#7d6531';ctx.beginPath();ctx.moveTo(w/2,0);ctx.lineTo(w/2,h);ctx.moveTo(0,h/2);ctx.lineTo(w,h/2);ctx.stroke();
    ctx.fillStyle='#f0d071';ctx.beginPath();ctx.arc(w/2+player.position.x*.55,h/2+player.position.z*.55,4,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#c55a45';
    for(const e of enemies){if(!e.parent||e.userData.dead)continue;ctx.fillRect(w/2+e.position.x*.55-1,h/2+e.position.z*.55-1,3,3)}
  }

  addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
  $('boot-status').textContent='Animated rigs loaded';
  tick();
}
