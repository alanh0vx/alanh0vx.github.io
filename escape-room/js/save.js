/* save.js — localStorage persistence + room export/import.
 * Export is room-only (no progress) so a shared room is always a fresh
 * challenge; the save slot stores the full room JSON + progress so imported
 * rooms and generator updates never break an existing save. */

import { validateRoom } from './generator.js';

const SAVE_KEY = 'escapeRoom_save_v1';

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || data.version !== 1 || !data.room || !validateRoom(data.room).ok) return null;
    return data;
  } catch (e) {
    return null;
  }
}

export function saveGame(room, progress) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 1, room, progress }));
    return true;
  } catch (e) {
    return false;
  }
}

export function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ }
}

/** Debounced auto-saver bound to one room. */
export function makeAutoSaver(room, getProgress, delay = 400) {
  let timer = null;
  const flush = () => { timer = null; saveGame(room, getProgress()); };
  const schedule = () => { if (!timer) timer = setTimeout(flush, delay); };
  schedule.flush = () => { if (timer) { clearTimeout(timer); } flush(); };
  return schedule;
}

/** Download the room as a shareable JSON file. */
export function exportRoom(room) {
  const blob = new Blob([JSON.stringify(room, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `escape-room-${String(room.seed).replace(/[^\w-]+/g, '_')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Open a file picker and resolve with a validated room, or reject. */
export function importRoomFile() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      if (!file) { reject(new Error('no file')); return; }
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('read failed'));
      reader.onload = () => {
        try {
          const json = JSON.parse(reader.result);
          const v = validateRoom(json);
          if (!v.ok) { reject(new Error('invalid room: ' + v.errors.join('; '))); return; }
          resolve(json);
        } catch (e) {
          reject(new Error('invalid JSON'));
        }
      };
      reader.readAsText(file);
    });
    input.click();
  });
}
