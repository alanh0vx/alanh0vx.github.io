'use strict';

/**
 * Thunder Downs — i18n: English + Traditional Chinese (Hong Kong).
 * zh-HK uses HKJC-style racing terminology (獨贏 / 位置 / 連贏 / 二重彩,
 * 排位表, 場地 快地…大爛地, 相片裁決, 鼻位/頭位/頸位/馬位…).
 * Loaded before the other modules; they read strings via I18N.t()/I18N.d().
 */
const I18N = (() => {
  const KEY = 'horseRacing_lang';

  // ------------------------------------------------------------ UI strings
  const STR = {
    en: {
      'doc.title': '🏇 Thunder Downs — Horse Racing',
      'brand.html': '🏇 <b>THUNDER</b> DOWNS',
      'board.brand': 'THUNDER DOWNS',
      'board.race': 'R{no} • {name} • {dist}m • {going}',

      'wallet.balance': 'Balance',
      'wallet.pl': 'Career P/L',
      'title.sound': 'Toggle sound',
      'title.close': 'Leave the track',
      'title.lang': '切換至中文',
      'lang.btn': '中',

      'bailout.text': 'You’re down to your last few dollars… a track sponsor offers a helping hand.',
      'bailout.btn': 'Accept $500 sponsorship',

      'btn.newRace': '↻ New Race',
      'title.newRace': 'Draw a fresh field',
      'race.title': 'Race {no} — {name}',
      'chip.going': 'Going: {going}',
      'chip.dist': '{d}m {cat}',
      'tier.runners': '{n} runners',

      'card.title': '📋 Race Card',
      'card.hint': 'tap a runner for form & betting',
      'slip.title': '🎫 Bet Slip',
      'exotic.title': 'Exotics',
      'exotic.exacta': 'Exacta (1st → 2nd exact)',
      'exotic.quinella': 'Quinella (top 2, any order)',
      'exotic.add': 'Add',
      'btn.reset': 'Reset progress',
      'btn.start': 'Start Race',
      'btn.start.staked': 'Start Race — ${x} staked',
      'btn.start.spectate': 'Start Race (spectate)',
      'results.next': 'Next Race →',
      'pf.label': '📸 PHOTO FINISH',
      'commentary.welcome': 'Welcome to Thunder Downs.',

      'howto.title': '❓ How to play',
      'howto.1': '<b>Read the card.</b> Tap a runner to see speed, stamina, acceleration and consistency, plus its preferred distance, going and weather. Green ✓ badges mean today’s conditions suit it.',
      'howto.2': '<b>Find value.</b> Odds are set by the bookmaker with a margin. A horse whose preferences all line up may be better than its price.',
      'howto.3': '<b>Bet.</b> Win pays if your horse is 1st; Place covers 1st–2nd; Show covers 1st–3rd. In higher classes, Exacta &amp; Quinella pay big for predicting the top two.',
      'howto.4': '<b>Watch the race.</b> Front-runners burn early, closers finish fast — stamina decides the home straight. Rain slows the track; wide runs cost ground in the turns.',
      'howto.5': '<b>Climb the classes.</b> Grow your bank to unlock the Handicap, the Cup and the Championship with bigger fields and bigger limits.',

      'history.title': '📜 Recent Races',
      'history.empty': 'No races yet.',
      'history.race': 'R{no} {tier} • {d}m',
      'career.stats': '{a} races bet • {b}/{c} bets won • biggest win +${d}',

      'form.W': 'Win', 'form.P': 'Place', 'form.S': 'Show', 'form.L': 'Unplaced',
      'badge.going': 'going ✓', 'badge.weather': 'weather ✓', 'badge.dist': 'distance ✓',
      'stat.spd': 'SPD', 'stat.sta': 'STA', 'stat.acc': 'ACC', 'stat.con': 'CON',
      'rc.sub': '{jockey} • {style} • {age}yo {breed} • {coat}',
      'rc.prefs': 'Prefers: <b>{dist}</b> trips • <b>{going}</b> going • <b>{weather}</b> weather • {n} career starts',
      'btn.addBet': 'Add bet',

      'bet.win': 'Win', 'bet.place': 'Place', 'bet.show': 'Show',
      'bet.exacta': 'Exacta', 'bet.quinella': 'Quinella',

      'slip.empty': 'No bets yet.<br>Tap a horse on the race card to bet — or start the race to just watch.',
      'slip.totalStake': 'Total stake',
      'slip.maxReturn': 'Max return',
      'mobile.bet1': '1 bet • ${s}',
      'mobile.betsN': '{n} bets • ${s}',
      'mobile.maxReturn': 'max return ${x}',
      'mobile.none': 'No bets yet',
      'mobile.tap': 'tap a runner to bet',
      'mobile.start': 'Start • ${x}',
      'mobile.spectate': 'Spectate',

      'toast.min': 'Minimum bet is $10.',
      'toast.maxBet': 'Max bet in this race class is ${x}.',
      'toast.balance': 'Not enough balance for that stake.',
      'toast.twoHorses': 'Pick two different horses.',

      'aria.stake': 'Stake',
      'aria.removeBet': 'Remove bet',
      'aria.exoticType': 'Exotic bet type',
      'aria.firstHorse': 'First horse',
      'aria.secondHorse': 'Second horse',
      'aria.exoticStake': 'Exotic stake',
      'aria.raceClass': 'Race class',

      'comment.newRace': '{name} — {dist}m, going {going}. Study the card and place your bets.',
      'comment.gate': '🎺 The horses are at the gate…',
      'comment.offClean': 'And they’re off! A clean start for the field.',
      'comment.offSlow': 'And they’re off! But {horses} missed the break!',
      'word.and': ' and ',
      'comment.leader': [
        '#{n} {name} strides to the front!',
        '{name} takes over at the head of affairs!',
        'Now it’s #{n} {name} showing the way!',
      ],
      'comment.half2': 'Halfway home — {a} leads from {b}.',
      'comment.half3': 'Halfway home — {a} leads from {b} and {c}.',
      'comment.straight': 'They swing into the home straight — here comes the run to the line!',
      'comment.win': '🏆 #{n} {name} WINS the {race}!',
      'comment.second': '#{n} {name} takes second.',
      'comment.third': '#{n} {name} takes third.',
      'comment.photo': '📸 PHOTO FINISH! The judges are examining the print…',
      'comment.sponsor': 'A generous sponsor tops up your account with $500. Spend it wisely!',
      'call.clear': [
        '{a} has kicked {gap} lengths clear!',
        'Daylight second — {a} is running away with it!',
      ],
      'call.close': [
        'Nothing between {a} and {b}!',
        '{b} is right on the leader’s heels!',
      ],
      'call.mid': [
        '{a} from {b}, then {c}.',
        '{a} dictates ahead of {b}.',
      ],
      'call.pack': 'the pack',

      'clock': '⏱ {t}s  •  {m}m to go',
      'results.title': '🏁 Race Result',
      'results.title.photo': '📸 Photo Finish — Result',
      'results.by': 'by {m}',
      'results.nobets': 'You watched this one from the rail — no bets placed.',
      'results.net': 'Net: {v}',
      'confirm.reset': 'Reset all progress? Balance returns to $1,000 and history is cleared.',
    },

    zh: {
      'doc.title': '🏇 雷霆馬場 — 賽馬遊戲',
      'brand.html': '🏇 <b>雷霆</b>馬場',
      'board.brand': '雷霆馬場',
      'board.race': '第{no}場 • {name} • {dist}米 • {going}',

      'wallet.balance': '結餘',
      'wallet.pl': '累計盈虧',
      'title.sound': '開關音效',
      'title.close': '離開馬場',
      'title.lang': 'Switch to English',
      'lang.btn': 'EN',

      'bailout.text': '你的資金所剩無幾……馬場贊助商願意伸出援手。',
      'bailout.btn': '接受 $500 贊助',

      'btn.newRace': '↻ 新賽事',
      'title.newRace': '重新排位，抽出新一批賽駒',
      'race.title': '第 {no} 場 — {name}',
      'chip.going': '場地：{going}',
      'chip.dist': '{d}米 {cat}',
      'tier.runners': '{n} 匹出賽',

      'card.title': '📋 排位表',
      'card.hint': '點選馬匹查看往績及投注',
      'slip.title': '🎫 投注彩票',
      'exotic.title': '特別投注',
      'exotic.exacta': '二重彩（順序頭二名）',
      'exotic.quinella': '連贏（頭二名，不論次序）',
      'exotic.add': '加入',
      'btn.reset': '重設進度',
      'btn.start': '開賽',
      'btn.start.staked': '開賽 — 已投注 ${x}',
      'btn.start.spectate': '開賽（觀戰）',
      'results.next': '下一場 →',
      'pf.label': '📸 相片裁決',
      'commentary.welcome': '歡迎蒞臨雷霆馬場。',

      'howto.title': '❓ 玩法說明',
      'howto.1': '<b>細閱排位表。</b>點選馬匹查看速度、耐力、加速及穩定性，以及牠偏好的途程、場地與天氣。綠色 ✓ 徽章代表今日條件適合該駒。',
      'howto.2': '<b>尋找價值。</b>賠率由莊家開出並附有佣金。若一匹馬的各項偏好完全脗合，實力可能勝於賠率所示。',
      'howto.3': '<b>投注。</b>獨贏：所選馬匹跑第一；位置(頭2)：跑入首兩名；位置(頭3)：跑入首三名。高班賽事更設二重彩及連贏，猜中頭兩名派彩豐厚。',
      'howto.4': '<b>欣賞賽事。</b>前領馬早段消耗大，後上馬末段發力 — 直路上鬥的是耐力。落雨場地變慢，彎位走外疊會蝕位。',
      'howto.5': '<b>逐級升班。</b>增加資金，解鎖讓賽、金盃以至錦標賽 — 出賽馬匹更多，注額上限更高。',

      'history.title': '📜 近期賽事',
      'history.empty': '未有賽事紀錄。',
      'history.race': '第{no}場 {tier} • {d}米',
      'career.stats': '投注 {a} 場 • {b}/{c} 注獲勝 • 最大贏額 +${d}',

      'form.W': '冠軍', 'form.P': '亞軍', 'form.S': '季軍', 'form.L': '不入位',
      'badge.going': '場地 ✓', 'badge.weather': '天氣 ✓', 'badge.dist': '途程 ✓',
      'stat.spd': '速度', 'stat.sta': '耐力', 'stat.acc': '加速', 'stat.con': '穩定',
      'rc.sub': '{jockey} • {style} • {age}歲 • {breed} • {coat}',
      'rc.prefs': '偏好：<b>{dist}</b>途程 • <b>{going}</b>場地 • <b>{weather}</b>天氣 • 出賽 {n} 次',
      'btn.addBet': '加入注項',

      'bet.win': '獨贏', 'bet.place': '位置(頭2)', 'bet.show': '位置(頭3)',
      'bet.exacta': '二重彩', 'bet.quinella': '連贏',

      'slip.empty': '尚未投注。<br>在排位表點選馬匹落注 — 或直接開賽觀戰。',
      'slip.totalStake': '總注碼',
      'slip.maxReturn': '最高派彩',
      'mobile.bet1': '1 注 • ${s}',
      'mobile.betsN': '{n} 注 • ${s}',
      'mobile.maxReturn': '最高派彩 ${x}',
      'mobile.none': '尚未投注',
      'mobile.tap': '點選馬匹落注',
      'mobile.start': '開賽 • ${x}',
      'mobile.spectate': '觀戰',

      'toast.min': '最低投注額為 $10。',
      'toast.maxBet': '此班次每注上限為 ${x}。',
      'toast.balance': '結餘不足，注碼太大。',
      'toast.twoHorses': '請選擇兩匹不同的馬。',

      'aria.stake': '注碼',
      'aria.removeBet': '移除注項',
      'aria.exoticType': '特別投注種類',
      'aria.firstHorse': '第一匹馬',
      'aria.secondHorse': '第二匹馬',
      'aria.exoticStake': '注碼',
      'aria.raceClass': '賽事班次',

      'comment.newRace': '{name} — {dist}米，場地{going}。請細閱排位表，然後投注。',
      'comment.gate': '🎺 馬匹進閘中……',
      'comment.offClean': '閘門大開！全場起步良好。',
      'comment.offSlow': '閘門大開！但{horses}慢閘失地！',
      'word.and': '和',
      'comment.leader': [
        '#{n} {name} 搶先帶出！',
        '{name} 越眾而出，帶領馬群！',
        '現在由 #{n} {name} 帶頭！',
      ],
      'comment.half2': '賽事過半 — {a} 帶先，{b} 居次。',
      'comment.half3': '賽事過半 — {a} 帶先，{b} 居次，{c} 排第三。',
      'comment.straight': '轉入直路！最後衝刺開始！',
      'comment.win': '🏆 #{n} {name} 勝出{race}！',
      'comment.second': '#{n} {name} 跑獲亞軍。',
      'comment.third': '#{n} {name} 跑獲季軍。',
      'comment.photo': '📸 相片裁決！裁判正在研究終點照片……',
      'comment.sponsor': '贊助商注資 $500 到你的戶口，請善用！',
      'call.clear': [
        '{a} 拋離對手 {gap} 個馬位！',
        '{a} 一騎絕塵，遙遙領先！',
      ],
      'call.close': [
        '{a} 與 {b} 鬥得難分難解！',
        '{b} 緊咬領先馬不放！',
      ],
      'call.mid': [
        '{a} 領先，{b} 居次，{c} 緊隨其後。',
        '{a} 控制步速，力壓 {b}。',
      ],
      'call.pack': '大隊',

      'clock': '⏱ {t}秒 • 尚餘 {m} 米',
      'results.title': '🏁 賽果',
      'results.title.photo': '📸 相片裁決 — 賽果',
      'results.by': '負 {m}',
      'results.nobets': '你在場邊觀戰 — 沒有投注。',
      'results.net': '淨結果：{v}',
      'confirm.reset': '確定重設所有進度？結餘將回復 $1,000，紀錄將被清除。',
    },
  };

  // ------------------------------------------------------------ engine-data names
  // Keyed by the English names the engine uses internally.
  const DATA = {
    en: {
      dist: { sprint: 'Sprint', mile: 'Mile', staying: 'Staying' },
      style: { front: 'Front-runner', stalker: 'Stalker', closer: 'Closer' },
    },
    zh: {
      going: { Firm: '快地', Good: '好地', Yielding: '黏地', Soft: '軟地', Heavy: '大爛地' },
      weather: {
        Sunny: '天晴', Cloudy: '多雲', Overcast: '密雲',
        'Light Rain': '微雨', 'Heavy Rain': '大雨', Windy: '大風',
      },
      dist: { sprint: '短途', mile: '一哩', staying: '長途' },
      style: { front: '前領', stalker: '跟前', closer: '後上' },
      breed: {
        Thoroughbred: '純種馬', Arabian: '阿拉伯馬', 'Quarter Horse': '夸特馬',
        Standardbred: '標準馬', 'Akhal-Teke': '汗血寶馬', 'Anglo-Arab': '英阿混血馬',
      },
      coat: {
        Bay: '棗色', 'Dark Bay': '深棗色', Chestnut: '栗色', Black: '黑色',
        Grey: '灰色', Palomino: '金黃色', Roan: '沙毛色', White: '白色',
      },
      tierShort: { Maiden: '新馬', Handicap: '讓賽', Cup: '盃賽', Championship: '錦標' },
      tierName: {
        'Maiden Stakes': '新馬賽', 'Metro Handicap': '都會讓賽',
        'Golden Cup': '金盃', 'Thunder Downs Championship': '雷霆馬場錦標',
      },
    },
  };

  // HKJC-style Chinese horse names (max 4 characters, like real HK racehorses).
  const HORSES_ZH = {
    'Thunder Bolt': '雷霆一擊', 'Lightning Strike': '電光火石', 'Storm Chaser': '追風逐電',
    'Wind Runner': '御風而行', 'Fire Dancer': '火舞飛揚', 'Shadow Walker': '暗影行者',
    'Golden Arrow': '黃金神箭', 'Silver Bullet': '銀彈出擊', 'Midnight Express': '午夜快車',
    'Dawn Breaker': '破曉晨光', 'Royal Crown': '皇者之冠', 'Diamond Dust': '鑽石星塵',
    'Crimson Flash': '赤焰閃電', 'Emerald Dream': '翡翠美夢', 'Sapphire Star': '藍寶明星',
    'Iron Duke': '鐵血公爵', 'Velvet Rocket': '絲絨火箭', 'Northern Gale': '北地狂風',
    'Desert Mirage': '沙漠幻影', 'Lucky Charm': '福星高照', 'Bold Venture': '大膽進取',
    'Sea Biscuit Jr': '海餅少爺', 'Copper Canyon': '銅峽谷', 'Wild Symphony': '狂野樂章',
    'Night Fury': '暗夜怒火', 'Amber Waves': '琥珀金浪', 'Steel Resolve': '鋼鐵意志',
    'Phantom Rider': '幻影騎士', 'Sunset Blaze': '落日烈焰', 'Frost Giant': '冰霜巨人',
    'Merry Monarch': '快活君王', 'Quick Silver': '水銀瀉地', 'Blazing Saddle': '烈焰金鞍',
    'Ocean Drift': '滄海逐流', 'Star Admiral': '星際上將', 'Rebel Heart': '叛逆之心',
    'Winter Rose': '寒冬玫瑰', 'Jade Emperor': '玉皇大帝', 'Comet Tail': '彗星襲月',
    'Brave Companion': '勇敢良朋', 'High Voltage': '電力十足', 'Paper Moon': '紙月亮',
    'Turbo Legacy': '極速傳承', 'Grand Slam': '大滿貫', 'Neon Knight': '霓虹騎士',
  };

  // HK-press-style jockey transliterations.
  const JOCKEYS_ZH = {
    'J. Santos': '山度士', 'M. Rodriguez': '羅理雅', 'K. Nakamura': '中村',
    'A. Williams': '韋廉士', 'C. Beaumont': '布文', 'D. O’Leary': '奧利里',
    'R. Garcia': '加西亞', 'L. Chen': '陳霖', 'S. Dubois': '杜比斯',
    'T. Wilson': '韋遜', 'B. Andersson': '安達臣', 'N. Taylor': '泰萊',
    'F. Rossi': '羅西', 'G. Jackson': '積遜', 'H. Whitfield': '韋菲德',
    'P. Novak': '諾域克',
  };

  const RACES_ZH = {
    'Maiden Stakes': '新馬賽', 'Debutante Plate': '新星碟賽',
    'Newcomers Trial': '新秀試閘', 'First Light Maiden': '晨曦新馬賽',
    'Metro Handicap': '都會讓賽', 'City Mile Handicap': '城市一哩讓賽',
    'Harbour Sprint Trophy': '海港短途盃', 'Riverside Handicap': '河畔讓賽',
    'Golden Cup': '金盃', 'Autumn Classic': '秋季經典賽',
    'Governor’s Plate': '督憲盃', 'Sunset Gold Cup': '落日金盃',
    'Thunder Downs Championship': '雷霆馬場錦標', 'Grand International': '國際大賽',
    'Champions Crown': '冠軍榮冠', 'The Thunder Invitational': '雷霆邀請賽',
  };

  // HKJC official winning-margin terms.
  const MARGIN_ZH = {
    nose: '鼻位', 'short head': '短頭位', head: '頭位', neck: '頸位',
    '¾ length': '¾馬位', '1 length': '1馬位', distance: '大距離',
  };

  // ------------------------------------------------------------ core
  let lang;
  try {
    lang = localStorage.getItem(KEY);
  } catch (e) { /* private mode */ }
  if (lang !== 'en' && lang !== 'zh') {
    lang = /^zh/i.test(navigator.language || '') ? 'zh' : 'en';
  }

  const interp = (s, vars) =>
    vars ? s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m)) : s;

  function t(key, vars) {
    const s = STR[lang][key] !== undefined ? STR[lang][key] : STR.en[key];
    return typeof s === 'string' ? interp(s, vars) : (s === undefined ? key : s);
  }

  /** Pick a random line from a string-array key and interpolate. */
  function pickLine(key, vars) {
    const arr = STR[lang][key] || STR.en[key];
    return interp(arr[Math.floor(Math.random() * arr.length)], vars);
  }

  /** Localized display name for engine data (going, weather, dist, style, breed, coat, tierShort, tierName). */
  function d(group, key) {
    const g = DATA[lang] && DATA[lang][group];
    return (g && g[key]) || key;
  }

  const horse = (name) => (lang === 'zh' && HORSES_ZH[name]) || name;
  const jockey = (name) => (lang === 'zh' && JOCKEYS_ZH[name]) || name;
  const race = (name) => (lang === 'zh' && RACES_ZH[name]) || name;

  /** Localize an Engine.marginLabel() result. */
  function margin(label) {
    if (lang !== 'zh') return label;
    if (MARGIN_ZH[label]) return MARGIN_ZH[label];
    const m = /^([\d.]+) lengths$/.exec(label);
    return m ? `${m[1]}馬位` : label;
  }

  // ------------------------------------------------------------ static DOM
  function applyStatic() {
    document.documentElement.lang = lang === 'zh' ? 'zh-HK' : 'en';
    document.title = t('doc.title');
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
    document.querySelectorAll('[data-i18n-title]').forEach((el) => { el.title = t(el.dataset.i18nTitle); });
    document.querySelectorAll('[data-i18n-label]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nLabel)); });
    const btn = document.getElementById('langBtn');
    if (btn) { btn.textContent = t('lang.btn'); btn.title = t('title.lang'); }
  }

  function setLang(l) {
    lang = l === 'zh' ? 'zh' : 'en';
    try { localStorage.setItem(KEY, lang); } catch (e) { /* ignore */ }
    applyStatic();
    window.dispatchEvent(new CustomEvent('langchange'));
  }

  function init() {
    applyStatic();
    const btn = document.getElementById('langBtn');
    if (btn) btn.addEventListener('click', () => setLang(lang === 'zh' ? 'en' : 'zh'));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  return {
    t, pickLine, d, horse, jockey, race, margin, setLang,
    get lang() { return lang; },
  };
})();

if (typeof module !== 'undefined') module.exports = I18N;
