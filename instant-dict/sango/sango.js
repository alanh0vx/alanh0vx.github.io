// Sango IC card — 三國演義 strategy game module for 萬能通 OMNI·DICT.
// Loaded eagerly; the host (instant-dict/index.html) only enters this mode
// after the user picks the card from the EXT-IC chooser.
//
// Game shape (year 中平六年 / 189 AD):
//   - 8 cities; 8 lords (4 playable + 4 NPC).
//   - Each in-game month, the player has 行動力 (action points). Each
//     action consumes AP. When the player picks 結束, the month advances:
//       AI lords each act once; cities tick economy; AP +60 (cap 100).
//   - 70 武將 in the roster (16 with portraits, 54 text-only). Most start
//     "在野" — discoverable via 訪賢.
//   - Win: own all 8 cities. Lose: own 0.

(function () {
  'use strict';

  /* =========================================================
   *  Static data
   * ========================================================= */

  // 16 武將 with portraits — positions in sango_characters_map.png.
  const G = [
    { row: 0, col: 0, name: '劉備',   zi: '玄德', faction: 'shu', war: 75, hp: 92,  iq: 80,  chr: 100 },
    { row: 0, col: 1, name: '關羽',   zi: '雲長', faction: 'shu', war: 97, hp: 89,  iq: 75,  chr: 92  },
    { row: 0, col: 2, name: '張飛',   zi: '翼德', faction: 'shu', war: 96, hp: 96,  iq: 45,  chr: 74  },
    { row: 0, col: 3, name: '諸葛亮', zi: '孔明', faction: 'shu', war: 60, hp: 78,  iq: 100, chr: 96  },
    { row: 1, col: 0, name: '趙雲',   zi: '子龍', faction: 'shu', war: 96, hp: 90,  iq: 76,  chr: 88  },
    { row: 1, col: 1, name: '馬超',   zi: '孟起', faction: 'shu', war: 97, hp: 92,  iq: 50,  chr: 80  },
    { row: 1, col: 2, name: '曹操',   zi: '孟德', faction: 'wei', war: 78, hp: 84,  iq: 96,  chr: 95  },
    { row: 1, col: 3, name: '司馬懿', zi: '仲達', faction: 'wei', war: 70, hp: 80,  iq: 99,  chr: 80  },
    { row: 2, col: 0, name: '夏侯惇', zi: '元讓', faction: 'wei', war: 88, hp: 86,  iq: 60,  chr: 75  },
    { row: 2, col: 1, name: '張遼',   zi: '文遠', faction: 'wei', war: 92, hp: 88,  iq: 78,  chr: 80  },
    { row: 2, col: 2, name: '典韋',   zi: '惡來', faction: 'wei', war: 96, hp: 95,  iq: 30,  chr: 60  },
    { row: 2, col: 3, name: '孫權',   zi: '仲謀', faction: 'wu',  war: 75, hp: 88,  iq: 85,  chr: 90  },
    { row: 3, col: 0, name: '周瑜',   zi: '公瑾', faction: 'wu',  war: 85, hp: 80,  iq: 96,  chr: 95  },
    { row: 3, col: 1, name: '陸遜',   zi: '伯言', faction: 'wu',  war: 78, hp: 82,  iq: 95,  chr: 84  },
    { row: 3, col: 2, name: '呂布',   zi: '奉先', faction: 'qun', war: 100,hp: 95,  iq: 30,  chr: 70  },
    { row: 3, col: 3, name: '貂蟬',   zi: '',     faction: 'qun', war: 30, hp: 60,  iq: 88,  chr: 100 }
  ];

  // 54 additional historical 武將 (no portraits — text only).
  // Ordering matters: ALL[16+i] = EXTRA[i].
  const EXTRA = [
    // Shu 蜀漢 (9)
    { name: '黃忠',   zi: '漢升', faction: 'shu', war: 92, hp: 78, iq: 60, chr: 75 },
    { name: '魏延',   zi: '文長', faction: 'shu', war: 91, hp: 85, iq: 60, chr: 50 },
    { name: '龐統',   zi: '士元', faction: 'shu', war: 30, hp: 60, iq: 95, chr: 80 },
    { name: '法正',   zi: '孝直', faction: 'shu', war: 50, hp: 65, iq: 92, chr: 75 },
    { name: '姜維',   zi: '伯約', faction: 'shu', war: 88, hp: 80, iq: 90, chr: 78 },
    { name: '馬岱',   zi: '仲華', faction: 'shu', war: 82, hp: 80, iq: 65, chr: 70 },
    { name: '廖化',   zi: '元儉', faction: 'shu', war: 75, hp: 78, iq: 55, chr: 65 },
    { name: '糜竺',   zi: '子仲', faction: 'shu', war: 25, hp: 60, iq: 75, chr: 90 },
    { name: '簡雍',   zi: '憲和', faction: 'shu', war: 30, hp: 55, iq: 78, chr: 90 },
    // Wei 曹魏 (14)
    { name: '夏侯淵', zi: '妙才', faction: 'wei', war: 92, hp: 86, iq: 65, chr: 78 },
    { name: '曹仁',   zi: '子孝', faction: 'wei', war: 88, hp: 90, iq: 78, chr: 80 },
    { name: '曹洪',   zi: '子廉', faction: 'wei', war: 80, hp: 84, iq: 60, chr: 65 },
    { name: '許褚',   zi: '仲康', faction: 'wei', war: 96, hp: 95, iq: 28, chr: 65 },
    { name: '徐晃',   zi: '公明', faction: 'wei', war: 92, hp: 85, iq: 75, chr: 78 },
    { name: '張郃',   zi: '儁乂', faction: 'wei', war: 91, hp: 84, iq: 80, chr: 75 },
    { name: '于禁',   zi: '文則', faction: 'wei', war: 86, hp: 80, iq: 70, chr: 65 },
    { name: '樂進',   zi: '文謙', faction: 'wei', war: 85, hp: 80, iq: 70, chr: 70 },
    { name: '龐德',   zi: '令明', faction: 'wei', war: 90, hp: 84, iq: 65, chr: 78 },
    { name: '郭嘉',   zi: '奉孝', faction: 'wei', war: 30, hp: 58, iq: 96, chr: 88 },
    { name: '荀彧',   zi: '文若', faction: 'wei', war: 30, hp: 70, iq: 95, chr: 92 },
    { name: '荀攸',   zi: '公達', faction: 'wei', war: 35, hp: 70, iq: 92, chr: 80 },
    { name: '程昱',   zi: '仲德', faction: 'wei', war: 50, hp: 75, iq: 90, chr: 75 },
    { name: '賈詡',   zi: '文和', faction: 'wei', war: 35, hp: 78, iq: 96, chr: 70 },
    // Wu 孫吳 (12)
    { name: '孫策',   zi: '伯符', faction: 'wu',  war: 95, hp: 90, iq: 70, chr: 92 },
    { name: '程普',   zi: '德謀', faction: 'wu',  war: 86, hp: 85, iq: 75, chr: 80 },
    { name: '黃蓋',   zi: '公覆', faction: 'wu',  war: 85, hp: 88, iq: 72, chr: 78 },
    { name: '韓當',   zi: '義公', faction: 'wu',  war: 82, hp: 80, iq: 65, chr: 70 },
    { name: '祖茂',   zi: '大榮', faction: 'wu',  war: 78, hp: 75, iq: 50, chr: 65 },
    { name: '太史慈', zi: '子義', faction: 'wu',  war: 92, hp: 85, iq: 70, chr: 80 },
    { name: '甘寧',   zi: '興霸', faction: 'wu',  war: 95, hp: 90, iq: 75, chr: 75 },
    { name: '周泰',   zi: '幼平', faction: 'wu',  war: 90, hp: 95, iq: 60, chr: 72 },
    { name: '凌統',   zi: '公績', faction: 'wu',  war: 88, hp: 82, iq: 68, chr: 75 },
    { name: '呂蒙',   zi: '子明', faction: 'wu',  war: 88, hp: 85, iq: 92, chr: 80 },
    { name: '魯肅',   zi: '子敬', faction: 'wu',  war: 50, hp: 75, iq: 90, chr: 88 },
    { name: '張昭',   zi: '子布', faction: 'wu',  war: 30, hp: 70, iq: 92, chr: 90 },
    // 群雄 (19)
    { name: '李傕',   zi: '稚然', faction: 'qun', war: 80, hp: 75, iq: 60, chr: 50 },
    { name: '郭汜',   zi: '阿多', faction: 'qun', war: 78, hp: 75, iq: 55, chr: 50 },
    { name: '顏良',   zi: '',     faction: 'qun', war: 92, hp: 86, iq: 30, chr: 65 },
    { name: '文醜',   zi: '',     faction: 'qun', war: 90, hp: 85, iq: 30, chr: 65 },
    { name: '田豐',   zi: '元皓', faction: 'qun', war: 35, hp: 65, iq: 92, chr: 70 },
    { name: '沮授',   zi: '',     faction: 'qun', war: 40, hp: 70, iq: 90, chr: 75 },
    { name: '審配',   zi: '正南', faction: 'qun', war: 50, hp: 75, iq: 82, chr: 70 },
    { name: '紀靈',   zi: '',     faction: 'qun', war: 85, hp: 80, iq: 50, chr: 65 },
    { name: '陶謙',   zi: '恭祖', faction: 'qun', war: 60, hp: 65, iq: 75, chr: 80 },
    { name: '劉表',   zi: '景升', faction: 'qun', war: 65, hp: 70, iq: 78, chr: 88 },
    { name: '黃祖',   zi: '',     faction: 'qun', war: 75, hp: 75, iq: 60, chr: 60 },
    { name: '蔡瑁',   zi: '德珪', faction: 'qun', war: 70, hp: 70, iq: 70, chr: 60 },
    { name: '蒯越',   zi: '異度', faction: 'qun', war: 50, hp: 70, iq: 88, chr: 75 },
    { name: '馬騰',   zi: '壽成', faction: 'qun', war: 88, hp: 88, iq: 65, chr: 80 },
    { name: '韓遂',   zi: '文約', faction: 'qun', war: 80, hp: 80, iq: 75, chr: 75 },
    { name: '華雄',   zi: '',     faction: 'qun', war: 85, hp: 82, iq: 30, chr: 60 },
    { name: '張角',   zi: '',     faction: 'qun', war: 60, hp: 70, iq: 88, chr: 95 },
    { name: '張寶',   zi: '',     faction: 'qun', war: 70, hp: 75, iq: 60, chr: 70 },
    { name: '左慈',   zi: '元放', faction: 'qun', war: 30, hp: 70, iq: 100,chr: 95 }
  ];

  // ALL = G concat EXTRA. Indexes 0..15 are portrait-backed; 16..69 are text.
  const ALL = G.concat(EXTRA);
  function hasPortrait(idx) { return idx < G.length; }

  const FACTION_FULL = { shu: '蜀漢', wei: '曹魏', wu: '孫吳', qun: '群雄' };

  const LORDS = [
    { id: 'liubei',     name: '劉備',   zi: '玄德', gIdx: 0,  gens: [1, 2],     mark: '劉', playable: true,  faction: 'shu' },
    { id: 'caocao',     name: '曹操',   zi: '孟德', gIdx: 6,  gens: [8, 9, 10], mark: '曹', playable: true,  faction: 'wei' },
    { id: 'sunjian',    name: '孫堅',   zi: '文台', gIdx: 11, gens: [12, 13],   mark: '孫', playable: true,  faction: 'wu'  },
    { id: 'lubu',       name: '呂布',   zi: '奉先', gIdx: 14, gens: [15],       mark: '呂', playable: true,  faction: 'qun' },
    { id: 'dongzhuo',   name: '董卓',   zi: '仲穎', gIdx: -1, gens: [],         mark: '卓', playable: false, faction: 'qun' },
    { id: 'yuanshao',   name: '袁紹',   zi: '本初', gIdx: -1, gens: [],         mark: '紹', playable: false, faction: 'qun' },
    { id: 'gongsunzan', name: '公孫瓚', zi: '伯珪', gIdx: -1, gens: [],         mark: '瓚', playable: false, faction: 'qun' },
    { id: 'yuanshu',    name: '袁術',   zi: '公路', gIdx: -1, gens: [],         mark: '術', playable: false, faction: 'qun' }
  ];
  function lord(id) { return LORDS.find(l => l.id === id); }

  // 8 cities. Indexes in `gens` reference ALL[].
  // 民度 (develop) — population/tax base, affects rice income mainly.
  // 商業 (commerce) — commerce/markets, affects gold income.
  const CITIES_DEF = [
    { id: 'beiping',   name: '北平', pos: [80, 12], adj: ['bohai','pingyuan'],
      init: { lord: 'gongsunzan', gold: 1500, rice: 6000,  soldiers: 7000,  develop: 50, commerce: 35, gens: [] } },
    { id: 'bohai',     name: '渤海', pos: [70, 24], adj: ['beiping','luoyang','pingyuan'],
      init: { lord: 'yuanshao',   gold: 3000, rice: 12000, soldiers: 12000, develop: 60, commerce: 50, gens: [53, 54, 55, 56, 57] } },
    { id: 'luoyang',   name: '洛陽', pos: [49, 38], adj: ['bohai','chenliu','nanyang'],
      init: { lord: 'dongzhuo',   gold: 8000, rice: 25000, soldiers: 30000, develop: 90, commerce: 80, gens: [51, 52, 66] } },
    { id: 'pingyuan',  name: '平原', pos: [70, 38], adj: ['beiping','bohai','chenliu','xuzhou'],
      init: { lord: 'liubei',     gold: 1500, rice: 6000,  soldiers: 4500,  develop: 45, commerce: 30, gens: [0, 1, 2] } },
    { id: 'chenliu',   name: '陳留', pos: [56, 44], adj: ['luoyang','pingyuan','xuzhou','nanyang'],
      init: { lord: 'caocao',     gold: 2500, rice: 9000,  soldiers: 8000,  develop: 55, commerce: 60, gens: [6, 8, 9, 10, 25, 26, 28, 34, 35] } },
    { id: 'xuzhou',    name: '徐州', pos: [69, 51], adj: ['pingyuan','chenliu','nanyang'],
      init: { lord: 'lubu',       gold: 1800, rice: 6000,  soldiers: 6500,  develop: 50, commerce: 50, gens: [14, 15] } },
    { id: 'nanyang',   name: '南陽', pos: [55, 58], adj: ['luoyang','chenliu','xuzhou','changsha'],
      init: { lord: 'yuanshu',    gold: 2000, rice: 8000,  soldiers: 8000,  develop: 60, commerce: 65, gens: [58] } },
    { id: 'changsha',  name: '長沙', pos: [56, 76], adj: ['nanyang'],
      init: { lord: 'sunjian',    gold: 2000, rice: 7500,  soldiers: 5500,  develop: 55, commerce: 40, gens: [11, 12, 13, 39, 40, 41, 42, 43] } }
  ];
  function cdef(id) { return CITIES_DEF.find(c => c.id === id); }

  /* =========================================================
   *  Action points & costs
   * ========================================================= */
  const AP_MAX     = 100;
  const AP_RESTORE = 60;
  const AP_COST = {
    develop:  30,
    commerce: 30,
    recruit:  30,
    attack:   50,
    search:   40
  };

  const ACTIONS = [
    { key: '1', zh: '內政', desc: '開發 / 徵兵 / 訪賢　(分項耗 AP)', sub: 'admin-menu' },
    { key: '2', zh: '軍事', desc: '出陣攻城　(AP 50)',                sub: 'military-menu' },
    { key: '3', zh: '武將', desc: '查看 16 位有像武將圖鑑',           view: 'characters' },
    { key: '4', zh: '名簿', desc: '查看天下 ' + ALL.length + ' 武將名簿', view: 'roster' },
    { key: '5', zh: '城池', desc: '查看天下 8 城形勢',                 view: 'cities' },
    { key: '6', zh: '結束', desc: '結束本月　翌月 AP +' + AP_RESTORE + ' (上限 ' + AP_MAX + ')', endTurn: true }
  ];

  const ADMIN_OPTS = [
    { key: '1', zh: '開發', cost: AP_COST.develop, sub: 'pick-develop',
      hint: '提升民度　+10 民度　主增米收　(300 金，AP ' + AP_COST.develop + ')' },
    { key: '2', zh: '商業', cost: AP_COST.commerce, sub: 'pick-commerce',
      hint: '振興商業　+10 商業度　主增金收　(200 金，AP ' + AP_COST.commerce + ')' },
    { key: '3', zh: '徵兵', cost: AP_COST.recruit, sub: 'pick-recruit',
      hint: '徵募鄉勇　+500 兵　(200 金 500 米，AP ' + AP_COST.recruit + ')' },
    { key: '4', zh: '訪賢', cost: AP_COST.search,  sub: 'pick-search',
      hint: '尋訪在野武將　約 4 成入仕　(AP ' + AP_COST.search + ')' }
  ];
  const MILITARY_OPTS = [
    { key: '1', zh: '出陣', cost: AP_COST.attack, sub: 'pick-attack-from',
      hint: '從己方城池出兵攻打相鄰敵城　(AP ' + AP_COST.attack + ')' }
  ];

  const ART = {
    title:      'sango/sango_title.png',
    map:        'sango/sango_map1.png',
    characters: 'sango/sango_characters_map.png'
  };

  /* =========================================================
   *  Helpers
   * ========================================================= */

  function spriteStyle(idx, scale) {
    const g = G[idx];
    if (!g) return '';
    const cw = 384 * scale, ch = 256 * scale;
    return 'width:' + cw + 'px;height:' + ch + 'px;' +
      'background-image:url(\'' + ART.characters + '\');' +
      'background-size:' + (1536 * scale) + 'px ' + (1024 * scale) + 'px;' +
      'background-position:-' + (g.col * cw) + 'px -' + (g.row * ch) + 'px;' +
      'image-rendering:pixelated;';
  }

  const SCHEMA = 5;
  function init(state) {
    if (!state.sango || state.sango._v !== SCHEMA) {
      state.sango = { _v: SCHEMA, view: 'title', selected: 0, pickSel: 0, actionSel: 0 };
    }
  }

  function ownedCities(s, lordId) {
    return CITIES_DEF.filter(c => s.cities[c.id].lord === lordId);
  }
  function ownedCount(s, lordId) { return ownedCities(s, lordId).length; }
  function totalGold(s, lordId) { return ownedCities(s, lordId).reduce((a, c) => a + s.cities[c.id].gold, 0); }
  function totalRice(s, lordId) { return ownedCities(s, lordId).reduce((a, c) => a + s.cities[c.id].rice, 0); }
  function totalSoldiers(s, lordId) { return ownedCities(s, lordId).reduce((a, c) => a + s.cities[c.id].soldiers, 0); }
  function totalGenerals(s, lordId) {
    let n = 0;
    for (const c of CITIES_DEF) if (s.cities[c.id].lord === lordId) n += s.cities[c.id].gens.length;
    return n;
  }

  function eligibleCities(s, lordId, pred) {
    return CITIES_DEF.filter(c => pred(s.cities[c.id], c)).map(c => c.id);
  }

  // Set of all general indexes currently employed somewhere (sum of city.gens).
  function employedSet(s) {
    const set = new Set();
    for (const cd of CITIES_DEF) for (const gi of s.cities[cd.id].gens) set.add(gi);
    return set;
  }

  function startGame(state, pickIdx) {
    const playable = LORDS.filter(l => l.playable);
    const chosen = playable[pickIdx];
    const cities = {};
    for (const c of CITIES_DEF) cities[c.id] = JSON.parse(JSON.stringify(c.init));
    state.sango = {
      _v: SCHEMA,
      view: 'briefing',
      subState: 'actions',
      playerLordId: chosen.id,
      year: 189, month: 1,
      ap: AP_MAX,
      actionSel: 0, subSel: 0, citySel: 0, citySel2: 0,
      selected: 0, pickSel: pickIdx, rosterPage: 0,
      cities,
      log: ['中平六年 正月　' + chosen.name + '　起兵立業'],
      result: null
    };
  }

  /* =========================================================
   *  Turn / economy
   * ========================================================= */

  // Tick every city's economy at end of month.
  //   gold income = 民度 × 2 + 商業 × 4   (commerce-heavy cities prosper)
  //   rice income = 民度 × 40             (rice tied to population/民度)
  //   gold upkeep = soldiers / 100
  //   rice upkeep = soldiers / 4
  function tickEconomy(s) {
    for (const c of CITIES_DEF) {
      const cs = s.cities[c.id];
      const commerce = cs.commerce || 0;
      const goldIn = Math.floor(cs.develop * 2 + commerce * 4);
      const riceIn = Math.floor(cs.develop * 40);
      const upkeepGold = Math.floor(cs.soldiers / 100);
      const upkeepRice = Math.floor(cs.soldiers / 4);
      cs.gold = Math.max(0, cs.gold + goldIn - upkeepGold);
      cs.rice += riceIn - upkeepRice;
      if (cs.rice < 0) {
        const lost = Math.min(cs.soldiers, -cs.rice * 4);
        cs.soldiers -= lost;
        cs.rice = 0;
        if (cs.lord === s.playerLordId && lost > 0) {
          s.log.unshift(c.name + '　糧盡兵潰　逃兵 ' + lost);
        }
      }
    }
  }

  // Each NPC lord acts once per month. Year 189 = grace period — NPCs won't
  // attack the player at all, and inter-NPC attacks are rarer.
  // Returns a summary of what each NPC did (used for end-turn alert).
  function aiTick(s) {
    const earlyGame = (s.year === 189);
    const summary = [];
    for (const l of LORDS) {
      if (l.id === s.playerLordId) continue;
      const own = ownedCities(s, l.id);
      if (!own.length) continue;
      const myStrong = own.reduce((a, b) => s.cities[a.id].soldiers > s.cities[b.id].soldiers ? a : b);
      const ms = s.cities[myStrong.id];
      const enemyAdj = myStrong.adj
        .map(id => ({ id, st: s.cities[id] }))
        .filter(x => x.st.lord !== l.id);

      // try attack
      let attacked = false;
      if (enemyAdj.length && ms.soldiers > 6000) {
        const weakest = enemyAdj.reduce((a, b) => a.st.soldiers < b.st.soldiers ? a : b);
        const targetingPlayer = (weakest.st.lord === s.playerLordId);
        if (!(targetingPlayer && earlyGame)) {
          const threshold = targetingPlayer ? 2.8 : 2.0;
          const chance    = targetingPlayer ? 0.18 : (earlyGame ? 0.12 : 0.30);
          if (ms.soldiers > weakest.st.soldiers * threshold && Math.random() < chance) {
            const preOwner = s.cities[weakest.id].lord;
            resolveAttack(s, myStrong.id, weakest.id);
            const won = (s.cities[weakest.id].lord !== preOwner);
            summary.push({ lord: l, action: 'attack', from: cdef(myStrong.id).name, to: cdef(weakest.id).name, won: won });
            attacked = true;
          }
        }
      }
      if (attacked) continue;

      // domestic action — pick at random across develop / commerce / recruit
      const target = own[Math.floor(Math.random() * own.length)];
      const ts = s.cities[target.id];
      const roll = Math.random();
      if (roll < 0.4 && ts.gold >= 300 && ts.develop < 100) {
        ts.gold -= 300;
        ts.develop = Math.min(100, ts.develop + 6);
        summary.push({ lord: l, action: 'develop', city: target.name });
      } else if (roll < 0.7 && ts.gold >= 200 && (ts.commerce || 0) < 100) {
        ts.gold -= 200;
        ts.commerce = Math.min(100, (ts.commerce || 0) + 6);
        summary.push({ lord: l, action: 'commerce', city: target.name });
      } else if (ts.gold >= 200 && ts.rice >= 500) {
        ts.gold -= 200; ts.rice -= 500; ts.soldiers += 500;
        summary.push({ lord: l, action: 'recruit', city: target.name });
      } else {
        summary.push({ lord: l, action: 'idle', city: target.name });
      }
    }
    return summary;
  }

  const ACTION_VERB = {
    attack:   '攻',
    develop:  '開發',
    commerce: '興商',
    recruit:  '徵兵',
    idle:     '休養'
  };
  function summarizeAITurn(summary) {
    return summary.map(it => {
      if (it.action === 'attack') {
        return it.lord.name + (it.won ? ' 自 ' + it.from + ' 攻陷 ' + it.to : ' 攻 ' + it.to + ' 不克');
      }
      return it.lord.name + ' 於 ' + it.city + ' ' + ACTION_VERB[it.action];
    });
  }

  // Attack from `fromId` to `toId`. Mutates state, appends log.
  function resolveAttack(s, fromId, toId) {
    const from = s.cities[fromId], to = s.cities[toId];
    const fromName = cdef(fromId).name, toName = cdef(toId).name;
    const fromBonus = sumGenWar(s, fromId);
    const toBonus   = sumGenWar(s, toId);
    const atkPow = from.soldiers * (1 + fromBonus / 400) * (0.85 + Math.random() * 0.3);
    const defPow = to.soldiers   * (1 + toBonus   / 400) * (1.0  + Math.random() * 0.3) + to.develop * 30;
    const isPlayerInvolved = (from.lord === s.playerLordId || to.lord === s.playerLordId);
    if (atkPow > defPow) {
      const surv = Math.floor(from.soldiers * 0.7);
      const split = Math.floor(surv * 0.4);
      from.soldiers = surv - split;
      const oldOwner = to.lord;
      to.lord = from.lord;
      to.soldiers = split;
      to.gens = [];   // defending generals scatter when city falls
      if (isPlayerInvolved) s.log.unshift('★ ' + lord(from.lord).name + ' 自 ' + fromName + ' 攻陷 ' + toName + '　降兵 ' + split);
      else s.log.unshift(lord(from.lord).name + ' 攻陷 ' + lord(oldOwner).name + ' 之 ' + toName);
    } else {
      const aLost = Math.floor(from.soldiers * 0.55);
      const dLost = Math.floor(to.soldiers * 0.18);
      from.soldiers -= aLost;
      to.soldiers -= dLost;
      if (isPlayerInvolved) s.log.unshift('× ' + lord(from.lord).name + ' 攻 ' + toName + ' 不克　折兵 ' + aLost);
      else s.log.unshift(lord(from.lord).name + ' 攻 ' + toName + ' 失利');
    }
    if (s.log.length > 10) s.log.length = 10;
  }
  // Cap general bonus to avoid runaway combat math.
  function sumGenWar(s, cityId) {
    let sum = 0;
    for (const gi of s.cities[cityId].gens) {
      const g = ALL[gi];
      if (g) sum += g.war;
    }
    return Math.min(sum, 500);
  }

  function checkEnd(s) {
    const myCount = ownedCount(s, s.playerLordId);
    if (myCount === CITIES_DEF.length) s.result = 'win';
    else if (myCount === 0) s.result = 'lose';
  }

  // After the player commits 結束, advance the world.
  function advanceMonth(s) {
    const aiSummary = aiTick(s);
    tickEconomy(s);
    s.month++;
    if (s.month > 12) { s.month = 1; s.year++; }
    s.ap = Math.min(AP_MAX, s.ap + AP_RESTORE);
    checkEnd(s);
    if (s.result) {
      s.subState = 'gameover';
      return;
    }
    // Show end-turn summary alert listing each NPC's action this month.
    const lines = ['翌月　' + s.year + '年 ' + s.month + '月　行動力 +' + AP_RESTORE];
    const summaryLines = summarizeAITurn(aiSummary);
    if (summaryLines.length) lines.push('—— 諸侯動向 ——'); else lines.push('(諸侯按兵)');
    for (const l of summaryLines) lines.push(l);
    s.lastResult = { title: '本月結算', lines: lines, success: true };
    s.subState = 'result';
  }

  /* =========================================================
   *  Player actions  (do NOT advance the month — just consume AP)
   * ========================================================= */

  function logLine(s, line) {
    s.log.unshift(line);
    if (s.log.length > 10) s.log.length = 10;
  }
  function logFail(s, msg) {
    logLine(s, msg);
    s.lastResult = { title: '無法執行', lines: [msg], success: false };
    s.subState = 'result';
    return false;
  }
  function setResult(s, title, lines, success) {
    s.lastResult = { title: title, lines: lines, success: success !== false };
    s.subState = 'result';
    logLine(s, title + '　' + lines.join('　'));
  }
  // Format "label  before → after"
  function delta(label, before, after, suffix) {
    return label + '　' + before + ' → ' + after + (suffix || '');
  }

  function doDevelop(s, cityId) {
    if (s.ap < AP_COST.develop) return logFail(s, '行動力不足，無法開發');
    const c = s.cities[cityId];
    if (c.lord !== s.playerLordId) return false;
    if (c.gold < 300) return logFail(s, '金不足，無法開發 ' + cdef(cityId).name);
    if (c.develop >= 100) return logFail(s, cdef(cityId).name + ' 民度已達極盛');
    const apB = s.ap, gB = c.gold, dB = c.develop;
    s.ap -= AP_COST.develop;
    c.gold -= 300;
    c.develop = Math.min(100, c.develop + 10);
    setResult(s, '開發 ' + cdef(cityId).name, [
      delta('民度', dB, c.develop),
      delta('金',   gB, c.gold),
      delta('AP',   apB, s.ap)
    ]);
    return true;
  }
  function doCommerce(s, cityId) {
    if (s.ap < AP_COST.commerce) return logFail(s, '行動力不足，無法興商');
    const c = s.cities[cityId];
    if (c.lord !== s.playerLordId) return false;
    if (c.gold < 200) return logFail(s, '金不足，無法興商 ' + cdef(cityId).name);
    if ((c.commerce || 0) >= 100) return logFail(s, cdef(cityId).name + ' 商業已達極盛');
    const apB = s.ap, gB = c.gold, cB = c.commerce || 0;
    s.ap -= AP_COST.commerce;
    c.gold -= 200;
    c.commerce = Math.min(100, cB + 10);
    setResult(s, '商業 ' + cdef(cityId).name, [
      delta('商業度', cB, c.commerce),
      delta('金',     gB, c.gold),
      delta('AP',     apB, s.ap),
      '※ 翌月起金收入提升'
    ]);
    return true;
  }
  function doRecruit(s, cityId) {
    if (s.ap < AP_COST.recruit) return logFail(s, '行動力不足，無法徵兵');
    const c = s.cities[cityId];
    if (c.lord !== s.playerLordId) return false;
    if (c.gold < 200 || c.rice < 500) return logFail(s, cdef(cityId).name + '　金/米不足');
    const apB = s.ap, gB = c.gold, rB = c.rice, sB = c.soldiers;
    s.ap -= AP_COST.recruit;
    c.gold -= 200; c.rice -= 500; c.soldiers += 500;
    setResult(s, '徵兵 ' + cdef(cityId).name, [
      delta('兵', sB, c.soldiers),
      delta('金', gB, c.gold),
      delta('米', rB, c.rice),
      delta('AP', apB, s.ap)
    ]);
    return true;
  }
  function doSearch(s, cityId) {
    if (s.ap < AP_COST.search) return logFail(s, '行動力不足，無法訪賢');
    const c = s.cities[cityId];
    if (c.lord !== s.playerLordId) return false;
    const apB = s.ap;
    s.ap -= AP_COST.search;
    const employed = employedSet(s);
    const free = [];
    for (let i = 0; i < ALL.length; i++) if (!employed.has(i)) free.push(i);
    if (Math.random() < 0.4 && free.length) {
      const found = free[Math.floor(Math.random() * free.length)];
      c.gens.push(found);
      const g = ALL[found];
      setResult(s, '訪賢 ' + cdef(cityId).name, [
        '★ 得 ' + g.name + (g.zi ? ' ' + g.zi : ''),
        '所属 ' + FACTION_FULL[g.faction],
        '武 ' + g.war + '　勇 ' + g.hp + '　智 ' + g.iq + '　魅 ' + g.chr,
        delta('AP', apB, s.ap)
      ]);
    } else {
      setResult(s, '訪賢 ' + cdef(cityId).name, [
        '× 遣使無功',
        '無賢可得',
        delta('AP', apB, s.ap)
      ], false);
    }
    return true;
  }
  function doAttack(s, fromId, toId) {
    if (s.ap < AP_COST.attack) return logFail(s, '行動力不足，無法出陣');
    const f = s.cities[fromId], t = s.cities[toId];
    if (f.lord !== s.playerLordId) return false;
    if (t.lord === s.playerLordId) return false;
    if (!cdef(fromId).adj.includes(toId)) return false;
    if (f.soldiers < 1000) return logFail(s, '兵力不足，無法出陣');
    const apB = s.ap, fB = f.soldiers, tB = t.soldiers, oldOwner = t.lord;
    s.ap -= AP_COST.attack;
    resolveAttack(s, fromId, toId);
    const won = t.lord === s.playerLordId;
    setResult(s, '出陣 ' + cdef(fromId).name + ' → ' + cdef(toId).name, won ? [
      '★ 攻陷 ' + cdef(toId).name + '　奪自 ' + lord(oldOwner).name,
      delta('我兵 (' + cdef(fromId).name + ')', fB, f.soldiers),
      delta('守兵 (' + cdef(toId).name   + ')', tB, t.soldiers),
      delta('AP', apB, s.ap)
    ] : [
      '× 攻 ' + cdef(toId).name + ' 不克',
      delta('我兵', fB, f.soldiers),
      delta('敵兵', tB, t.soldiers),
      delta('AP', apB, s.ap)
    ], won);
    return true;
  }

  /* =========================================================
   *  Render
   * ========================================================= */

  function render(state, el) {
    init(state);
    const v = state.sango.view;
    el.classList.remove('cn-mode');
    el.classList.add('single');
    if (v === 'lord-pick')        return renderLordPick(state, el);
    if (v === 'briefing')         return renderBriefing(state, el);
    if (v === 'main')             return renderMain(state, el);
    if (v === 'characters')       return renderCharacters(state, el);
    if (v === 'character-detail') return renderDetail(state, el);
    if (v === 'cities')           return renderCityList(state, el);
    if (v === 'roster')           return renderRoster(state, el);
    return renderTitle(el);
  }

  function renderTitle(el) {
    el.innerHTML =
      '<div class="sango-screen sango-title">' +
        '<img class="sango-title-img" src="' + ART.title + '" alt="三國演義" />' +
        '<div class="sango-press">▶ PRESS  ENTER  TO  PLAY</div>' +
        '<div class="sango-foot">EXT-IC · SANGO-01 · 中平六年 (189 AD)</div>' +
      '</div>';
  }

  function renderLordPick(state, el) {
    const sel = state.sango.pickSel || 0;
    const playable = LORDS.filter(l => l.playable);
    let cells = '';
    for (let i = 0; i < playable.length; i++) {
      const L = playable[i];
      const home = CITIES_DEF.find(c => c.init.lord === L.id);
      const homeName = home ? home.name : '－';
      const homeInit = home ? home.init : { soldiers: 0, gold: 0, rice: 0, gens: [] };
      const gensList = (homeInit.gens.length
        ? homeInit.gens.map(gi => ALL[gi] ? ALL[gi].name : '？').join('・')
        : '單身赴任');
      cells +=
        '<div class="sango-lord' + (i === sel ? ' is-sel' : '') + '" data-sango-lord="' + i + '">' +
          '<div class="sango-portrait" style="' + spriteStyle(L.gIdx, 1/3.5) + '"></div>' +
          '<div class="sango-lord-name">' + L.name + '</div>' +
          '<div class="sango-lord-faction">' + FACTION_FULL[L.faction] + ' · ' + homeName + '</div>' +
          '<div class="sango-lord-stat">兵 ' + homeInit.soldiers + '　金 ' + homeInit.gold + '</div>' +
          '<div class="sango-lord-gens">' + gensList + '</div>' +
        '</div>';
    }
    el.innerHTML =
      '<div class="sango-screen sango-pick">' +
        '<div class="sango-pick-title">擇　君　主</div>' +
        '<div class="sango-pick-row">' + cells + '</div>' +
        '<div class="sango-pick-foot">◀ ▶ 選擇　ENTER 確定　◀ 返回</div>' +
      '</div>';
  }

  function renderBriefing(state, el) {
    const s = state.sango;
    const L = lord(s.playerLordId);
    const home = CITIES_DEF.find(c => s.cities[c.id].lord === s.playerLordId);
    el.innerHTML =
      '<div class="sango-screen sango-briefing">' +
        '<div class="sango-briefing-h">中　平　六　年　春正月</div>' +
        '<div class="sango-briefing-body">' +
          '<p class="sango-briefing-lead">' +
            L.name + (L.zi ? ' ' + L.zi : '') + '　起兵於 <b>' + home.name + '</b>，' +
            '時　漢靈帝駕崩，董卓亂政，群雄割據。' +
          '</p>' +
          '<div class="sango-briefing-rules">' +
            '<div class="sango-briefing-row"><span>行動力</span><span>每月有 ' + AP_MAX + ' AP，每月開始 +' + AP_RESTORE + '。各令耗 30~50 AP。</span></div>' +
            '<div class="sango-briefing-row"><span>1　內政</span><span>開發 (300金) / 徵兵 (200金 500米) / 訪賢</span></div>' +
            '<div class="sango-briefing-row"><span>2　軍事</span><span>從己方城池出兵攻打相鄰敵城</span></div>' +
            '<div class="sango-briefing-row"><span>3　武將</span><span>查看 16 位有像武將圖鑑</span></div>' +
            '<div class="sango-briefing-row"><span>4　名簿</span><span>查看天下 ' + ALL.length + ' 武將名簿</span></div>' +
            '<div class="sango-briefing-row"><span>5　城池</span><span>查看天下 8 城形勢</span></div>' +
            '<div class="sango-briefing-row"><span>6　結束</span><span>結束本月 (AI 行動 / 翌月 AP +' + AP_RESTORE + ')</span></div>' +
            '<div class="sango-briefing-row"><span>勝　利</span><span>取得全部 8 座城池，一統天下。</span></div>' +
            '<div class="sango-briefing-row"><span>離　席</span><span>按 F1～F7 任一鍵　離開遊戲 (進度保留)</span></div>' +
          '</div>' +
        '</div>' +
        '<div class="sango-briefing-foot" data-sango-briefing-go="1">▶ ENTER 開始</div>' +
      '</div>';
  }

  function renderMain(state, el) {
    const s = state.sango;
    const playerLord = lord(s.playerLordId);
    const subState = s.subState || 'actions';

    // === map dots ===
    let dots = '';
    let cityRefs = [];
    if (subState === 'pick-develop' || subState === 'pick-recruit' ||
        subState === 'pick-search' || subState === 'pick-commerce') {
      cityRefs = eligibleCities(s, s.playerLordId, cs => cs.lord === s.playerLordId);
    } else if (subState === 'pick-attack-from') {
      cityRefs = eligibleCities(s, s.playerLordId, (cs, cd) =>
        cs.lord === s.playerLordId && cs.soldiers >= 1000 &&
        cd.adj.some(aid => s.cities[aid].lord !== s.playerLordId));
    } else if (subState === 'pick-attack-to') {
      const fromDef = cdef(s.attackFrom);
      cityRefs = fromDef ? fromDef.adj.filter(aid => s.cities[aid].lord !== s.playerLordId) : [];
    }

    const selCityId = cityRefs[s.citySel || 0];
    for (const c of CITIES_DEF) {
      const cs = s.cities[c.id];
      const lo = lord(cs.lord);
      const mine = cs.lord === s.playerLordId;
      const inSet = cityRefs.indexOf(c.id) >= 0;
      const isSel = (c.id === selCityId);
      const cls = ['sango-dot'];
      cls.push(mine ? 'is-mine' : 'is-enemy');
      if (inSet) cls.push('is-pickable');
      if (isSel) cls.push('is-sel');
      const pickAttr = inSet ? ' data-sango-city="' + c.id + '"' : '';
      dots +=
        '<div class="' + cls.join(' ') + '" style="left:' + c.pos[0] + '%;top:' + c.pos[1] + '%"' + pickAttr + ' title="' + c.name + '">' +
          '<span class="sango-dot-mark">' + lo.mark + '</span>' +
        '</div>' +
        '<div class="sango-label" style="left:' + c.pos[0] + '%;top:calc(' + c.pos[1] + '% + 7px)">' + c.name + '</div>';
    }

    // === side panels ===
    const apBar = '<div class="sango-ap"><span>行動力</span><span class="sango-ap-v">' + s.ap + ' / ' + AP_MAX + '</span></div>' +
      '<div class="sango-ap-track"><div class="sango-ap-fill" style="width:' + Math.round(s.ap / AP_MAX * 100) + '%"></div></div>';
    const status =
      '<div class="sango-aside-port" style="' + spriteStyle(playerLord.gIdx, 1/5) + '"></div>' +
      '<div class="sango-aside-name">' + playerLord.name + '</div>' +
      '<div class="sango-aside-tag">' + FACTION_FULL[playerLord.faction] + '　' + s.year + '年 ' + s.month + '月</div>' +
      apBar +
      '<div class="sango-stat-line"><span>金</span><span>' + totalGold(s, s.playerLordId) + '</span></div>' +
      '<div class="sango-stat-line"><span>米</span><span>' + totalRice(s, s.playerLordId) + '</span></div>' +
      '<div class="sango-stat-line"><span>兵</span><span>' + totalSoldiers(s, s.playerLordId) + '</span></div>' +
      '<div class="sango-stat-line"><span>將</span><span>' + totalGenerals(s, s.playerLordId) + '</span></div>' +
      '<div class="sango-stat-line"><span>城</span><span>' + ownedCount(s, s.playerLordId) + ' / ' + CITIES_DEF.length + '</span></div>';

    let menuHtml = '';
    if (subState === 'actions') {
      const cur = ACTIONS[s.actionSel || 0];
      menuHtml = '<div class="sango-side2-h">指　令</div>' +
        ACTIONS.map((a, i) =>
          '<div class="sango-act' + (i === (s.actionSel || 0) ? ' is-sel' : '') + '" data-sango-act="' + i + '">' +
            '<span class="sango-act-key">' + a.key + '</span>' +
            '<span class="sango-act-zh">' + a.zh + '</span>' +
          '</div>').join('') +
        '<div class="sango-hint">' + (cur ? cur.desc : '') + '</div>';
    } else if (subState === 'admin-menu' || subState === 'military-menu') {
      const opts = subState === 'admin-menu' ? ADMIN_OPTS : MILITARY_OPTS;
      menuHtml = '<div class="sango-side2-h">' + (subState === 'admin-menu' ? '內政' : '軍事') + '</div>' +
        opts.map((o, i) =>
          '<div class="sango-act' + (i === (s.subSel || 0) ? ' is-sel' : '') + (s.ap < o.cost ? ' is-disabled' : '') + '" data-sango-sub="' + i + '">' +
            '<span class="sango-act-key">' + o.key + '</span>' +
            '<span class="sango-act-zh">' + o.zh + '</span>' +
            '<span class="sango-act-cost">' + o.cost + '</span>' +
          '</div>').join('') +
        '<div class="sango-act-end" data-sango-cancel="1">' +
          '<span class="sango-act-key">◀</span><span class="sango-act-zh">返回</span></div>' +
        '<div class="sango-hint">' + (opts[s.subSel || 0] ? opts[s.subSel || 0].hint : '') + '</div>';
    } else if (subState === 'pick-develop' || subState === 'pick-commerce' || subState === 'pick-recruit' || subState === 'pick-search' ||
               subState === 'pick-attack-from' || subState === 'pick-attack-to') {
      const cs = selCityId ? s.cities[selCityId] : null;
      const cd = selCityId ? cdef(selCityId) : null;
      const titleMap = {
        'pick-develop':     '選擇開發城池',
        'pick-commerce':    '選擇興商城池',
        'pick-recruit':     '選擇徵兵城池',
        'pick-search':      '選擇訪賢城池',
        'pick-attack-from': '選擇出陣之城',
        'pick-attack-to':   '選擇攻擊目標'
      };
      menuHtml = '<div class="sango-side2-h">' + titleMap[subState] + '</div>';
      if (cd) {
        menuHtml += '<div class="sango-pick-info">' +
          '<div class="sango-pick-name">' + cd.name + '　屬 ' + lord(cs.lord).name + '</div>' +
          '<div class="sango-stat-line"><span>金</span><span>' + cs.gold + '</span></div>' +
          '<div class="sango-stat-line"><span>米</span><span>' + cs.rice + '</span></div>' +
          '<div class="sango-stat-line"><span>兵</span><span>' + cs.soldiers + '</span></div>' +
          '<div class="sango-stat-line"><span>民度</span><span>' + cs.develop + '</span></div>' +
          '<div class="sango-stat-line"><span>商業</span><span>' + (cs.commerce || 0) + '</span></div>' +
          '<div class="sango-stat-line"><span>將</span><span>' + cs.gens.length + '</span></div>' +
          '</div>';
      } else {
        menuHtml += '<div class="sango-pick-info">無可選城池</div>';
      }
      menuHtml += '<div class="sango-act-end" data-sango-cancel="1">' +
        '<span class="sango-act-key">◀</span><span class="sango-act-zh">取消</span></div>' +
        '<div class="sango-hint">← → 選擇　ENTER 確定</div>';
    } else if (subState === 'result') {
      const r = s.lastResult || { title: '', lines: [] };
      const lines = (r.lines || []).map(l => '<div class="sango-result-line">' + l + '</div>').join('');
      menuHtml =
        '<div class="sango-side2-h">' + (r.success === false ? '×' : '★') + '　' + r.title + '</div>' +
        '<div class="sango-result-box">' + lines + '</div>' +
        '<div class="sango-act-end is-sel" data-sango-result-ok="1">' +
          '<span class="sango-act-key">▶</span><span class="sango-act-zh">確認</span>' +
        '</div>' +
        '<div class="sango-hint">ENTER 繼續</div>';
    } else if (subState === 'gameover') {
      menuHtml = '<div class="sango-side2-h">' + (s.result === 'win' ? '統一天下' : '勢力盡失') + '</div>' +
        '<div class="sango-pick-info">' +
          (s.result === 'win'
            ? '恭喜！　' + playerLord.name + ' 統一天下，建立大業。'
            : '勢力盡失，江山易主。')
        + '</div>' +
        '<div class="sango-act-end" data-sango-restart="1">' +
          '<span class="sango-act-key">▶</span><span class="sango-act-zh">重　啟</span></div>';
    }

    const logHtml = (s.log || []).map(l => '<div class="sango-log-line">' + l + '</div>').join('');

    el.innerHTML =
      '<div class="sango-screen sango-main">' +
        '<div class="sango-map" style="background-image:url(\'' + ART.map + '\')">' + dots + '</div>' +
        '<div class="sango-aside">' + status + '</div>' +
        '<div class="sango-side2">' + menuHtml + '<div class="sango-log">' + logHtml + '</div></div>' +
      '</div>' +
      '<div class="sango-fbar">' +
        '<span>1-6　選令</span><span>↑ ↓　移動</span>' +
        '<span>ENTER　確定</span><span>◀　取消／返回</span>' +
      '</div>';
  }

  function renderCharacters(state, el) {
    const sel = state.sango.selected;
    let cells = '';
    for (let i = 0; i < G.length; i++) {
      cells +=
        '<div class="sango-cell' + (i === sel ? ' is-sel' : '') + '" data-sango-pick="' + i + '">' +
          '<div class="sango-portrait" style="' + spriteStyle(i, 1/6) + '"></div>' +
          '<div class="sango-cell-name">' + G[i].name + '</div>' +
        '</div>';
    }
    const cur = G[sel];
    el.innerHTML =
      '<div class="sango-screen sango-grid">' +
        '<div class="sango-grid-wrap">' + cells + '</div>' +
        '<div class="sango-grid-foot">' +
          '<span>' + cur.name + '　字 ' + (cur.zi || '－') + '</span>' +
          '<span>' + FACTION_FULL[cur.faction] + '</span>' +
          '<span>' + (sel + 1) + ' / ' + G.length + '</span>' +
          '<span>▶ ENTER 詳情　← → 選擇　◀ 返回</span>' +
        '</div>' +
      '</div>';
  }

  function renderDetail(state, el) {
    const g = G[state.sango.selected];
    function bar(label, v) {
      const filled = Math.round(Math.max(0, Math.min(100, v)) / 5);
      const bars = '■'.repeat(filled) + '·'.repeat(20 - filled);
      return '<div class="sango-stat-row">' +
        '<span class="sango-stat-l">' + label + '</span>' +
        '<span class="sango-stat-bar">' + bars + '</span>' +
        '<span class="sango-stat-v">' + v + '</span>' +
      '</div>';
    }
    el.innerHTML =
      '<div class="sango-screen sango-detail">' +
        '<div class="sango-portrait sango-portrait-lg" style="' + spriteStyle(state.sango.selected, 0.4) + '"></div>' +
        '<div class="sango-detail-info">' +
          '<div class="sango-detail-name">' + g.name + (g.zi ? '　字 ' + g.zi : '') + '</div>' +
          '<div class="sango-detail-faction">所属  ' + FACTION_FULL[g.faction] + '</div>' +
          bar('戰力', g.war) + bar('體力', g.hp) + bar('謀略', g.iq) + bar('魅力', g.chr) +
          '<div class="sango-detail-hint">← → 上下　切換武將　　◀ 返回</div>' +
        '</div>' +
      '</div>';
  }

  function renderCityList(state, el) {
    const s = state.sango;
    const sel = s.citySel || 0;
    const rows = CITIES_DEF.map((c, i) => {
      const cs = s.cities[c.id];
      const lo = lord(cs.lord);
      const mine = cs.lord === s.playerLordId;
      return '<div class="sango-city-row' + (i === sel ? ' is-sel' : '') + (mine ? ' is-mine' : '') + '">' +
        '<span class="sango-city-mark">' + lo.mark + '</span>' +
        '<span class="sango-city-name">' + c.name + '</span>' +
        '<span class="sango-city-cell">屬 ' + lo.name + '</span>' +
        '<span class="sango-city-cell">金 ' + cs.gold + '</span>' +
        '<span class="sango-city-cell">米 ' + cs.rice + '</span>' +
        '<span class="sango-city-cell">兵 ' + cs.soldiers + '</span>' +
        '<span class="sango-city-cell">民度 ' + cs.develop + '</span>' +
        '<span class="sango-city-cell">商 ' + (cs.commerce || 0) + '</span>' +
        '<span class="sango-city-cell">將 ' + cs.gens.length + '</span>' +
        '</div>';
    }).join('');
    el.innerHTML =
      '<div class="sango-screen sango-cities">' +
        '<div class="sango-cities-h">城　池　一　覽　　' + s.year + '年 ' + s.month + '月</div>' +
        '<div class="sango-cities-list">' + rows + '</div>' +
        '<div class="sango-cities-foot">↑↓ 選擇　◀ 返回</div>' +
      '</div>';
  }

  function renderRoster(state, el) {
    const s = state.sango;
    const employed = new Map();   // gen idx → owner lord id
    for (const cd of CITIES_DEF) {
      for (const gi of s.cities[cd.id].gens) employed.set(gi, s.cities[cd.id].lord);
    }
    const FAC_ORDER = { shu: 0, wei: 1, wu: 2, qun: 3 };
    const all = ALL.map((g, i) => ({
      idx: i, name: g.name, zi: g.zi || '', faction: g.faction,
      war: g.war, hp: g.hp, iq: g.iq, chr: g.chr,
      owner: employed.has(i) ? employed.get(i) : null
    }));
    all.sort((a, b) => {
      const ap = (a.owner === s.playerLordId ? 0 : a.owner ? 1 : 2);
      const bp = (b.owner === s.playerLordId ? 0 : b.owner ? 1 : 2);
      if (ap !== bp) return ap - bp;
      const fa = FAC_ORDER[a.faction], fb = FAC_ORDER[b.faction];
      if (fa !== fb) return fa - fb;
      return a.idx - b.idx;
    });
    const PER = 14;
    const numPages = Math.max(1, Math.ceil(all.length / PER));
    const page = Math.min(numPages - 1, Math.max(0, s.rosterPage || 0));
    const slice = all.slice(page * PER, page * PER + PER);
    const rows = slice.map(it => {
      const ownerName = it.owner ? lord(it.owner).name : '在野';
      const isMine = it.owner === s.playerLordId;
      return '<div class="sango-roster-row' + (isMine ? ' is-mine' : '') + (!it.owner ? ' is-free' : '') + '">' +
        '<span class="sango-roster-name">' + it.name + '</span>' +
        '<span class="sango-roster-zi">' + (it.zi || '－') + '</span>' +
        '<span class="sango-roster-fac">' + FACTION_FULL[it.faction] + '</span>' +
        '<span class="sango-roster-stat">武' + it.war + '</span>' +
        '<span class="sango-roster-stat">勇' + it.hp + '</span>' +
        '<span class="sango-roster-stat">智' + it.iq + '</span>' +
        '<span class="sango-roster-stat">魅' + it.chr + '</span>' +
        '<span class="sango-roster-owner">' + ownerName + '</span>' +
      '</div>';
    }).join('');
    el.innerHTML =
      '<div class="sango-screen sango-roster">' +
        '<div class="sango-roster-h">名　簿　　全 ' + ALL.length + ' 武將　頁 ' + (page + 1) + '/' + numPages + '</div>' +
        '<div class="sango-roster-list">' + rows + '</div>' +
        '<div class="sango-roster-foot">← → 翻頁　◀ 返回</div>' +
      '</div>';
  }

  /* =========================================================
   *  Key handling
   * ========================================================= */

  function onKey(state, action) {
    init(state);
    const v = state.sango.view;
    const N = G.length;
    const s = state.sango;

    if (v === 'title') {
      if (action === 'enter') { s.view = 'lord-pick'; return true; }
      return false;
    }

    if (v === 'lord-pick') {
      const M = LORDS.filter(l => l.playable).length;
      if (action === 'right' || action === 'down') { s.pickSel = ((s.pickSel || 0) + 1) % M; return true; }
      if (action === 'left'  || action === 'up')   { s.pickSel = ((s.pickSel || 0) - 1 + M) % M; return true; }
      if (action === 'enter') { startGame(state, s.pickSel || 0); return true; }
      if (action === 'back')  { s.view = 'title'; return true; }
      return false;
    }

    if (v === 'briefing') {
      if (action === 'enter') { s.view = 'main'; s.subState = 'actions'; return true; }
      if (action === 'back')  return true;
      return false;
    }

    if (v === 'main') return mainKey(s, action);

    if (v === 'characters') {
      if (action === 'right' || action === 'down') { s.selected = (s.selected + 1) % N; return true; }
      if (action === 'left'  || action === 'up')   { s.selected = (s.selected - 1 + N) % N; return true; }
      if (action === 'enter') { s.view = 'character-detail'; return true; }
      if (action === 'back')  { s.view = 'main'; return true; }
      return false;
    }

    if (v === 'character-detail') {
      if (action === 'right' || action === 'down') { s.selected = (s.selected + 1) % N; return true; }
      if (action === 'left'  || action === 'up')   { s.selected = (s.selected - 1 + N) % N; return true; }
      if (action === 'back' || action === 'enter') { s.view = 'characters'; return true; }
      return false;
    }

    if (v === 'cities') {
      const C = CITIES_DEF.length;
      if (action === 'down') { s.citySel = ((s.citySel || 0) + 1) % C; return true; }
      if (action === 'up')   { s.citySel = ((s.citySel || 0) - 1 + C) % C; return true; }
      if (action === 'back' || action === 'enter') { s.view = 'main'; s.citySel = 0; return true; }
      return false;
    }

    if (v === 'roster') {
      const numPages = Math.max(1, Math.ceil(ALL.length / 14));
      if (action === 'right' || action === 'down') { s.rosterPage = ((s.rosterPage || 0) + 1) % numPages; return true; }
      if (action === 'left'  || action === 'up')   { s.rosterPage = ((s.rosterPage || 0) - 1 + numPages) % numPages; return true; }
      if (action === 'back' || action === 'enter') { s.view = 'main'; return true; }
      return false;
    }

    return false;
  }

  function eligibleForState(s, subState) {
    if (subState === 'pick-develop' || subState === 'pick-commerce' ||
        subState === 'pick-recruit' || subState === 'pick-search') {
      return eligibleCities(s, s.playerLordId, cs => cs.lord === s.playerLordId);
    }
    if (subState === 'pick-attack-from') {
      return eligibleCities(s, s.playerLordId, (cs, cd) =>
        cs.lord === s.playerLordId && cs.soldiers >= 1000 &&
        cd.adj.some(aid => s.cities[aid].lord !== s.playerLordId));
    }
    if (subState === 'pick-attack-to') {
      const fromDef = cdef(s.attackFrom);
      return fromDef ? fromDef.adj.filter(aid => s.cities[aid].lord !== s.playerLordId) : [];
    }
    return [];
  }

  function mainKey(s, action) {
    const sub = s.subState || 'actions';

    if (sub === 'gameover') {
      if (action === 'enter' || action === 'back') {
        s.view = 'lord-pick';
        s.subState = 'actions';
        s.result = null;
        return true;
      }
      return false;
    }

    if (sub === 'actions') {
      const N = ACTIONS.length;
      if (action === 'down') { s.actionSel = ((s.actionSel || 0) + 1) % N; return true; }
      if (action === 'up')   { s.actionSel = ((s.actionSel || 0) - 1 + N) % N; return true; }
      if (action === 'enter') {
        const a = ACTIONS[s.actionSel || 0];
        if (a.sub) { s.subState = a.sub; s.subSel = 0; return true; }
        if (a.view) { s.view = a.view; s.selected = 0; s.citySel = 0; s.rosterPage = 0; return true; }
        if (a.endTurn) { s.log.unshift(s.year + '年 ' + s.month + '月 結束'); advanceMonth(s); return true; }
      }
      if (action === 'back') return true;   // F-keys exit, BACK is no-op
      return false;
    }

    if (sub === 'admin-menu' || sub === 'military-menu') {
      const opts = sub === 'admin-menu' ? ADMIN_OPTS : MILITARY_OPTS;
      if (action === 'down') { s.subSel = ((s.subSel || 0) + 1) % opts.length; return true; }
      if (action === 'up')   { s.subSel = ((s.subSel || 0) - 1 + opts.length) % opts.length; return true; }
      if (action === 'enter') {
        const o = opts[s.subSel || 0];
        if (!o) return true;
        if (s.ap < o.cost) { logFail(s, '行動力不足，需 ' + o.cost + ' AP，現 ' + s.ap); return true; }
        s.subState = o.sub;
        s.citySel = 0;
        return true;
      }
      if (action === 'back') { s.subState = 'actions'; return true; }
      return false;
    }

    if (sub === 'pick-develop' || sub === 'pick-commerce' || sub === 'pick-recruit' || sub === 'pick-search' ||
        sub === 'pick-attack-from' || sub === 'pick-attack-to') {
      const list = eligibleForState(s, sub);
      const N = list.length;
      if (N === 0 && action === 'back') { s.subState = 'actions'; return true; }
      if (action === 'right' || action === 'down') { s.citySel = ((s.citySel || 0) + 1) % N; return true; }
      if (action === 'left'  || action === 'up')   { s.citySel = ((s.citySel || 0) - 1 + N) % N; return true; }
      if (action === 'enter' && N) {
        const cityId = list[s.citySel || 0];
        // Each do* on success calls setResult which switches subState to 'result'.
        // On failure (false return), stay in pick state to let user retry/cancel.
        if (sub === 'pick-develop')      doDevelop(s, cityId);
        else if (sub === 'pick-commerce') doCommerce(s, cityId);
        else if (sub === 'pick-recruit') doRecruit(s, cityId);
        else if (sub === 'pick-search')  doSearch(s, cityId);
        else if (sub === 'pick-attack-from') { s.attackFrom = cityId; s.subState = 'pick-attack-to'; s.citySel = 0; return true; }
        else if (sub === 'pick-attack-to')   { doAttack(s, s.attackFrom, cityId); s.attackFrom = null; }
        s.citySel = 0;
        return true;
      }
      if (action === 'back') {
        if (sub === 'pick-attack-to') { s.subState = 'pick-attack-from'; s.citySel = 0; return true; }
        s.subState = (sub === 'pick-attack-from') ? 'military-menu' : 'admin-menu';
        return true;
      }
      return false;
    }

    if (sub === 'result') {
      if (action === 'enter' || action === 'back') {
        s.subState = 'actions';
        s.lastResult = null;
        return true;
      }
      return false;
    }

    return false;
  }

  // 1-9 digit shortcut on the main screen. If the digit doesn't match the
  // current sub-menu, treat it as a top-level command shortcut — saves the
  // user a BACK press when they decide to end the turn from a sub-menu.
  function digit(state, n) {
    init(state);
    if (state.sango.view !== 'main') return false;
    const s = state.sango, sub = s.subState || 'actions';
    const i = n - 1;
    if (sub === 'admin-menu' || sub === 'military-menu') {
      const opts = sub === 'admin-menu' ? ADMIN_OPTS : MILITARY_OPTS;
      if (i >= 0 && i < opts.length) { s.subSel = i; return mainKey(s, 'enter'); }
      // bubble up
      if (i >= 0 && i < ACTIONS.length) {
        s.subState = 'actions';
        s.actionSel = i;
        return mainKey(s, 'enter');
      }
      return false;
    }
    if (sub === 'actions') {
      if (i >= 0 && i < ACTIONS.length) { s.actionSel = i; return mainKey(s, 'enter'); }
    }
    return false;
  }

  function pick(state, idx)       { init(state); state.sango.selected = idx; state.sango.view = 'character-detail'; }
  function pickLord(state, idx)   { init(state); startGame(state, idx); }
  function pickAction(state, key) { init(state); if (state.sango.view === 'main' && state.sango.subState === 'actions') { state.sango.actionSel = +key; mainKey(state.sango, 'enter'); } }
  function pickSub(state, key)    { init(state); state.sango.subSel = +key; mainKey(state.sango, 'enter'); }
  function pickCity(state, cityId) {
    init(state);
    const s = state.sango;
    const list = eligibleForState(s, s.subState);
    const idx = list.indexOf(cityId);
    if (idx >= 0) { s.citySel = idx; mainKey(s, 'enter'); }
  }
  function cancel(state)  { init(state); mainKey(state.sango, 'back'); }
  function restart(state) { init(state); state.sango.view = 'lord-pick'; state.sango.subState = 'actions'; state.sango.result = null; }

  window.SANGO = {
    GENERALS: G, EXTRA, ALL, LORDS, CITIES_DEF, ACTIONS, ADMIN_OPTS, MILITARY_OPTS, ART, FACTION_FULL,
    AP_MAX, AP_RESTORE, AP_COST,
    init, render, onKey, digit,
    pick, pickLord, pickAction, pickSub, pickCity, cancel, restart,
    spriteStyle
  };
})();
