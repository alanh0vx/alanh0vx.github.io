/* themes.js — pure data: prop catalog + the four room themes.
 * No DOM, no three.js — importable headlessly. */

/** Colors usable for prop accents, countables and colour-sequence locks. */
export const COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

export const COLOR_HEX = {
  red: '#c0392b', blue: '#2e6da4', green: '#3d8b4f',
  yellow: '#d4a017', purple: '#7d5ba6', orange: '#d1702a',
  brown: '#7a5c3e', white: '#e8e4da', black: '#2b2b2b', grey: '#8a8f98',
};

/** Language-neutral symbols for symbol locks (drawn on props, shown on dials). */
export const SYMBOLS = ['★', '▲', '●', '■', '♥', '♦'];

/** Prop types that can be the answer to a riddle lock
 *  (each has a `riddleq.<type>` line in i18n). */
export const RIDDLE_TYPES = [
  'clock', 'mirror', 'plant', 'bed', 'bookshelf', 'fridge', 'rug', 'floorlamp',
  'teddy', 'globe', 'barrel', 'sofa', 'painting', 'car', 'window', 'radio',
  'typewriter', 'bench',
];

/* Prop catalog.
 *  kind:     'wall' | 'floor' | 'small'  (small = sits on a surface prop)
 *  spots:    where things can hide when the player searches it
 *  lockable: can be a locked container ('inside' gated by its lock)
 *  countable:'books'|'bottles'|'shapes'|'jars'|'flowers' — visible things to count (1–9)
 *  surface:  a floor prop that offers a slot for one small prop on top
 *  taggable: a symbol can be painted on it
 *  size:     [w, h, d] rough footprint in metres (used for 3D and slot spacing)
 */
export const PROP_DEFS = {
  // ---- wall props
  painting:  { kind: 'wall', spots: ['behind'], countable: 'shapes', taggable: true, size: [0.9, 0.7, 0.06] },
  clock:     { kind: 'wall', spots: ['behind'], size: [0.4, 0.4, 0.08] },
  poster:    { kind: 'wall', spots: ['behind'], taggable: true, size: [0.62, 0.88, 0.02] },
  mirror:    { kind: 'wall', spots: ['behind'], size: [0.55, 0.85, 0.05] },
  wallshelf: { kind: 'wall', spots: ['on'], countable: 'jars', size: [1.0, 0.3, 0.26] },
  vent:      { kind: 'wall', spots: ['inside'], size: [0.45, 0.32, 0.04] },

  // ---- floor props
  desk:      { kind: 'floor', spots: ['on', 'under', 'inside'], lockable: true, surface: true, size: [1.3, 0.76, 0.65] },
  bookshelf: { kind: 'floor', spots: ['behind', 'on'], countable: 'books', size: [1.05, 1.85, 0.35] },
  cabinet:   { kind: 'floor', spots: ['behind', 'inside'], lockable: true, surface: true, size: [0.85, 1.2, 0.48] },
  safe:      { kind: 'floor', spots: ['inside'], lockable: true, taggable: true, size: [0.62, 0.75, 0.6] },
  chest:     { kind: 'floor', spots: ['under', 'inside'], lockable: true, taggable: true, size: [0.95, 0.6, 0.55] },
  bed:       { kind: 'floor', spots: ['under'], size: [2.0, 0.55, 1.05] },
  sofa:      { kind: 'floor', spots: ['under', 'behind'], size: [1.8, 0.85, 0.85] },
  plant:     { kind: 'floor', spots: ['under', 'inside'], countable: 'flowers', size: [0.5, 1.25, 0.5] },
  coatrack:  { kind: 'floor', spots: ['behind'], size: [0.45, 1.8, 0.45] },
  floorlamp: { kind: 'floor', spots: ['under'], size: [0.4, 1.65, 0.4] },
  locker:    { kind: 'floor', spots: ['behind', 'inside'], lockable: true, taggable: true, size: [0.62, 1.85, 0.5] },
  fridge:    { kind: 'floor', spots: ['on', 'inside'], lockable: true, size: [0.72, 1.6, 0.68] },
  workbench: { kind: 'floor', spots: ['on', 'under'], surface: true, size: [1.5, 0.9, 0.7] },
  barrel:    { kind: 'floor', spots: ['inside', 'behind'], taggable: true, size: [0.6, 0.9, 0.6] },
  rug:       { kind: 'floor', spots: ['under'], taggable: true, center: true, size: [1.7, 0.02, 1.2] },

  window:    { kind: 'wall', spots: ['behind'], size: [0.9, 0.7, 0.06] },
  birdhouse: { kind: 'wall', spots: ['inside'], lockable: true, taggable: true, size: [0.32, 0.42, 0.26] },
  stove:     { kind: 'floor', spots: ['on', 'inside'], size: [0.72, 0.9, 0.65] },
  sink:      { kind: 'floor', spots: ['inside', 'under'], lockable: true, size: [0.78, 0.9, 0.6] },
  bench:     { kind: 'floor', spots: ['under', 'behind'], size: [1.6, 0.95, 0.6] },
  car:       { kind: 'floor', spots: ['inside', 'under'], lockable: true, taggable: true, size: [2.3, 1.35, 1.15] },

  // ---- small props (on surfaces)
  box:        { kind: 'small', spots: ['inside'], lockable: true, taggable: true, size: [0.38, 0.26, 0.3] },
  suitcase:   { kind: 'small', spots: ['inside'], lockable: true, taggable: true, size: [0.5, 0.36, 0.18] },
  bottlerack: { kind: 'small', spots: ['behind'], countable: 'bottles', size: [0.45, 0.35, 0.2] },
  globe:      { kind: 'small', spots: ['under'], taggable: true, size: [0.3, 0.38, 0.3] },
  teddy:      { kind: 'small', spots: ['under'], taggable: true, size: [0.28, 0.34, 0.22] },
  radio:      { kind: 'small', spots: ['inside'], size: [0.4, 0.24, 0.16] },
  typewriter: { kind: 'small', spots: ['under', 'inside'], size: [0.42, 0.22, 0.34] },
  jarbig:     { kind: 'small', spots: ['inside'], size: [0.2, 0.3, 0.2] },
  photoframe: { kind: 'small', spots: ['behind'], size: [0.18, 0.24, 0.05] },
};

