import * as THREE from '/three.module.js';

const CLASS_DEF={
 sentinel:{name:'Sentinel',hp:155,power:15,speed:7.0,color:0x6689a8,resource:'Resolve',abilities:['Shieldbreak','Bulwark','Iron Rush','Last Bastion']},
 aetherblade:{name:'Aetherblade',hp:112,power:20,speed:7.6,color:0x835fd1,resource:'Flux',abilities:['Rift Cut','Phase Step','Arc Echo','Zero Meridian']},
 thornspeaker:{name:'Thornspeaker',hp:120,power:17,speed:7.2,color:0x5a9a63,resource:'Bloom',abilities:['Briar Lash','Grasping Soil','Verdant Mend','Ancient Grove']},
 revenant:{name:'Revenant',hp:135,power:19,speed:7.3,color:0x8e4944,resource:'Essence',abilities:['Gravehook','Siphon','Wraithwalk','Debt of Death']},
 tempest:{name:'Tempest',hp:98,power:23,speed:7.4,color:0x4e9ebd,resource:'Charge',abilities:['Static Spear','Thunder Ring','Gale Shift','Skyfall']},
 starbinder:{name:'Starbinder',hp:108,power:18,speed:7.2,color:0xb89d68,resource:'Astral',abilities:['Comet Thread','Gravity Well','Astral Ward','Constellation']}
};
const $=id=>document.getElementById(id);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
let running=false;

