export const CLASSES = {
  sentinel: {
    id: 'sentinel', name: 'Sentinel', role: 'Vanguard', resource: 'Resolve',
    tagline: 'An iron-wall bruiser who converts pressure into retaliation.',
    stats: { hp: 155, power: 15, speed: 8.4, armor: 8 },
    abilities: [
      { key: '1', name: 'Shieldbreak', cost: 18, cd: 4.5, kind: 'strike', damage: 30, range: 4.2 },
      { key: '2', name: 'Bulwark', cost: 24, cd: 10, kind: 'guard', duration: 4 },
      { key: '3', name: 'Iron Rush', cost: 20, cd: 7, kind: 'dash', damage: 18, range: 11 },
      { key: '4', name: 'Last Bastion', cost: 45, cd: 22, kind: 'nova', damage: 38, range: 8 }
    ]
  },
  aetherblade: {
    id: 'aetherblade', name: 'Aetherblade', role: 'Spellblade', resource: 'Flux',
    tagline: 'A mobile duelist weaving blade arcs through unstable aether.',
    stats: { hp: 112, power: 20, speed: 10.4, armor: 3 },
    abilities: [
      { key: '1', name: 'Rift Cut', cost: 14, cd: 3.2, kind: 'strike', damage: 34, range: 5.3 },
      { key: '2', name: 'Phase Step', cost: 20, cd: 6, kind: 'dash', damage: 10, range: 14 },
      { key: '3', name: 'Arc Echo', cost: 28, cd: 8, kind: 'nova', damage: 30, range: 9 },
      { key: '4', name: 'Zero Meridian', cost: 55, cd: 20, kind: 'strike', damage: 82, range: 7 }
    ]
  },
  thornspeaker: {
    id: 'thornspeaker', name: 'Thornspeaker', role: 'Wildcaller', resource: 'Bloom',
    tagline: 'A nature hexer who roots prey and lets the wild finish the job.',
    stats: { hp: 120, power: 17, speed: 9.2, armor: 4 },
    abilities: [
      { key: '1', name: 'Briar Lash', cost: 12, cd: 3.6, kind: 'strike', damage: 26, range: 10 },
      { key: '2', name: 'Grasping Soil', cost: 24, cd: 8, kind: 'root', damage: 14, range: 10 },
      { key: '3', name: 'Verdant Mend', cost: 30, cd: 10, kind: 'heal', amount: 34 },
      { key: '4', name: 'Ancient Grove', cost: 50, cd: 24, kind: 'nova', damage: 52, range: 11 }
    ]
  },
  revenant: {
    id: 'revenant', name: 'Revenant', role: 'Bloodbound', resource: 'Essence',
    tagline: 'A relentless melee hunter who steals life and refuses to stay down.',
    stats: { hp: 135, power: 19, speed: 9.4, armor: 5 },
    abilities: [
      { key: '1', name: 'Gravehook', cost: 12, cd: 3.8, kind: 'strike', damage: 30, range: 6 },
      { key: '2', name: 'Siphon', cost: 24, cd: 7, kind: 'leech', damage: 25, heal: 20, range: 7 },
      { key: '3', name: 'Wraithwalk', cost: 18, cd: 7, kind: 'dash', damage: 14, range: 12 },
      { key: '4', name: 'Debt of Death', cost: 52, cd: 23, kind: 'nova', damage: 58, range: 9 }
    ]
  },
  tempest: {
    id: 'tempest', name: 'Tempest', role: 'Stormweaver', resource: 'Charge',
    tagline: 'A ranged storm caster chaining violent weather through clustered foes.',
    stats: { hp: 98, power: 23, speed: 9.7, armor: 2 },
    abilities: [
      { key: '1', name: 'Static Spear', cost: 13, cd: 3, kind: 'strike', damage: 33, range: 15 },
      { key: '2', name: 'Thunder Ring', cost: 25, cd: 7.5, kind: 'nova', damage: 28, range: 8 },
      { key: '3', name: 'Gale Shift', cost: 18, cd: 6, kind: 'dash', damage: 8, range: 13 },
      { key: '4', name: 'Skyfall', cost: 58, cd: 22, kind: 'strike', damage: 90, range: 18 }
    ]
  },
  starbinder: {
    id: 'starbinder', name: 'Starbinder', role: 'Astral Sage', resource: 'Astral',
    tagline: 'A control-support mage bending gravity, wards, and distant light.',
    stats: { hp: 108, power: 18, speed: 9.1, armor: 3 },
    abilities: [
      { key: '1', name: 'Comet Thread', cost: 12, cd: 3.4, kind: 'strike', damage: 29, range: 14 },
      { key: '2', name: 'Gravity Well', cost: 26, cd: 8.5, kind: 'root', damage: 18, range: 12 },
      { key: '3', name: 'Astral Ward', cost: 25, cd: 9, kind: 'guard', duration: 4 },
      { key: '4', name: 'Constellation', cost: 50, cd: 21, kind: 'nova', damage: 48, range: 12 }
    ]
  }
};

export const CLASS_ORDER = ['sentinel', 'aetherblade', 'thornspeaker', 'revenant', 'tempest', 'starbinder'];
