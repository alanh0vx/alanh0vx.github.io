// ============================================================
// tutorial.js — Interactive tutorial lessons
// ============================================================
(function () {
  'use strict';

  var G = window.ChineseChess.Game;
  var SIDE = G.SIDE;
  var TYPE = G.TYPE;

  var PROGRESS_KEY = 'xiangqi_tutorial_progress';
  var currentLesson = -1;
  var currentStep = 0;

  var lessons = [
    // Lesson 0: Board Introduction
    {
      id: 'board_intro',
      title: '棋盤介紹',
      icon: '棋',
      steps: [
        {
          text: '歡迎來到象棋教學！象棋棋盤由九條直線和十條橫線組成，棋子放在線的交叉點上。',
          fen: '9/9/9/9/9/9/9/9/9/9 w',
          highlights: []
        },
        {
          text: '棋盤中間的空白地帶叫做「楚河漢界」，又稱為「河界」。象（相）不能過河。',
          fen: '9/9/9/9/9/9/9/9/9/9 w',
          highlights: [{type: 'river'}]
        },
        {
          text: '每邊各有一個「九宮」（3×3的方格，用斜線標記）。將帥和士只能在九宮內移動。',
          fen: '9/9/9/9/9/9/9/9/9/9 w',
          highlights: [{type: 'palace', side: 'both'}]
        },
        {
          text: '紅方在下方，黑方在上方。紅方先行。每條直線從右到左分別為一至九路。',
          fen: 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w',
          highlights: []
        }
      ]
    },
    // Lesson 1: Piece Movement
    {
      id: 'piece_moves',
      title: '棋子走法',
      icon: '子',
      steps: [
        {
          text: '【帥/將】是全局最重要的棋子。只能在九宮內沿直線移動一步（上下左右）。如果帥被將死，就輸了。',
          fen: '4k4/9/9/9/9/9/9/9/9/4K4 w',
          highlights: [{type: 'piece', row: 9, col: 4}],
          interactive: 'show_moves'
        },
        {
          text: '【仕/士】只能在九宮內沿斜線移動一步。仕是保護將帥的重要防禦棋子。',
          fen: '3ak4/9/9/9/9/9/9/9/9/3AK4 w',
          highlights: [{type: 'piece', row: 9, col: 3}],
          interactive: 'show_moves'
        },
        {
          text: '【相/象】沿斜線走「田」字（兩步），不能過河。如果「象眼」（田字中心）有棋子擋住，就不能走，叫做「塞象眼」。',
          fen: '4k4/9/9/9/9/9/9/2B6/9/4K4 w',
          highlights: [{type: 'piece', row: 7, col: 2}],
          interactive: 'show_moves'
        },
        {
          text: '【車】是最強的棋子！沿直線（橫或豎）移動，不限步數，不能跳過其他棋子。',
          fen: '4k4/9/9/9/9/9/9/9/9/4K3R w',
          highlights: [{type: 'piece', row: 9, col: 8}],
          interactive: 'show_moves'
        },
        {
          text: '【馬】走「日」字形：先直走一步，再斜走一步。如果直走的那一格有棋子擋住，就不能走，叫做「蹩馬腿」。',
          fen: '4k4/9/9/9/9/9/9/9/9/4K1N2 w',
          highlights: [{type: 'piece', row: 9, col: 6}],
          interactive: 'show_moves'
        },
        {
          text: '【炮/砲】移動時和車一樣走直線。但是吃子時，必須跳過中間恰好一個棋子（稱為「炮架」）才能吃掉後面的敵方棋子。',
          fen: '4k4/9/4r4/9/9/9/9/9/4C4/4K4 w',
          highlights: [{type: 'piece', row: 8, col: 4}],
          interactive: 'show_moves'
        },
        {
          text: '【兵/卒】過河前只能向前走一步。過河後可以向前或向左右走一步，但永遠不能後退。',
          fen: '4k4/9/9/9/4P4/9/9/9/9/4K4 w',
          highlights: [{type: 'piece', row: 4, col: 4}],
          interactive: 'show_moves'
        }
      ]
    },
    // Lesson 2: Special Rules
    {
      id: 'special_rules',
      title: '特殊規則',
      icon: '規',
      steps: [
        {
          text: '【將軍】當一方的棋子可以在下一步吃掉對方的將（帥）時，稱為「將軍」。被將軍的一方必須立即解除威脅。',
          fen: '3k5/9/9/9/9/9/9/4R4/9/4K4 w',
          highlights: []
        },
        {
          text: '【將死】被將軍後無論如何都無法解除威脅，就是「將死」，被將死的一方輸棋。',
          fen: '3k5/9/9/9/9/9/9/3R5/3R5/4K4 w',
          highlights: []
        },
        {
          text: '【蹩馬腿】馬走日字形，但如果第一步的直線方向被擋住，馬就不能朝那個方向走。',
          fen: '4k4/9/9/9/4p4/9/9/3N5/9/4K4 w',
          highlights: [{type: 'piece', row: 7, col: 3}]
        },
        {
          text: '【塞象眼】象走田字，但如果田字中心有棋子，就不能走那個方向。',
          fen: '4k4/9/9/9/9/9/3p5/2B6/9/4K4 w',
          highlights: [{type: 'piece', row: 7, col: 2}]
        },
        {
          text: '【對面將（白臉將）】將和帥不能在同一條直線上面對面（中間沒有棋子）。這是一條重要的規則，也是一種常見的殺法。',
          fen: '4k4/9/9/9/9/9/9/9/9/4K4 w',
          highlights: [{type: 'flying_general'}]
        },
        {
          text: '【困斃】與國際象棋不同，如果輪到某方走棋但沒有合法的棋步可走（無棋可動），該方判負。',
          fen: '3k5/3P5/3K5/9/9/9/9/9/9/9 b',
          highlights: []
        }
      ]
    },
    // Lesson 3: Basic Checkmate Patterns
    {
      id: 'basic_checkmates',
      title: '基本殺法',
      icon: '殺',
      steps: [
        {
          text: '【白臉將殺】利用對面將的規則：當你的將/帥與對方的將/帥在同一直線上時，中間不能沒有棋子。可以利用這個規則配合車或兵進行絕殺。',
          fen: '4k4/4R4/9/9/9/9/9/9/9/4K4 w',
          highlights: []
        },
        {
          text: '【悶宮殺】用一個棋子在將的面前將軍，而將被自己的棋子圍住無法逃脫。通常是用車或馬配合完成。',
          fen: 'r2k5/3NN4/3a5/9/9/9/9/9/9/4K4 w',
          highlights: []
        },
        {
          text: '【鐵門栓】用炮在將面前將軍，以車作為炮架，將被自己的士擋住無法逃脫。',
          fen: '3k5/4a4/4C4/9/9/9/9/9/9/3RK4 w',
          highlights: []
        },
        {
          text: '【雙車錯殺】兩輛車交替將軍，對方的將只能在有限的空間內移動，最終無處可逃。',
          fen: '4k4/9/9/9/9/9/9/9/9/3RKR3 w',
          highlights: []
        },
        {
          text: '【馬後炮】馬將軍後，用炮在馬的後方再將軍，形成雙重威脅。這是非常經典的殺法。',
          fen: '3k5/9/4N4/9/9/9/4C4/9/9/4K4 w',
          highlights: []
        }
      ]
    },
    // Lesson 4: Common Openings
    {
      id: 'openings',
      title: '開局入門',
      icon: '開',
      steps: [
        {
          text: '【中炮開局】最常見的開局：炮二平五，將炮移到中路，直接威脅對方中路。進攻型開局。',
          fen: 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w',
          highlights: [],
          opening: ['炮二平五']
        },
        {
          text: '【飛相局】相三進五或相七進五，先穩固防守。這是穩健型開局，適合防守反擊。',
          fen: 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w',
          highlights: [],
          opening: ['相三進五']
        },
        {
          text: '【仙人指路】兵七進一或兵三進一，先把兵推進一步，試探對方的應對。靈活多變的開局。',
          fen: 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w',
          highlights: [],
          opening: ['兵七進一']
        },
        {
          text: '【屏風馬】馬二進三、馬八進七，雙馬守中兵，是最常見的應對中炮的佈局。',
          fen: 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C2C4/9/RNBAKABNR b',
          highlights: [],
          opening: ['馬8進7']
        }
      ]
    },
    // Lesson 5: Notation
    {
      id: 'notation',
      title: '記譜法',
      icon: '譜',
      steps: [
        {
          text: '象棋的記譜格式為四個字：【棋子】【所在直線】【動作】【目標】。例如「炮二平五」表示在第二條線上的炮，平移到第五條線。',
          fen: 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w',
          highlights: []
        },
        {
          text: '紅方的直線從右到左編號為一到九（用中文數字）。黑方則用阿拉伯數字1到9（也是從自己右方算起）。',
          fen: 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w',
          highlights: [{type: 'columns'}]
        },
        {
          text: '動作有三種：「進」表示向前走（向對方方向），「退」表示向後走（向自己方向），「平」表示橫向移動。',
          fen: 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w',
          highlights: []
        },
        {
          text: '目標值：橫移（平）時是目標直線號碼。直行的棋子（車、炮、兵）進退時，數字表示走了幾步。斜行的棋子（馬、仕、相）進退時，數字表示到達的直線號碼。',
          fen: 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w',
          highlights: []
        },
        {
          text: '當同一直線上有兩個相同棋子時，用「前」和「後」區分。例如「前車進三」表示前面那輛車向前走三步。',
          fen: '4k4/9/9/9/4R4/9/9/4R4/9/4K4 w',
          highlights: []
        }
      ]
    }
  ];

  // --- Progress ---

  var progress = {};

  function loadProgress() {
    try {
      var raw = localStorage.getItem(PROGRESS_KEY);
      progress = raw ? JSON.parse(raw) : {};
    } catch (e) {
      progress = {};
    }
  }

  function saveProgress() {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    } catch (e) {}
  }

  function markLessonComplete(lessonId) {
    progress[lessonId] = { completed: true, completedAt: new Date().toISOString() };
    saveProgress();
  }

  function isLessonComplete(lessonId) {
    return progress[lessonId] && progress[lessonId].completed;
  }

  // --- Navigation ---

  function getLessons() {
    return lessons.map(function (l) {
      return {
        id: l.id,
        title: l.title,
        icon: l.icon,
        stepsCount: l.steps.length,
        completed: isLessonComplete(l.id)
      };
    });
  }

  function getLesson(index) {
    return lessons[index] || null;
  }

  function startLesson(index) {
    currentLesson = index;
    currentStep = 0;
    return getCurrentStep();
  }

  function getCurrentStep() {
    if (currentLesson < 0 || currentLesson >= lessons.length) return null;
    var lesson = lessons[currentLesson];
    if (currentStep >= lesson.steps.length) return null;

    return {
      lessonIndex: currentLesson,
      lessonTitle: lesson.title,
      stepIndex: currentStep,
      totalSteps: lesson.steps.length,
      step: lesson.steps[currentStep]
    };
  }

  function nextStep() {
    if (currentLesson < 0) return null;
    var lesson = lessons[currentLesson];
    currentStep++;
    if (currentStep >= lesson.steps.length) {
      markLessonComplete(lesson.id);
      return null; // lesson complete
    }
    return getCurrentStep();
  }

  function prevStep() {
    if (currentStep > 0) currentStep--;
    return getCurrentStep();
  }

  // --- Export ---
  window.ChineseChess.Tutorial = {
    init: function () { loadProgress(); },
    getLessons: getLessons,
    getLesson: getLesson,
    startLesson: startLesson,
    getCurrentStep: getCurrentStep,
    nextStep: nextStep,
    prevStep: prevStep,
    isLessonComplete: isLessonComplete,
    lessons: lessons
  };
})();