export async function startGame(classId){
  if(running) return;
  running=true;
  const def=CLASS_DEF[classId]||CLASS_DEF.sentinel;
  const mount=$('game');

  const scene=new THREE.Scene();
  scene.background=new THREE.Color(0x718c98);
  scene.fog=new THREE.Fog(0x718c98,70,260);

  const camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.1,700);
  const renderer=new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
  renderer.setSize(innerWidth,innerHeight);
  mount.replaceChildren(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xbfdcf0,0x40331f,2.0));
  const sun=new THREE.DirectionalLight(0xffe1ad,2.0);sun.position.set(-30,55,20);scene.add(sun);

  const ground=new THREE.Mesh(new THREE.PlaneGeometry(420,420,1,1),new THREE.MeshStandardMaterial({color:0x75583b,roughness:1}));
  ground.rotation.x=-Math.PI/2;scene.add(ground);

  const road=new THREE.Mesh(new THREE.PlaneGeometry(12,170),new THREE.MeshStandardMaterial({color:0x4c443a,roughness:1}));
  road.rotation.x=-Math.PI/2;road.position.y=.02;road.position.z=-35;scene.add(road);

  function box(x,y,z,w,h,d,color){
    const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,roughness:.9}));
    m.position.set(x,y+h/2,z);scene.add(m);return m;
  }
  box(-12,0,-14,12,6,9,0x6d563d);box(13,0,-17,10,5,8,0x5c4a38);box(-19,0,-38,8,5,8,0x735f45);
  for(let i=0;i<38;i++){
    const a=i*2.399, r=30+(i%9)*11, x=Math.cos(a)*r, z=Math.sin(a)*r-20;
    const trunk=box(x,0,z,.7,3+((i%3)*.4),.7,0x4a3323);
    const crown=new THREE.Mesh(new THREE.ConeGeometry(2.1+(i%3)*.2,5,7),new THREE.MeshStandardMaterial({color:i%2?0x3d6040:0x496d43}));
    crown.position.set(x,trunk.position.y+4,z);scene.add(crown);
  }
  for(let i=0;i<30;i++) box((i*19)%120-60,0,((i*37)%120)-70,.8+(i%4),.45+(i%3)*.25,.9+(i%5)*.6,0x574b3e);

  const player=new THREE.Group();
  const body=new THREE.Mesh(new THREE.CapsuleGeometry(.48,1.15,5,9),new THREE.MeshStandardMaterial({color:def.color}));
  body.position.y=1.15;player.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.38,12,8),new THREE.MeshStandardMaterial({color:0xd3a676}));
  head.position.y=2.15;player.add(head);
  const shoulder=new THREE.Mesh(new THREE.BoxGeometry(1.25,.22,.34),new THREE.MeshStandardMaterial({color:0x2c3237}));
  shoulder.position.y=1.72;player.add(shoulder);
  scene.add(player);
  player.position.set(0,0,8);

  const enemies=[];
  function spawnEnemy(i){
    const g=new THREE.Group();
    const m=new THREE.Mesh(new THREE.DodecahedronGeometry(.7,0),new THREE.MeshStandardMaterial({color:i%2?0xd16b3f:0xb79a64}));
    m.position.y=.7;g.add(m);
    const horn=new THREE.Mesh(new THREE.ConeGeometry(.16,.6,5),new THREE.MeshStandardMaterial({color:0x2a2118}));
    horn.position.set(.28,1.35,0);g.add(horn);
    g.position.set(((i*17)%60)-30,0,-25-((i*23)%70));
    g.userData={id:'mob'+i,name:i%2?'Cinderling':'Saltfang',hp:50+(i%2)*20,maxHp:50+(i%2)*20};
    scene.add(g);enemies.push(g);
  }
  for(let i=0;i<14;i++) spawnEnemy(i);

  let yaw=Math.PI,camYaw=Math.PI,camPitch=-.28,camDist=9,vy=0,onGround=true,target=null;
  const keys=new Set(), mouse={left:false,right:false,lastX:0,lastY:0};
  const ray=new THREE.Raycaster(), pointer=new THREE.Vector2();
  let hp=def.hp,xp=0,kills=0,lastAttack=0;

  $('player-name').textContent=def.name;
  $('level-text').textContent='1';
  $('hp-text').textContent=`${hp} / ${def.hp}`;
  $('resource-text').textContent=`100 ${def.resource}`;
  const bar=$('actionbar');bar.innerHTML='';
  def.abilities.forEach((name,i)=>{const d=document.createElement('div');d.className='slot';d.innerHTML=`<em>${i+1}</em><b>${name}</b>`;bar.appendChild(d)});

  const showToast=(t)=>{const x=$('toast');x.textContent=t;x.style.opacity='1';setTimeout(()=>x.style.opacity='0',900)};
  const setTarget=t=>{
    target=t;
    if(!t){$('target-frame').classList.add('hidden');return}
    $('target-frame').classList.remove('hidden');$('target-name').textContent=t.userData.name;
    $('target-hp').style.width=(100*t.userData.hp/t.userData.maxHp)+'%';
  };
  const attack=()=>{
    if(!target||target.userData.hp<=0)return;
    const dist=player.position.distanceTo(target.position);if(dist>5.5){showToast('Out of range');return}
    const now=performance.now();if(now-lastAttack<650)return;lastAttack=now;
    target.userData.hp=Math.max(0,target.userData.hp-def.power);
    $('target-hp').style.width=(100*target.userData.hp/target.userData.maxHp)+'%';
    if(target.userData.hp<=0){
      scene.remove(target);kills++;xp+=25;$('quest-text').textContent=`Cinderlings slain: ${Math.min(kills,5)} / 5`;
      $('xp-fill').style.width=Math.min(xp,100)+'%';$('xp-text').textContent=`${xp} / 100 XP`;setTarget(null);
    }
  };

  addEventListener('keydown',e=>{
    if(['KeyW','KeyA','KeyS','KeyD','KeyQ','KeyE','Space','Tab','Digit1','Digit2','Digit3','Digit4'].includes(e.code))e.preventDefault();
    keys.add(e.code);
    if(e.code==='Space'&&onGround){vy=6;onGround=false}
    if(e.code==='Tab'){const alive=enemies.filter(x=>x.parent&&x.userData.hp>0);if(alive.length){const idx=Math.max(-1,alive.indexOf(target));setTarget(alive[(idx+1)%alive.length])}}
    if(/^Digit[1-4]$/.test(e.code)){attack();showToast(def.abilities[Number(e.code.at(-1))-1])}
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
  renderer.domElement.addEventListener('wheel',e=>{camDist=clamp(camDist+Math.sign(e.deltaY)*1.1,3,20)},{passive:true});
  renderer.domElement.addEventListener('click',e=>{
    const rect=renderer.domElement.getBoundingClientRect();pointer.x=((e.clientX-rect.left)/rect.width)*2-1;pointer.y=-((e.clientY-rect.top)/rect.height)*2+1;
    ray.setFromCamera(pointer,camera);const hits=ray.intersectObjects(enemies.filter(x=>x.parent),true);
    if(hits.length){let o=hits[0].object;while(o.parent&&o.parent!==scene)o=o.parent;setTarget(o)}
  });
  renderer.domElement.addEventListener('dblclick',()=>attack());

  const clock=new THREE.Clock();
  function tick(){
    const dt=Math.min(clock.getDelta(),.04);
    let turn=0;if(keys.has('KeyA')&&!mouse.right)turn+=1;if(keys.has('KeyD')&&!mouse.right)turn-=1;
    yaw+=turn*Math.PI*dt;
    if(mouse.right)camYaw=yaw;
    let f=0,s=0;if(keys.has('KeyW'))f+=1;if(keys.has('KeyS'))f-=.65;if(keys.has('KeyQ')||keys.has('KeyA')&&mouse.right)s-=1;if(keys.has('KeyE')||keys.has('KeyD')&&mouse.right)s+=1;
    const len=Math.hypot(f,s)||1;f/=len;s/=len;
    const fx=-Math.sin(yaw),fz=-Math.cos(yaw),rx=Math.cos(yaw),rz=-Math.sin(yaw);
    player.position.x+=(fx*f+rx*s)*def.speed*dt;player.position.z+=(fz*f+rz*s)*def.speed*dt;
    player.rotation.y=yaw;
    vy-=16*dt;player.position.y+=vy*dt;if(player.position.y<=0){player.position.y=0;vy=0;onGround=true}
    player.position.x=clamp(player.position.x,-195,195);player.position.z=clamp(player.position.z,-195,195);

    const focus=player.position.clone().add(new THREE.Vector3(0,1.35,0));
    const cp=Math.cos(camPitch),sp=Math.sin(camPitch);
    camera.position.set(focus.x+Math.sin(camYaw)*cp*camDist,focus.y-sp*camDist,focus.z+Math.cos(camYaw)*cp*camDist);
    camera.lookAt(focus);

    for(const e of enemies){if(!e.parent||e.userData.hp<=0)continue;e.rotation.y+=dt*.4}
    if(target&&target.parent&&player.position.distanceTo(target.position)<5.5&&keys.has('KeyF'))attack();

    renderer.render(scene,camera);drawMinimap();requestAnimationFrame(tick);
  }
  function drawMinimap(){
    const c=$('minimap'),ctx=c.getContext('2d'),w=c.width,h=c.height;ctx.clearRect(0,0,w,h);ctx.fillStyle='#172321';ctx.fillRect(0,0,w,h);
    ctx.strokeStyle='#7d6531';ctx.beginPath();ctx.moveTo(w/2,0);ctx.lineTo(w/2,h);ctx.moveTo(0,h/2);ctx.lineTo(w,h/2);ctx.stroke();
    ctx.fillStyle='#f0d071';ctx.beginPath();ctx.arc(w/2+player.position.x*.55,h/2+player.position.z*.55,4,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#c55a45';for(const e of enemies){if(!e.parent)continue;ctx.fillRect(w/2+e.position.x*.55-1,h/2+e.position.z*.55-1,3,3)}
  }
  addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
  tick();
}
