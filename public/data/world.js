export const ZONES = [
  {
    id: 'emberwake', name: 'Emberwake Coast', levels: '1–8',
    center: [0, 0], size: [150, 150], ground: 0x855a38, accent: 0xffa34a,
    mood: 'Black sand, copper grass, smoking tidepools and a shattered lighthouse.',
    mobs: [
      { name: 'Cinderling', hp: 52, damage: 7, speed: 3.0, xp: 22, color: 0xe86f32 },
      { name: 'Saltfang', hp: 68, damage: 9, speed: 3.8, xp: 28, color: 0xd4b27c }
    ],
    boss: { name: 'Brassjaw, Tidebreaker', hp: 360, damage: 16, speed: 2.5, xp: 240, color: 0xff7b29 }
  },
  {
    id: 'mossveil', name: 'Mossveil Reach', levels: '8–16',
    center: [165, 20], size: [150, 170], ground: 0x315c3b, accent: 0x82d66f,
    mood: 'Rain-heavy giantwood, living bridges and ruins swallowed by luminous moss.',
    mobs: [
      { name: 'Mirehorn', hp: 86, damage: 11, speed: 3.2, xp: 40, color: 0x6e9f61 },
      { name: 'Sporebound', hp: 78, damage: 13, speed: 2.8, xp: 42, color: 0x8bcf7b }
    ],
    boss: { name: 'Old Root Veyra', hp: 520, damage: 22, speed: 2.2, xp: 360, color: 0x5bc66f }
  },
  {
    id: 'shatterglass', name: 'Shatterglass Expanse', levels: '16–26',
    center: [20, -170], size: [180, 150], ground: 0x8b7658, accent: 0x7ee6e8,
    mood: 'A bright salt desert where crystal storms leave mirrored canyons behind.',
    mobs: [
      { name: 'Glassback', hp: 110, damage: 16, speed: 3.3, xp: 58, color: 0x8cdde0 },
      { name: 'Dune Wisp', hp: 92, damage: 18, speed: 4.4, xp: 62, color: 0xc9f6ff }
    ],
    boss: { name: 'The Prism Maw', hp: 690, damage: 27, speed: 3.0, xp: 480, color: 0x62e1e6 }
  },
  {
    id: 'frosthollow', name: 'Frosthollow', levels: '26–38',
    center: [-165, -15], size: [155, 180], ground: 0x668393, accent: 0xccefff,
    mood: 'Blue-white valleys, ruined observatories and frozen rivers under constant aurora.',
    mobs: [
      { name: 'Rimeclaw', hp: 138, damage: 22, speed: 3.5, xp: 82, color: 0xa9d9f0 },
      { name: 'Aurora Shade', hp: 120, damage: 25, speed: 4.1, xp: 88, color: 0x8db9ff }
    ],
    boss: { name: 'Ysra of the Pale Bell', hp: 880, damage: 34, speed: 2.7, xp: 650, color: 0xd5f5ff }
  },
  {
    id: 'umbral', name: 'Umbral Basin', levels: '38–50',
    center: [0, 175], size: [190, 150], ground: 0x322c4b, accent: 0xbd7cff,
    mood: 'A collapsed crater-city where shadows move before the bodies casting them.',
    mobs: [
      { name: 'Null Stalker', hp: 176, damage: 31, speed: 4.0, xp: 118, color: 0x7658a8 },
      { name: 'Gloom Husk', hp: 210, damage: 28, speed: 2.7, xp: 124, color: 0x5a4a72 }
    ],
    boss: { name: 'The Unnamed Crown', hp: 1250, damage: 44, speed: 3.1, xp: 950, color: 0xa964ff }
  }
];

export function zoneAt(x, z) {
  return ZONES.find(zone => {
    const [cx, cz] = zone.center;
    const [w, h] = zone.size;
    return Math.abs(x - cx) <= w / 2 && Math.abs(z - cz) <= h / 2;
  }) || ZONES[0];
}
