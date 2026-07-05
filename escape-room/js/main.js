/* main.js — entry point: boots i18n, wires the landing menu, owns the
 * game session lifecycle (new / continue / import), autosave, timer,
 * and debug hooks (window.__er, ?seed=, ?debug=1). */

import { t, getLang, setLang, applyStatic } from './i18n.js';
import { generateRoom, solveRoom } from './generator.js';
import { Game } from './game.js';
import { RoomScene } from './scene.js';
import { UI, toast, confirmDialog, clueText, propName, itemName, fmtTime } from './ui.js';
import { loadSave, saveGame, clearSave, makeAutoSaver, exportRoom, importRoomFile } from './save.js';
import { sfx, isMuted, setMuted } from './audio.js';

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const DEBUG = params.get('debug') === '1';

let session = null; // { room, game, scene, autoSave, timerId }

// ---------------------------------------------------------------- UI singleton

const ui = new UI({
  onExport: () => { if (session) { exportRoom(session.room); toast(t('toast.exported')); } },
  onNewRoom: () => startNew(),
  onMenu: () => showMenu(),
});

// ---------------------------------------------------------------- session

function endSession() {
  if (!session) return;
  if (session.autoSave) session.autoSave.flush();
  clearInterval(session.timerId);
  session.scene.dispose();
  session = null;
}

function startGame(room, progress, { showIntro } = {}) {
  endSession();
  $('menu').classList.add('hidden');
  $('gameLayer').classList.remove('hidden');

  const game = new Game(room, progress);
  const scene = new RoomScene($('scene'), room, {
    onTap: (propId) => {
      if (propId) { sfx.tap(); ui.openPanel(propId); }
      else ui.closePanel();
    },
  });
  ui.attach(game, scene);
  scene.syncState(game);

  const autoSave = makeAutoSaver(room, () => game.serialize());
  game.on((type) => {
    if (type === 'change') autoSave();
    if (type === 'win') autoSave.flush();
  });

  // 1s game clock (paused while the tab is hidden)
  let last = performance.now();
  const timerId = setInterval(() => {
    const now = performance.now();
    if (!document.hidden && !game.escaped) {
      game.tick(now - last);
      ui.renderHud();
      autoSave();
    }
    last = now;
  }, 1000);

  session = { room, game, scene, autoSave, timerId };

  if (DEBUG) dumpSolution(room);
  window.__er = { game, room, scene, generate: generateRoom, solve: solveRoom };

  if (showIntro) ui.showIntro(room, () => {});
}

function startNew(seedInput) {
  const seed = (seedInput || '').trim() ||
    Math.random().toString(36).slice(2, 8) + '-' + Math.floor(Math.random() * 1000);
  let room;
  try {
    room = generateRoom(seed);
  } catch (e) {
    toast('Generator error: ' + e.message);
    return;
  }
  clearSave();
  saveGame(room, null);
  startGame(room, null, { showIntro: true });
}

function continueGame() {
  const save = loadSave();
  if (!save) { toast(t('toast.import.bad')); showMenu(); return; }
  startGame(save.room, save.progress, { showIntro: !save.progress });
}

async function importRoom() {
  try {
    const room = await importRoomFile();
    clearSave();
    saveGame(room, null);
    toast(t('toast.import.ok'));
    startGame(room, null, { showIntro: true });
  } catch (e) {
    if (e.message !== 'no file') toast(t('toast.import.bad'));
  }
}

// ---------------------------------------------------------------- menu

function showMenu() {
  endSession();
  $('gameLayer').classList.add('hidden');
  $('menu').classList.remove('hidden');
  $('continueBtn').classList.toggle('hidden', !loadSave());
}

function dumpSolution(room) {
  /* eslint-disable no-console */
  console.log('%c[escape-room] solution path for seed ' + room.seed, 'color:#8fd18f');
  (room.solutionOrder || []).forEach((id, i) => {
    const clue = room.clues.find((c) => c.id === id);
    const item = room.items.find((x) => x.id === id);
    const lock = room.locks.find((l) => l.id === id);
    if (clue) console.log(`${i + 1}. clue ${id} @ ${clue.location.propId}/${clue.location.spot}: ${clueText(room, clue)}`);
    else if (item) console.log(`${i + 1}. item ${id} (${itemName(item)}) @ ${item.hidden.propId}/${item.hidden.spot}`);
    else if (lock) console.log(`${i + 1}. lock ${id} [${lock.type}] on ${propName(room, lock.attachedTo)}` +
      (lock.answer ? ` answer=${Array.isArray(lock.answer) ? lock.answer.join(',') : lock.answer}` : ''));
  });
}

// ---------------------------------------------------------------- static wiring

function updateSoundBtn() {
  $('soundBtn').textContent = isMuted() ? '🔇' : '🔊';
}

function init() {
  applyStatic();
  updateSoundBtn();

  $('newBtn').addEventListener('click', () => startNew($('seedInput').value));
  $('continueBtn').addEventListener('click', () => continueGame());
  $('importBtn').addEventListener('click', () => importRoom());
  $('howtoBtn').addEventListener('click', () => ui.showHowto());
  $('menuLangBtn').addEventListener('click', () => setLang(getLang() === 'zh' ? 'en' : 'zh'));
  $('langBtn').addEventListener('click', () => setLang(getLang() === 'zh' ? 'en' : 'zh'));
  $('soundBtn').addEventListener('click', () => { setMuted(!isMuted()); updateSoundBtn(); });
  $('menuBtn').addEventListener('click', async () => {
    if (await confirmDialog(t('confirm.leave'))) showMenu();
  });
  const leaveSite = () => {
    // CLAUDE.md fallback chain: history.back → window.close → home
    if (history.length > 1) { history.back(); return; }
    window.close();
    setTimeout(() => { location.href = '/'; }, 150);
  };
  $('backBtn').addEventListener('click', () => {
    if (session && session.autoSave) session.autoSave.flush();
    leaveSite();
  });
  $('menuBackBtn').addEventListener('click', leaveSite);
  const syncLangBtns = () => {
    $('langBtn').textContent = t('lang.btn');
    $('menuLangBtn').textContent = t('lang.btn');
  };
  syncLangBtns();
  window.addEventListener('langchange', () => {
    applyStatic();
    syncLangBtns();
    $('continueBtn').classList.toggle('hidden', !loadSave());
  });
  window.addEventListener('beforeunload', () => {
    if (session && session.autoSave) session.autoSave.flush();
  });

  // deep links: ?seed=xyz starts straight into a deterministic room
  const seedParam = params.get('seed');
  if (seedParam) {
    startNew(seedParam);
  } else {
    showMenu();
  }
}

init();