/* Themes: palettes + which props may appear + bilingual character names for the story.
 * `wallProps`/`floorProps`/`smallProps` are pools; the generator guarantees a clock,
 * enough lockables and enough countables regardless of pool order. */
export const THEMES = {
  study: {
    walls: ['#6b7a8f', '#7d6f5e', '#5e6f63'],
    floor: ['#8a6f4d', '#6e5a41'],
    ceil: '#e8e4da',
    wallProps: ['painting', 'clock', 'poster', 'mirror', 'wallshelf'],
    floorProps: ['desk', 'bookshelf', 'cabinet', 'safe', 'chest', 'plant', 'coatrack', 'floorlamp', 'sofa', 'rug'],
    smallProps: ['box', 'globe', 'typewriter', 'bottlerack', 'photoframe', 'jarbig'],
    chars: [
      { en: 'Professor Lam', zh: '林教授' },
      { en: 'Dr. Cheung', zh: '張博士' },
      { en: 'Old Master Ho', zh: '何老先生' },
    ],
    intros: 3,
  },
  bedroom: {
    walls: ['#8f7a86', '#7a8a9a', '#9a8a6e'],
    floor: ['#9a7d5c', '#7d664f'],
    ceil: '#efe9e2',
    wallProps: ['painting', 'clock', 'poster', 'mirror', 'wallshelf'],
    floorProps: ['bed', 'desk', 'cabinet', 'chest', 'plant', 'coatrack', 'floorlamp', 'sofa', 'rug'],
    smallProps: ['box', 'teddy', 'radio', 'photoframe', 'jarbig', 'globe'],
    chars: [
      { en: 'Auntie Mei', zh: '梅姨' },
      { en: 'Cousin Ka-Ming', zh: '家明表哥' },
      { en: 'Grandma Chan', zh: '陳婆婆' },
    ],
    intros: 3,
  },
  lab: {
    walls: ['#5e6e78', '#5f7568', '#6d6d7d'],
    floor: ['#9aa0a8', '#7f8790'],
    ceil: '#dde3e8',
    wallProps: ['clock', 'poster', 'wallshelf', 'vent', 'mirror'],
    floorProps: ['workbench', 'locker', 'cabinet', 'safe', 'fridge', 'barrel', 'floorlamp', 'rug'],
    smallProps: ['box', 'bottlerack', 'radio', 'jarbig', 'globe'],
    chars: [
      { en: 'Dr. Siu', zh: '蕭博士' },
      { en: 'Professor Kwok', zh: '郭教授' },
      { en: 'Engineer Wong', zh: '王工程師' },
    ],
    intros: 3,
  },
  cabin: {
    walls: ['#7a5c3e', '#6e5a41', '#8a6f4d'],
    floor: ['#5f4a33', '#6e5a41'],
    ceil: '#c9b899',
    wallProps: ['painting', 'clock', 'wallshelf', 'mirror', 'poster'],
    floorProps: ['bed', 'chest', 'barrel', 'workbench', 'coatrack', 'plant', 'bookshelf', 'floorlamp', 'rug'],
    smallProps: ['box', 'jarbig', 'teddy', 'bottlerack', 'photoframe'],
    chars: [
      { en: 'Uncle Bo', zh: '波叔' },
      { en: 'Ranger Lee', zh: '李管理員' },
      { en: 'Hunter Cheng', zh: '鄭獵人' },
    ],
    intros: 3,
  },
  kitchen: {
    walls: ['#c9c2a6', '#b8c4c9', '#c9b8a6'],
    floor: ['#9aa0a8', '#b5a98c'],
    ceil: '#f0ede4',
    wallProps: ['clock', 'poster', 'wallshelf', 'window', 'mirror'],
    floorProps: ['fridge', 'cabinet', 'workbench', 'stove', 'sink', 'plant', 'chest', 'rug'],
    smallProps: ['box', 'bottlerack', 'jarbig', 'radio', 'photoframe'],
    chars: [
      { en: 'Chef Wong', zh: '王大廚' },
      { en: 'Auntie Kam', zh: '金姨' },
      { en: 'Old Master Chow', zh: '周老闆' },
    ],
    intros: 3,
  },
  train: {
    walls: ['#5f6e5a', '#6e5f5a', '#4f5f6e'],
    floor: ['#6e5a41', '#5f4a33'],
    ceil: '#d8d4c8',
    wallProps: ['clock', 'poster', 'window', 'mirror', 'vent'],
    floorProps: ['sofa', 'locker', 'chest', 'desk', 'coatrack', 'floorlamp', 'plant', 'rug'],
    smallProps: ['suitcase', 'box', 'radio', 'bottlerack', 'photoframe'],
    chars: [
      { en: 'Conductor Chan', zh: '陳車長' },
      { en: 'Madam Fong', zh: '方太' },
      { en: 'Mr. Ko', zh: '高先生' },
    ],
    intros: 3,
  },
  garden: {
    walls: ['#6f9a5f', '#5f8a56', '#7aa864'],
    floor: ['#7da85f', '#8fb46b'],
    ceil: '#aee3f5',
    wallProps: ['clock', 'birdhouse', 'wallshelf', 'poster'],
    floorProps: ['bench', 'plant', 'barrel', 'chest', 'coatrack', 'workbench', 'floorlamp', 'rug'],
    smallProps: ['box', 'jarbig', 'bottlerack', 'teddy', 'photoframe'],
    chars: [
      { en: 'Gardener Au', zh: '區伯' },
      { en: 'Miss Lily', zh: '百合小姐' },
      { en: 'Old Fung', zh: '馮老先生' },
    ],
    intros: 3,
  },
  garage: {
    walls: ['#8a8f98', '#7f8790', '#6d737b'],
    floor: ['#5c636b', '#6d737b'],
    ceil: '#c9ccd1',
    wallProps: ['clock', 'poster', 'vent', 'wallshelf', 'mirror'],
    floorProps: ['car', 'workbench', 'locker', 'cabinet', 'barrel', 'chest', 'floorlamp'],
    smallProps: ['box', 'radio', 'jarbig', 'bottlerack'],
    feature: 'car',
    chars: [
      { en: 'Mechanic Tai', zh: '泰哥' },
      { en: 'Boss Lui', zh: '雷老闆' },
      { en: 'Ah Keung', zh: '阿強' },
    ],
    intros: 3,
  },
};

export const THEME_IDS = Object.keys(THEMES);
