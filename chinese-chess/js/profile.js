// ============================================================
// profile.js — User profile & pixel-art avatar processing
// ============================================================
(function () {
  'use strict';

  var PROFILE_KEY = 'xiangqi_profile';

  var defaultProfile = {
    nickname: '棋友',
    avatar: null, // base64 data URL
    createdAt: null,
    stats: {
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      puzzlesSolved: 0
    }
  };

  function load() {
    try {
      var raw = localStorage.getItem(PROFILE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }

  function save(profile) {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      return true;
    } catch (e) {
      return false;
    }
  }

  function exists() {
    return load() !== null;
  }

  function create(nickname, avatarDataUrl) {
    var profile = {
      nickname: nickname || defaultProfile.nickname,
      avatar: avatarDataUrl || null,
      createdAt: new Date().toISOString(),
      stats: { gamesPlayed: 0, wins: 0, losses: 0, draws: 0, puzzlesSolved: 0 }
    };
    save(profile);
    return profile;
  }

  function update(fields) {
    var profile = load() || create();
    Object.keys(fields).forEach(function (key) {
      if (key === 'stats') {
        Object.keys(fields.stats).forEach(function (sk) {
          profile.stats[sk] = fields.stats[sk];
        });
      } else {
        profile[key] = fields[key];
      }
    });
    save(profile);
    return profile;
  }

  function incrementStat(statName, amount) {
    var profile = load();
    if (!profile) return;
    profile.stats[statName] = (profile.stats[statName] || 0) + (amount || 1);
    save(profile);
    return profile;
  }

  // --- Avatar pixel-art processing ---

  function processAvatar(file, callback) {
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        var result = pixelateImage(img);
        callback(result);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function pixelateImage(img) {
    var PIXEL_SIZE = 48; // downscale resolution
    var DISPLAY_SIZE = 128; // display resolution
    var COLORS = 32; // color levels per channel

    // Step 1: Center crop to square
    var size = Math.min(img.width, img.height);
    var sx = (img.width - size) / 2;
    var sy = (img.height - size) / 2;

    // Step 2: Downscale
    var small = document.createElement('canvas');
    small.width = PIXEL_SIZE;
    small.height = PIXEL_SIZE;
    var sCtx = small.getContext('2d');
    sCtx.imageSmoothingEnabled = true;
    sCtx.drawImage(img, sx, sy, size, size, 0, 0, PIXEL_SIZE, PIXEL_SIZE);

    // Step 3: Color quantization (posterize)
    var imageData = sCtx.getImageData(0, 0, PIXEL_SIZE, PIXEL_SIZE);
    var data = imageData.data;
    var step = 256 / COLORS;

    for (var i = 0; i < data.length; i += 4) {
      data[i] = Math.round(data[i] / step) * step;       // R
      data[i + 1] = Math.round(data[i + 1] / step) * step; // G
      data[i + 2] = Math.round(data[i + 2] / step) * step; // B
      // Alpha stays
    }
    sCtx.putImageData(imageData, 0, 0);

    // Step 4: Scale up with nearest-neighbor
    var big = document.createElement('canvas');
    big.width = DISPLAY_SIZE;
    big.height = DISPLAY_SIZE;
    var bCtx = big.getContext('2d');
    bCtx.imageSmoothingEnabled = false;
    bCtx.drawImage(small, 0, 0, DISPLAY_SIZE, DISPLAY_SIZE);

    // Export as data URL
    return big.toDataURL('image/png');
  }

  // Delete profile
  function remove() {
    localStorage.removeItem(PROFILE_KEY);
  }

  // --- Export ---
  window.ChineseChess.Profile = {
    load: load,
    save: save,
    exists: exists,
    create: create,
    update: update,
    incrementStat: incrementStat,
    processAvatar: processAvatar,
    remove: remove
  };
})();
