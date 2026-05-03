// Travel IC card — 旅行會話 multilingual phrasebook for 萬能通 OMNI·DICT.
// Loaded eagerly; the host (instant-dict/index.html) only enters this mode
// after the user picks the card from the EXT-IC chooser.
//
// 8 languages × 10 categories × ~7-12 phrases each. Every cell is
// click-to-speak: rows render with data-speak / data-speak-lang attributes
// that the host's existing TTS click delegate already handles. The host
// has a small-tweak so travel-mode phrases speak in their declared lang
// instead of being re-routed by state.voiceLang.

(function () {
  'use strict';

  const SCHEMA = 3;

  // Speaker tags inside a scenario turn:
  //   'me'   — the traveler  (rendered "我")
  //   'them' — the local     (rendered with the scenario's `themZh` / `themEn`)

  // 8 languages. `code` is BCP-47 for TTS, `tag` is the 1–2 char Chinese
  // label used in the LCD UI, `name` is the long display name.
  const LANGS = [
    { id: 'en',  code: 'en-US', tag: 'EN', name: 'English'    },
    { id: 'zh',  code: 'zh-CN', tag: '國', name: '國語'        },
    { id: 'yue', code: 'zh-HK', tag: '粵', name: '粵語'        },
    { id: 'ja',  code: 'ja-JP', tag: '日', name: '日本語'      },
    { id: 'ko',  code: 'ko-KR', tag: '韓', name: '한국어'       },
    { id: 'es',  code: 'es-ES', tag: '西', name: 'Español'     },
    { id: 'pt',  code: 'pt-BR', tag: '葡', name: 'Português'   },
    { id: 'th',  code: 'th-TH', tag: '泰', name: 'ไทย'         }
  ];

  // Each phrase is an object keyed by lang id.
  const CATS = [
    {
      id: 'greet', zh: '問候', en: 'Greetings',
      phrases: [
        { en: 'Hello',           zh: '你好',          yue: '你好',         ja: 'こんにちは',          ko: '안녕하세요',         es: 'Hola',                pt: 'Olá',                  th: 'สวัสดี' },
        { en: 'Thank you',       zh: '謝謝',          yue: '唔該',         ja: 'ありがとう',          ko: '감사합니다',         es: 'Gracias',             pt: 'Obrigado',             th: 'ขอบคุณ' },
        { en: 'Sorry',           zh: '對不起',        yue: '唔好意思',     ja: 'すみません',          ko: '죄송합니다',         es: 'Perdón',              pt: 'Desculpe',             th: 'ขอโทษ' },
        { en: 'Yes',             zh: '是',            yue: '係',           ja: 'はい',                ko: '네',                 es: 'Sí',                  pt: 'Sim',                  th: 'ใช่' },
        { en: 'No',              zh: '不是',          yue: '唔係',         ja: 'いいえ',              ko: '아니요',             es: 'No',                  pt: 'Não',                  th: 'ไม่' },
        { en: 'Goodbye',         zh: '再見',          yue: '再見',         ja: 'さようなら',          ko: '안녕히 가세요',      es: 'Adiós',               pt: 'Adeus',                th: 'ลาก่อน' },
        { en: 'Good morning',    zh: '早安',          yue: '早晨',         ja: 'おはようございます',  ko: '좋은 아침입니다',    es: 'Buenos días',         pt: 'Bom dia',              th: 'อรุณสวัสดิ์' },
        { en: 'Good night',      zh: '晚安',          yue: '晚安',         ja: 'おやすみなさい',      ko: '안녕히 주무세요',    es: 'Buenas noches',       pt: 'Boa noite',            th: 'ราตรีสวัสดิ์' },
        { en: 'How are you?',    zh: '你好嗎？',      yue: '你好嗎？',     ja: 'お元気ですか',        ko: '잘 지내세요?',       es: '¿Cómo estás?',        pt: 'Como vai?',            th: 'สบายดีไหม' },
        { en: "I'm fine",        zh: '我很好',        yue: '我幾好',       ja: '元気です',            ko: '잘 지내요',          es: 'Estoy bien',          pt: 'Estou bem',            th: 'สบายดี' },
        { en: 'Please',          zh: '請',            yue: '唔該',         ja: 'お願いします',        ko: '부탁합니다',         es: 'Por favor',           pt: 'Por favor',            th: 'กรุณา' },
        { en: "You're welcome",  zh: '不客氣',        yue: '唔使客氣',     ja: 'どういたしまして',    ko: '천만에요',           es: 'De nada',             pt: 'De nada',              th: 'ไม่เป็นไร' }
      ]
    },
    {
      id: 'customs', zh: '海關', en: 'Customs',
      phrases: [
        { en: "I'm a tourist",                zh: '我是遊客',          yue: '我係遊客',         ja: '観光です',                       ko: '관광객입니다',                  es: 'Soy turista',                       pt: 'Sou turista',                     th: 'ผมเป็นนักท่องเที่ยว' },
        { en: "I'll stay seven days",         zh: '我會住七天',        yue: '我會住七日',       ja: '七日間滞在します',               ko: '칠 일 머물 거예요',             es: 'Me quedaré siete días',             pt: 'Vou ficar sete dias',             th: 'ผมจะอยู่เจ็ดวัน' },
        { en: 'This is my passport',          zh: '這是我的護照',      yue: '呢個係我嘅護照',   ja: 'これは私のパスポートです',       ko: '이것은 제 여권입니다',          es: 'Este es mi pasaporte',              pt: 'Este é o meu passaporte',         th: 'นี่คือหนังสือเดินทางของผม' },
        { en: 'Nothing to declare',           zh: '沒有東西要申報',    yue: '冇嘢要申報',       ja: '申告するものはありません',       ko: '신고할 것이 없습니다',          es: 'Nada que declarar',                 pt: 'Nada a declarar',                 th: 'ไม่มีอะไรต้องสำแดง' },
        { en: 'Where is baggage claim?',      zh: '行李提取處在哪裡？',yue: '行李提取處喺邊？', ja: '手荷物受取所はどこですか',       ko: '수하물 찾는 곳이 어디예요?',    es: '¿Dónde está la recogida de equipaje?', pt: 'Onde fica a esteira de bagagem?', th: 'รับกระเป๋าที่ไหน' },
        { en: "I've lost my luggage",         zh: '我的行李遺失了',    yue: '我嘅行李唔見咗',   ja: '荷物が無くなりました',           ko: '짐을 잃어버렸어요',             es: 'He perdido mi equipaje',            pt: 'Perdi a minha bagagem',           th: 'ผมทำกระเป๋าหาย' },
        { en: 'Where is the exit?',           zh: '出口在哪裡？',      yue: '出口喺邊度？',     ja: '出口はどこですか',               ko: '출구가 어디예요?',              es: '¿Dónde está la salida?',            pt: 'Onde fica a saída?',              th: 'ทางออกอยู่ที่ไหน' },
        { en: 'Do I need a visa?',            zh: '我需要簽證嗎？',    yue: '我使唔使簽證？',   ja: 'ビザは必要ですか',               ko: '비자가 필요해요?',              es: '¿Necesito visa?',                   pt: 'Preciso de visto?',               th: 'ต้องมีวีซ่าไหม' }
      ]
    },
    {
      id: 'transport', zh: '交通', en: 'Transport',
      phrases: [
        { en: 'Where is the taxi stand?',     zh: '計程車站在哪裡？',  yue: '的士站喺邊度？',   ja: 'タクシー乗り場はどこですか',     ko: '택시 승강장이 어디예요?',       es: '¿Dónde está la parada de taxis?',   pt: 'Onde fica o ponto de táxi?',      th: 'ที่จอดแท็กซี่อยู่ที่ไหน' },
        { en: 'To this address, please',      zh: '請到這個地址',      yue: '唔該去呢個地址',   ja: 'この住所までお願いします',       ko: '이 주소로 가주세요',            es: 'A esta dirección, por favor',       pt: 'Para este endereço, por favor',   th: 'ไปที่อยู่นี้ครับ' },
        { en: 'How much is the fare?',        zh: '車費多少錢？',      yue: '車費幾多錢？',     ja: '料金はいくらですか',             ko: '요금이 얼마예요?',              es: '¿Cuánto es la tarifa?',             pt: 'Quanto é a tarifa?',              th: 'ค่าโดยสารเท่าไร' },
        { en: 'Where is the train station?',  zh: '火車站在哪裡？',    yue: '火車站喺邊度？',   ja: '駅はどこですか',                 ko: '기차역이 어디예요?',            es: '¿Dónde está la estación de tren?',  pt: 'Onde é a estação de trem?',       th: 'สถานีรถไฟอยู่ที่ไหน' },
        { en: 'One ticket, please',           zh: '請給我一張車票',    yue: '唔該畀我一張票',   ja: '切符一枚お願いします',           ko: '표 한 장 주세요',               es: 'Un boleto, por favor',              pt: 'Um bilhete, por favor',           th: 'ขอตั๋วหนึ่งใบ' },
        { en: 'When does it depart?',         zh: '幾點開車？',        yue: '幾點開車？',       ja: '何時に出発しますか',             ko: '언제 출발해요?',                es: '¿Cuándo sale?',                     pt: 'Quando parte?',                   th: 'ออกกี่โมง' },
        { en: 'Please stop here',             zh: '請在這裡停車',      yue: '唔該喺呢度停',     ja: 'ここで止めてください',           ko: '여기서 세워 주세요',            es: 'Pare aquí, por favor',              pt: 'Pare aqui, por favor',            th: 'จอดที่นี่ครับ' },
        { en: 'Is it far?',                   zh: '遠嗎？',            yue: '遠唔遠？',         ja: '遠いですか',                     ko: '멀어요?',                       es: '¿Está lejos?',                      pt: 'É longe?',                        th: 'ไกลไหม' }
      ]
    },
    {
      id: 'hotel', zh: '酒店', en: 'Hotel',
      phrases: [
        { en: 'I have a reservation',         zh: '我有預訂',          yue: '我有訂房',         ja: '予約してあります',               ko: '예약했습니다',                  es: 'Tengo una reserva',                 pt: 'Tenho uma reserva',               th: 'ผมจองห้องไว้' },
        { en: 'Check in, please',             zh: '我要辦理入住',      yue: '我要 check-in',    ja: 'チェックインお願いします',       ko: '체크인 부탁합니다',             es: 'Quisiera registrarme',              pt: 'Gostaria de fazer check-in',      th: 'เช็คอินครับ' },
        { en: 'Check out, please',            zh: '我要退房',          yue: '我要退房',         ja: 'チェックアウトお願いします',     ko: '체크아웃 부탁합니다',           es: 'Quisiera salir',                    pt: 'Gostaria de fazer check-out',     th: 'เช็คเอาท์ครับ' },
        { en: 'Is breakfast included?',       zh: '包早餐嗎？',        yue: '包早餐嗎？',       ja: '朝食は付いていますか',           ko: '조식이 포함되어 있어요?',       es: '¿El desayuno está incluido?',       pt: 'O café da manhã está incluído?',  th: 'รวมอาหารเช้าไหม' },
        { en: 'Wi-Fi password?',              zh: 'Wi-Fi 密碼是？',    yue: 'Wi-Fi 密碼係？',   ja: 'Wi-Fiのパスワードは',            ko: '와이파이 비밀번호가 뭐예요?',   es: '¿Cuál es la contraseña del Wi-Fi?', pt: 'Qual é a senha do Wi-Fi?',        th: 'รหัส Wi-Fi คืออะไร' },
        { en: 'The room is too cold',         zh: '房間太冷了',        yue: '間房太凍',         ja: '部屋が寒すぎます',               ko: '방이 너무 추워요',              es: 'La habitación está muy fría',       pt: 'O quarto está muito frio',        th: 'ห้องเย็นเกินไป' },
        { en: 'One more towel, please',       zh: '請多給一條毛巾',    yue: '唔該多條毛巾',     ja: 'タオルをもう一枚ください',       ko: '수건 하나 더 주세요',           es: 'Otra toalla, por favor',            pt: 'Outra toalha, por favor',         th: 'ขอผ้าเช็ดตัวอีกผืน' },
        { en: 'What time is checkout?',       zh: '幾點退房？',        yue: '幾點退房？',       ja: 'チェックアウトは何時ですか',     ko: '체크아웃 몇 시예요?',           es: '¿A qué hora es la salida?',         pt: 'A que horas é o check-out?',      th: 'เช็คเอาท์กี่โมง' }
      ]
    },
    {
      id: 'food', zh: '餐廳', en: 'Restaurant',
      phrases: [
        { en: 'A table for two',              zh: '兩位',              yue: '兩位',             ja: '二名です',                       ko: '두 명이요',                     es: 'Una mesa para dos',                 pt: 'Uma mesa para dois',              th: 'โต๊ะสำหรับสองคน' },
        { en: 'The menu, please',             zh: '請給我菜單',        yue: '唔該俾個 menu',    ja: 'メニューをお願いします',         ko: '메뉴 주세요',                   es: 'La carta, por favor',               pt: 'O cardápio, por favor',           th: 'ขอเมนู' },
        { en: 'What do you recommend?',       zh: '你推薦什麼？',      yue: '你有咩好介紹？',   ja: 'おすすめは何ですか',             ko: '뭐가 맛있어요?',                es: '¿Qué recomienda?',                  pt: 'O que recomenda?',                th: 'แนะนำอะไรดี' },
        { en: "I'll have this",               zh: '我要這個',          yue: '我要呢個',         ja: 'これをください',                 ko: '이거 주세요',                   es: 'Quiero esto',                       pt: 'Quero isto',                      th: 'ขออันนี้' },
        { en: 'Is it spicy?',                 zh: '辣嗎？',            yue: '辣唔辣？',         ja: '辛いですか',                     ko: '매워요?',                       es: '¿Pica?',                            pt: 'É picante?',                      th: 'เผ็ดไหม' },
        { en: 'Water, please',                zh: '請給我水',          yue: '唔該水',           ja: 'お水をください',                 ko: '물 주세요',                     es: 'Agua, por favor',                   pt: 'Água, por favor',                 th: 'ขอน้ำหน่อย' },
        { en: 'The bill, please',             zh: '請結帳',            yue: '唔該埋單',         ja: 'お会計お願いします',             ko: '계산해 주세요',                 es: 'La cuenta, por favor',              pt: 'A conta, por favor',              th: 'เก็บเงินด้วย' },
        { en: 'Delicious!',                   zh: '很好吃！',          yue: '好食！',           ja: 'おいしい！',                     ko: '맛있어요!',                     es: '¡Está delicioso!',                  pt: 'Está delicioso!',                 th: 'อร่อย!' },
        { en: 'Cheers!',                      zh: '乾杯！',            yue: '飲杯！',           ja: '乾杯！',                         ko: '건배!',                         es: '¡Salud!',                           pt: 'Saúde!',                          th: 'ไชโย!' },
        { en: 'No spicy, please',             zh: '請不要辣',          yue: '唔該唔好辣',       ja: '辛くしないでください',           ko: '맵지 않게 해 주세요',           es: 'Sin picante, por favor',            pt: 'Sem picante, por favor',          th: 'ไม่เผ็ดนะ' }
      ]
    },
    {
      id: 'shop', zh: '購物', en: 'Shopping',
      phrases: [
        { en: 'How much is this?',            zh: '這個多少錢？',      yue: '呢個幾多錢？',     ja: 'これはいくらですか',             ko: '이거 얼마예요?',                es: '¿Cuánto cuesta esto?',              pt: 'Quanto custa isto?',              th: 'นี่เท่าไร' },
        { en: 'Too expensive',                zh: '太貴了',            yue: '太貴啦',           ja: '高すぎます',                     ko: '너무 비싸요',                   es: 'Es muy caro',                       pt: 'É muito caro',                    th: 'แพงเกินไป' },
        { en: 'Discount, please',             zh: '可以便宜一點嗎？',  yue: '可唔可以平啲？',   ja: '安くなりますか',                 ko: '깎아 주세요',                   es: '¿Me hace descuento?',               pt: 'Pode dar um desconto?',           th: 'ลดได้ไหม' },
        { en: "I'll take it",                 zh: '我要買',            yue: '我要呢個',         ja: 'これにします',                   ko: '이걸로 할게요',                 es: 'Me lo llevo',                       pt: 'Vou levar',                       th: 'ผมเอาอันนี้' },
        { en: 'Credit card OK?',              zh: '可以刷卡嗎？',      yue: '可唔可以碌卡？',   ja: 'カードは使えますか',             ko: '카드 받아요?',                  es: '¿Aceptan tarjeta?',                 pt: 'Aceita cartão?',                  th: 'รับบัตรเครดิตไหม' },
        { en: "Where's the fitting room?",    zh: '試衣間在哪？',      yue: '試身室喺邊？',     ja: '試着室はどこですか',             ko: '탈의실이 어디예요?',            es: '¿Dónde está el probador?',          pt: 'Onde fica o provador?',           th: 'ห้องลองเสื้ออยู่ไหน' },
        { en: 'Just looking, thanks',         zh: '我只是看看，謝謝',  yue: '我睇下姐，唔該',   ja: '見ているだけです',               ko: '그냥 구경하고 있어요',          es: 'Solo estoy mirando, gracias',       pt: 'Só estou olhando, obrigado',      th: 'แค่ดูเฉยๆ ขอบคุณ' },
        { en: 'Different size, please',       zh: '請給我另一個尺寸',  yue: '唔該換個 size',    ja: '別のサイズをください',           ko: '다른 사이즈 주세요',            es: 'Otra talla, por favor',             pt: 'Outro tamanho, por favor',        th: 'ขอไซส์อื่น' }
      ]
    },
    {
      id: 'sight', zh: '觀光', en: 'Sightseeing',
      phrases: [
        { en: 'Where is the entrance?',       zh: '入口在哪裡？',      yue: '入口喺邊度？',     ja: '入口はどこですか',               ko: '입구가 어디예요?',              es: '¿Dónde está la entrada?',           pt: 'Onde fica a entrada?',            th: 'ทางเข้าอยู่ที่ไหน' },
        { en: 'How much is the ticket?',      zh: '門票多少錢？',      yue: '門票幾多錢？',     ja: '入場料はいくらですか',           ko: '입장료가 얼마예요?',            es: '¿Cuánto cuesta la entrada?',        pt: 'Quanto custa o ingresso?',        th: 'ค่าเข้าเท่าไร' },
        { en: 'What time does it open?',      zh: '幾點開門？',        yue: '幾點開門？',       ja: '何時に開きますか',               ko: '몇 시에 열어요?',               es: '¿A qué hora abre?',                 pt: 'A que horas abre?',               th: 'เปิดกี่โมง' },
        { en: 'May I take photos?',           zh: '可以拍照嗎？',      yue: '可唔可以影相？',   ja: '写真を撮ってもいいですか',       ko: '사진 찍어도 돼요?',             es: '¿Puedo tomar fotos?',               pt: 'Posso tirar fotos?',              th: 'ถ่ายรูปได้ไหม' },
        { en: 'Can you take a photo of me?',  zh: '可以幫我拍張照嗎？',yue: '可唔可以幫我影相？',ja: '写真を撮ってもらえますか',       ko: '사진 좀 찍어 주세요',           es: '¿Me puede tomar una foto?',         pt: 'Pode tirar uma foto minha?',      th: 'ช่วยถ่ายรูปให้หน่อย' },
        { en: 'Beautiful!',                   zh: '真漂亮！',          yue: '好靚！',           ja: '美しい！',                       ko: '예뻐요!',                       es: '¡Qué bonito!',                      pt: 'Que lindo!',                      th: 'สวยจัง' },
        { en: 'Where is the bathroom?',       zh: '洗手間在哪？',      yue: '洗手間喺邊？',     ja: 'トイレはどこですか',             ko: '화장실이 어디예요?',            es: '¿Dónde está el baño?',              pt: 'Onde fica o banheiro?',           th: 'ห้องน้ำอยู่ที่ไหน' },
        { en: 'Is there a map?',              zh: '有地圖嗎？',        yue: '有冇地圖？',       ja: '地図はありますか',               ko: '지도 있어요?',                  es: '¿Hay un mapa?',                     pt: 'Tem um mapa?',                    th: 'มีแผนที่ไหม' }
      ]
    },
    {
      id: 'help', zh: '求助', en: 'Emergency',
      phrases: [
        { en: 'Help!',                        zh: '救命！',            yue: '救命呀！',         ja: '助けて！',                       ko: '도와주세요!',                   es: '¡Ayuda!',                           pt: 'Socorro!',                        th: 'ช่วยด้วย!' },
        { en: "I'm lost",                     zh: '我迷路了',          yue: '我蕩失路',         ja: '道に迷いました',                 ko: '길을 잃었어요',                 es: 'Estoy perdido',                     pt: 'Estou perdido',                   th: 'ผมหลงทาง' },
        { en: 'Call the police, please',      zh: '請報警',            yue: '唔該報警',         ja: '警察を呼んでください',           ko: '경찰을 불러 주세요',            es: 'Llame a la policía, por favor',     pt: 'Chame a polícia, por favor',      th: 'เรียกตำรวจที' },
        { en: 'Call an ambulance',            zh: '請叫救護車',        yue: '唔該叫救護車',     ja: '救急車を呼んでください',         ko: '구급차를 불러 주세요',          es: 'Llame a una ambulancia',            pt: 'Chame uma ambulância',            th: 'เรียกรถพยาบาล' },
        { en: "I don't feel well",            zh: '我不舒服',          yue: '我唔舒服',         ja: '気分が悪いです',                 ko: '몸이 안 좋아요',                es: 'No me siento bien',                 pt: 'Não estou bem',                   th: 'ผมไม่สบาย' },
        { en: 'I need a doctor',              zh: '我需要醫生',        yue: '我要睇醫生',       ja: '医者が必要です',                 ko: '의사가 필요해요',               es: 'Necesito un médico',                pt: 'Preciso de um médico',            th: 'ต้องการหมอ' },
        { en: "I've lost my passport",        zh: '我的護照遺失了',    yue: '我嘅護照唔見咗',   ja: 'パスポートを失くしました',       ko: '여권을 잃어버렸어요',           es: 'He perdido mi pasaporte',           pt: 'Perdi o meu passaporte',          th: 'ทำหนังสือเดินทางหาย' },
        { en: 'Do you speak English?',        zh: '你會說英語嗎？',    yue: '你識唔識講英文？', ja: '英語を話せますか',               ko: '영어 하세요?',                  es: '¿Habla inglés?',                    pt: 'Fala inglês?',                    th: 'พูดภาษาอังกฤษได้ไหม' }
      ]
    },
    {
      id: 'num', zh: '數字', en: 'Numbers',
      phrases: [
        { en: 'One',          zh: '一',     yue: '一',     ja: 'いち',     ko: '일',     es: 'uno',    pt: 'um',     th: 'หนึ่ง' },
        { en: 'Two',          zh: '二',     yue: '二',     ja: 'に',       ko: '이',     es: 'dos',    pt: 'dois',   th: 'สอง' },
        { en: 'Three',        zh: '三',     yue: '三',     ja: 'さん',     ko: '삼',     es: 'tres',   pt: 'três',   th: 'สาม' },
        { en: 'Four',         zh: '四',     yue: '四',     ja: 'よん',     ko: '사',     es: 'cuatro', pt: 'quatro', th: 'สี่' },
        { en: 'Five',         zh: '五',     yue: '五',     ja: 'ご',       ko: '오',     es: 'cinco',  pt: 'cinco',  th: 'ห้า' },
        { en: 'Six',          zh: '六',     yue: '六',     ja: 'ろく',     ko: '육',     es: 'seis',   pt: 'seis',   th: 'หก' },
        { en: 'Seven',        zh: '七',     yue: '七',     ja: 'なな',     ko: '칠',     es: 'siete',  pt: 'sete',   th: 'เจ็ด' },
        { en: 'Eight',        zh: '八',     yue: '八',     ja: 'はち',     ko: '팔',     es: 'ocho',   pt: 'oito',   th: 'แปด' },
        { en: 'Nine',         zh: '九',     yue: '九',     ja: 'きゅう',   ko: '구',     es: 'nueve',  pt: 'nove',   th: 'เก้า' },
        { en: 'Ten',          zh: '十',     yue: '十',     ja: 'じゅう',   ko: '십',     es: 'diez',   pt: 'dez',    th: 'สิบ' },
        { en: 'One hundred',  zh: '一百',   yue: '一百',   ja: 'ひゃく',   ko: '백',     es: 'cien',   pt: 'cem',    th: 'หนึ่งร้อย' },
        { en: 'One thousand', zh: '一千',   yue: '一千',   ja: 'せん',     ko: '천',     es: 'mil',    pt: 'mil',    th: 'หนึ่งพัน' }
      ]
    },
    {
      id: 'time', zh: '時間', en: 'Time',
      phrases: [
        { en: 'What time is it?',  zh: '現在幾點？', yue: '而家幾點？', ja: '今何時ですか', ko: '지금 몇 시예요?', es: '¿Qué hora es?', pt: 'Que horas são?', th: 'ตอนนี้กี่โมง' },
        { en: 'Today',             zh: '今天',       yue: '今日',       ja: '今日',         ko: '오늘',            es: 'hoy',            pt: 'hoje',           th: 'วันนี้' },
        { en: 'Tomorrow',          zh: '明天',       yue: '聽日',       ja: '明日',         ko: '내일',            es: 'mañana',         pt: 'amanhã',         th: 'พรุ่งนี้' },
        { en: 'Yesterday',         zh: '昨天',       yue: '噚日',       ja: '昨日',         ko: '어제',            es: 'ayer',           pt: 'ontem',          th: 'เมื่อวาน' },
        { en: 'Now',               zh: '現在',       yue: '而家',       ja: '今',           ko: '지금',            es: 'ahora',          pt: 'agora',          th: 'ตอนนี้' },
        { en: 'Morning',           zh: '早上',       yue: '朝早',       ja: '朝',           ko: '아침',            es: 'mañana',         pt: 'manhã',          th: 'ตอนเช้า' },
        { en: 'Afternoon',         zh: '下午',       yue: '下晝',       ja: '午後',         ko: '오후',            es: 'tarde',          pt: 'tarde',          th: 'ตอนบ่าย' },
        { en: 'Evening',           zh: '晚上',       yue: '夜晚',       ja: '夜',           ko: '저녁',            es: 'noche',          pt: 'noite',          th: 'ตอนกลางคืน' }
      ]
    }
  ];

  // Multi-turn dialog scenarios. Each turn carries all 8 languages plus
  // a `who` flag — 'me' (the traveler) or 'them' (the local). The
  // scenario's `themZh` / `themEn` label is shown when `who === 'them'`.
  const SCENARIOS = [
    {
      id: 'customs', zh: '入境', en: 'Customs', themZh: '關員', themEn: 'Officer',
      turns: [
        { who: 'them', en: 'Passport, please.',                  zh: '請出示護照',                yue: '唔該俾護照睇下',         ja: 'パスポートをお願いします',           ko: '여권을 보여주세요',                  es: 'Pasaporte, por favor.',                pt: 'Passaporte, por favor.',              th: 'ขอดูหนังสือเดินทางครับ' },
        { who: 'me',   en: 'Here you are.',                      zh: '給你',                      yue: '喺度',                   ja: 'どうぞ',                              ko: '여기 있습니다',                       es: 'Aquí tiene.',                          pt: 'Aqui está.',                          th: 'นี่ครับ' },
        { who: 'them', en: "What's the purpose of your visit?",  zh: '您來訪的目的是什麼？',      yue: '你今次嚟做咩？',         ja: '訪問の目的は何ですか',                ko: '방문 목적이 무엇입니까?',             es: '¿Cuál es el motivo de su viaje?',      pt: 'Qual o motivo da sua viagem?',        th: 'มาทำอะไรครับ' },
        { who: 'me',   en: "Tourism. I'll stay seven days.",     zh: '旅遊，我會逗留七天',        yue: '旅遊，我會留七日',       ja: '観光です。七日間滞在します。',        ko: '관광입니다. 칠 일 머무를 거예요.',    es: 'Turismo. Me quedaré siete días.',      pt: 'Turismo. Vou ficar sete dias.',       th: 'มาท่องเที่ยว จะอยู่เจ็ดวัน' },
        { who: 'them', en: 'Welcome. Have a nice stay.',         zh: '歡迎，祝您愉快',            yue: '歡迎，祝你玩得開心',     ja: 'ようこそ。よい滞在を。',              ko: '환영합니다. 즐거운 여행 되세요.',     es: 'Bienvenido. Que tenga una buena estancia.', pt: 'Bem-vindo. Tenha uma boa estadia.', th: 'ยินดีต้อนรับ ขอให้พักผ่อนสบายๆ' }
      ]
    },
    {
      id: 'taxi', zh: '計程車', en: 'Taxi', themZh: '司機', themEn: 'Driver',
      turns: [
        { who: 'me',   en: 'Hello, please take me to this address.',  zh: '你好，請載我到這個地址',      yue: '你好，唔該載我去呢個地址',  ja: 'こんにちは、この住所までお願いします',  ko: '안녕하세요, 이 주소로 가주세요',          es: 'Hola, lléveme a esta dirección, por favor.', pt: 'Olá, leve-me a este endereço, por favor.', th: 'สวัสดี ไปที่อยู่นี้ครับ' },
        { who: 'them', en: 'Sure, hop in.',                            zh: '好的，請上車',                yue: '好啦，上車啦',              ja: 'はい、どうぞ',                            ko: '네, 타세요',                              es: 'Claro, suba.',                            pt: 'Claro, entre.',                            th: 'ได้ครับ เชิญขึ้นรถ' },
        { who: 'me',   en: 'How long will it take?',                  zh: '需要多久？',                  yue: '要幾耐？',                  ja: 'どのくらいかかりますか',                  ko: '얼마나 걸려요?',                          es: '¿Cuánto tarda?',                          pt: 'Quanto tempo leva?',                       th: 'ใช้เวลานานไหม' },
        { who: 'them', en: 'About twenty minutes.',                   zh: '大約二十分鐘',                yue: '大概廿分鐘',                ja: '二十分くらいです',                        ko: '이십 분 정도예요',                        es: 'Unos veinte minutos.',                    pt: 'Cerca de vinte minutos.',                  th: 'ประมาณยี่สิบนาที' },
        { who: 'me',   en: 'Please stop here. How much?',             zh: '請在這裡停車。多少錢？',      yue: '唔該喺呢度停。幾多錢？',    ja: 'ここで止めてください。いくらですか',      ko: '여기서 세워 주세요. 얼마예요?',          es: 'Pare aquí, por favor. ¿Cuánto es?',       pt: 'Pare aqui, por favor. Quanto é?',          th: 'จอดที่นี่ครับ เท่าไหร่' },
        { who: 'me',   en: 'Thank you. Keep the change.',             zh: '謝謝，不用找了',              yue: '唔該，唔使找啦',            ja: 'ありがとう、お釣りはいいです',            ko: '감사합니다. 거스름돈은 됐어요.',          es: 'Gracias. Quédese con el cambio.',         pt: 'Obrigado. Pode ficar com o troco.',        th: 'ขอบคุณ ไม่ต้องทอนครับ' }
      ]
    },
    {
      id: 'hotel', zh: '酒店', en: 'Hotel', themZh: '櫃台', themEn: 'Clerk',
      turns: [
        { who: 'me',   en: 'Hi, I have a reservation.',          zh: '你好，我有預訂',           yue: '你好，我有訂房',         ja: 'こんにちは、予約してあります',         ko: '안녕하세요, 예약했습니다',         es: 'Hola, tengo una reserva.',                pt: 'Olá, tenho uma reserva.',                 th: 'สวัสดี ผมจองห้องไว้' },
        { who: 'them', en: 'Your name, please.',                 zh: '請問貴姓？',               yue: '請問點稱呼？',           ja: 'お名前をお願いします',                 ko: '성함이 어떻게 되세요?',            es: 'Su nombre, por favor.',                   pt: 'O seu nome, por favor.',                  th: 'ขอชื่อหน่อยครับ' },
        { who: 'me',   en: 'My name is Lee.',                    zh: '我姓李',                   yue: '我姓李',                 ja: '李と申します',                          ko: '이라고 합니다',                    es: 'Me llamo Lee.',                           pt: 'Chamo-me Lee.',                           th: 'ผมชื่อลี' },
        { who: 'them', en: "Yes, room 507. Here's your key.",    zh: '是的，507號房，這是您的鑰匙', yue: '係，507號房，呢條係匙',  ja: 'はい、507号室です。こちらが鍵です。', ko: '네, 507호실입니다. 열쇠 받으세요.', es: 'Sí, habitación 507. Aquí tiene la llave.', pt: 'Sim, quarto 507. Aqui está a chave.',    th: 'ห้อง 507 ครับ นี่กุญแจ' },
        { who: 'me',   en: 'Is breakfast included?',             zh: '包早餐嗎？',               yue: '包早餐嗎？',             ja: '朝食は付いていますか',                 ko: '조식이 포함되어 있어요?',          es: '¿El desayuno está incluido?',             pt: 'O café da manhã está incluído?',         th: 'รวมอาหารเช้าไหม' },
        { who: 'them', en: 'Yes, seven to ten in the lobby.',    zh: '是，早上七點至十點在大堂',  yue: '係，朝早七點到十點喺大堂', ja: 'はい、七時から十時までロビーで',       ko: '네, 일곱 시부터 열 시까지 로비에서요', es: 'Sí, de siete a diez en el lobby.',     pt: 'Sim, das sete às dez no lobby.',          th: 'ครับ เจ็ดโมงถึงสิบโมงที่ล็อบบี้' },
        { who: 'me',   en: 'Thank you.',                         zh: '謝謝',                     yue: '唔該',                   ja: 'ありがとう',                            ko: '감사합니다',                       es: 'Gracias.',                                pt: 'Obrigado.',                               th: 'ขอบคุณ' }
      ]
    },
    {
      id: 'food', zh: '點菜', en: 'Restaurant', themZh: '服務員', themEn: 'Server',
      turns: [
        { who: 'them', en: 'Welcome! How many people?',                zh: '歡迎光臨，請問幾位？',      yue: '歡迎光臨，幾多位？',     ja: 'いらっしゃいませ、何名様ですか',         ko: '어서 오세요, 몇 분이세요?',           es: '¡Bienvenido! ¿Cuántos son?',              pt: 'Bem-vindo! Quantas pessoas?',          th: 'ยินดีต้อนรับ กี่ที่ครับ' },
        { who: 'me',   en: 'Two, please.',                             zh: '兩位',                      yue: '兩位',                   ja: '二名です',                                ko: '두 명이요',                           es: 'Dos, por favor.',                         pt: 'Duas, por favor.',                     th: 'สองคนครับ' },
        { who: 'them', en: "This way, please. Here's the menu.",      zh: '這邊請，這是菜單',          yue: '呢邊請，呢個係 menu',    ja: 'こちらへどうぞ。メニューです。',          ko: '이쪽으로 오세요. 메뉴 드릴게요.',     es: 'Por aquí, por favor. Aquí está la carta.', pt: 'Por aqui, por favor. Aqui está o cardápio.', th: 'เชิญทางนี้ นี่คือเมนู' },
        { who: 'me',   en: 'What do you recommend?',                   zh: '你推薦什麼？',              yue: '你有咩好介紹？',         ja: 'おすすめは何ですか',                      ko: '뭐가 맛있어요?',                      es: '¿Qué recomienda?',                        pt: 'O que recomenda?',                     th: 'แนะนำอะไรดี' },
        { who: 'them', en: "Today's special is grilled fish.",         zh: '今日特餐是烤魚',            yue: '今日特餐係燒魚',         ja: '本日の特別料理は焼き魚です',              ko: '오늘의 특선은 생선구이예요',          es: 'La especialidad de hoy es pescado a la plancha.', pt: 'O prato do dia é peixe grelhado.', th: 'เมนูพิเศษวันนี้คือปลาย่าง' },
        { who: 'me',   en: "I'll have that. And water, please.",       zh: '我要那個，請給我水',        yue: '我要嗰個，唔該水',       ja: 'それをください。お水もお願いします。',    ko: '그걸로 할게요. 물도 주세요.',         es: 'Quiero eso. Y agua, por favor.',          pt: 'Quero isso. E água, por favor.',       th: 'ขออันนั้น แล้วก็ขอน้ำด้วย' },
        { who: 'them', en: 'Anything else?',                           zh: '還要其他的嗎？',            yue: '仲要啲咩？',             ja: '他に何かいかがですか',                    ko: '다른 거 더 필요하세요?',              es: '¿Algo más?',                              pt: 'Mais alguma coisa?',                   th: 'รับอะไรอีกไหม' },
        { who: 'me',   en: "That's all. The bill, please.",            zh: '就這些，請結帳',            yue: '咁多，唔該埋單',         ja: '以上です。お会計お願いします。',          ko: '그게 다예요. 계산해 주세요.',         es: 'Eso es todo. La cuenta, por favor.',      pt: 'É só isso. A conta, por favor.',       th: 'แค่นี้ครับ เก็บเงินด้วย' }
      ]
    },
    {
      id: 'direct', zh: '問路', en: 'Directions', themZh: '路人', themEn: 'Stranger',
      turns: [
        { who: 'me',   en: 'Excuse me, where is the train station?', zh: '不好意思，請問火車站在哪？', yue: '唔好意思，火車站喺邊？', ja: 'すみません、駅はどこですか',         ko: '실례합니다, 기차역이 어디예요?',  es: 'Disculpe, ¿dónde está la estación de tren?', pt: 'Com licença, onde fica a estação de trem?', th: 'ขอโทษครับ สถานีรถไฟอยู่ที่ไหน' },
        { who: 'them', en: 'Go straight, then turn right.',          zh: '一直走，然後右轉',           yue: '直行，再轉右',           ja: 'まっすぐ行って、右に曲がってください',  ko: '직진하다가 오른쪽으로 도세요',     es: 'Siga recto y luego gire a la derecha.',    pt: 'Siga em frente e vire à direita.',         th: 'ตรงไป แล้วเลี้ยวขวา' },
        { who: 'me',   en: 'How far is it?',                         zh: '有多遠？',                   yue: '幾遠？',                 ja: 'どのくらい遠いですか',                  ko: '얼마나 멀어요?',                    es: '¿A qué distancia está?',                   pt: 'Fica longe?',                              th: 'ไกลไหม' },
        { who: 'them', en: "About five minutes' walk.",              zh: '走路大約五分鐘',             yue: '行路大概五分鐘',         ja: '歩いて五分くらいです',                  ko: '걸어서 오 분 정도예요',             es: 'Unos cinco minutos a pie.',                pt: 'Cerca de cinco minutos a pé.',             th: 'เดินประมาณห้านาที' },
        { who: 'me',   en: 'Thank you very much.',                   zh: '非常感謝',                   yue: '多謝晒',                 ja: 'どうもありがとうございます',            ko: '정말 감사합니다',                   es: 'Muchas gracias.',                          pt: 'Muito obrigado.',                          th: 'ขอบคุณมากครับ' }
      ]
    },
    {
      id: 'shop', zh: '購物', en: 'Shopping', themZh: '店員', themEn: 'Clerk',
      turns: [
        { who: 'them', en: 'Can I help you?',                       zh: '需要幫忙嗎？',          yue: '使唔使幫手？',     ja: '何かお探しですか',                ko: '도와드릴까요?',                 es: '¿Le ayudo en algo?',                       pt: 'Posso ajudar?',                       th: 'ให้ช่วยอะไรไหมคะ' },
        { who: 'me',   en: 'Just looking, thanks.',                 zh: '我只是看看，謝謝',      yue: '我睇下姐，唔該',   ja: '見ているだけです、ありがとう',    ko: '그냥 구경하고 있어요, 감사합니다', es: 'Solo estoy mirando, gracias.',           pt: 'Só estou olhando, obrigado.',         th: 'แค่ดูเฉยๆ ขอบคุณ' },
        { who: 'me',   en: 'How much is this?',                     zh: '這個多少錢？',          yue: '呢個幾多錢？',     ja: 'これはいくらですか',              ko: '이거 얼마예요?',                es: '¿Cuánto cuesta esto?',                     pt: 'Quanto custa isto?',                  th: 'นี่เท่าไหร่' },
        { who: 'them', en: 'Five hundred.',                         zh: '五百元',                yue: '五百蚊',           ja: '五百円です',                      ko: '오백 원이에요',                 es: 'Quinientos.',                              pt: 'Quinhentos.',                         th: 'ห้าร้อย' },
        { who: 'me',   en: 'Can you give me a discount?',           zh: '可以便宜一點嗎？',      yue: '可唔可以平啲？',   ja: '安くなりますか',                  ko: '깎아 주실 수 있어요?',          es: '¿Me puede hacer descuento?',               pt: 'Pode dar desconto?',                  th: 'ลดราคาได้ไหม' },
        { who: 'them', en: 'I can give you ten percent off.',       zh: '可以給您打九折',        yue: '可以打九折俾你',   ja: '一割引にできます',                ko: '십 퍼센트 할인해 드릴게요',     es: 'Le puedo hacer un diez por ciento de descuento.', pt: 'Posso dar dez por cento de desconto.', th: 'ลดให้สิบเปอร์เซ็นต์ได้' }
      ]
    },
    {
      id: 'clinic', zh: '求醫', en: 'Clinic', themZh: '醫生', themEn: 'Doctor',
      turns: [
        { who: 'me',   en: "Doctor, I don't feel well.",           zh: '醫生，我不舒服',        yue: '醫生，我唔舒服',     ja: '先生、気分が悪いです',          ko: '선생님, 몸이 안 좋아요',        es: 'Doctor, no me siento bien.',           pt: 'Doutor, não estou bem.',          th: 'คุณหมอ ผมไม่สบาย' },
        { who: 'them', en: "What's wrong?",                        zh: '怎麼了？',              yue: '點呀？',             ja: 'どうしましたか',                ko: '어디가 아프세요?',              es: '¿Qué le pasa?',                        pt: 'O que houve?',                    th: 'เป็นอะไรครับ' },
        { who: 'me',   en: 'I have a headache and a fever.',       zh: '我頭痛，還發燒',        yue: '我頭痛，仲發燒',     ja: '頭が痛くて、熱もあります',      ko: '머리가 아프고 열도 나요',       es: 'Me duele la cabeza y tengo fiebre.',   pt: 'Estou com dor de cabeça e febre.', th: 'ปวดหัว แล้วก็มีไข้' },
        { who: 'them', en: 'Since when?',                          zh: '從什麼時候開始？',      yue: '由幾時開始？',       ja: 'いつからですか',                ko: '언제부터예요?',                 es: '¿Desde cuándo?',                       pt: 'Desde quando?',                   th: 'ตั้งแต่เมื่อไหร่' },
        { who: 'me',   en: 'Since yesterday.',                     zh: '從昨天開始',            yue: '由噚日開始',         ja: '昨日からです',                  ko: '어제부터요',                    es: 'Desde ayer.',                          pt: 'Desde ontem.',                    th: 'ตั้งแต่เมื่อวาน' },
        { who: 'them', en: 'Take this medicine three times a day.',zh: '這個藥每天吃三次',      yue: '呢隻藥日日食三次',   ja: 'この薬を一日三回飲んでください',ko: '이 약을 하루에 세 번 드세요',  es: 'Tome este medicamento tres veces al día.', pt: 'Tome este remédio três vezes ao dia.', th: 'ทานยานี้วันละสามครั้ง' }
      ]
    },
    {
      id: 'lost', zh: '失物', en: 'Lost item', themZh: '警員', themEn: 'Officer',
      turns: [
        { who: 'me',   en: 'I lost my wallet.',                 zh: '我的錢包遺失了',     yue: '我嘅銀包唔見咗',     ja: '財布をなくしました',           ko: '지갑을 잃어버렸어요',           es: 'He perdido mi cartera.',                  pt: 'Perdi a minha carteira.',                 th: 'ผมทำกระเป๋าสตางค์หาย' },
        { who: 'them', en: 'Where did you last see it?',        zh: '您最後在哪裡看到？', yue: '你最後喺邊度見過？', ja: '最後にどこで見ましたか',       ko: '마지막으로 어디서 보셨어요?',   es: '¿Dónde la vio por última vez?',           pt: 'Onde a viu pela última vez?',             th: 'เห็นครั้งสุดท้ายที่ไหน' },
        { who: 'me',   en: 'At the restaurant, this morning.',  zh: '今早在餐廳',         yue: '今朝喺餐廳',         ja: '今朝、レストランで',           ko: '오늘 아침에 식당에서요',        es: 'Esta mañana, en el restaurante.',         pt: 'Esta manhã, no restaurante.',             th: 'เช้านี้ที่ร้านอาหาร' },
        { who: 'them', en: 'Please fill out this form.',        zh: '請填寫這張表格',     yue: '唔該填呢張表',       ja: 'この用紙にご記入ください',     ko: '이 양식을 작성해 주세요',       es: 'Rellene este formulario, por favor.',     pt: 'Preencha este formulário, por favor.',    th: 'กรุณากรอกแบบฟอร์มนี้' },
        { who: 'me',   en: 'Thank you for your help.',          zh: '謝謝您的幫忙',       yue: '多謝你嘅幫忙',       ja: 'ご協力ありがとうございます',   ko: '도와주셔서 감사합니다',         es: 'Gracias por su ayuda.',                   pt: 'Obrigado pela sua ajuda.',                th: 'ขอบคุณที่ช่วยเหลือ' }
      ]
    }
  ];

  /* =========================================================
   *  State / lifecycle
   * ========================================================= */

  function init(state) {
    if (!state.travel || state.travel._v !== SCHEMA) {
      state.travel = { _v: SCHEMA, view: 'title', cat: 0, phrase: 0, scn: 0, turn: 0, lang: 0 };
    }
  }

  function clamp(n, lo, hi)   { return Math.max(lo, Math.min(hi, n)); }
  function curCat(state)      { return CATS[clamp(state.travel.cat, 0, CATS.length - 1)]; }
  function curPhrases(state)  { return curCat(state).phrases; }
  function curPhrase(state)   { return curPhrases(state)[clamp(state.travel.phrase, 0, curPhrases(state).length - 1)]; }
  function curScn(state)      { return SCENARIOS[clamp(state.travel.scn, 0, SCENARIOS.length - 1)]; }
  function curTurns(state)    { return curScn(state).turns; }
  function curTurn(state)     { return curTurns(state)[clamp(state.travel.turn, 0, curTurns(state).length - 1)]; }

  /* =========================================================
   *  Rendering
   * ========================================================= */

  function escHtml(s) {
    return String(s).replace(/[&<>"']/g, c =>
      c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;');
  }

  function render(state, el) {
    init(state);
    const v = state.travel.view;
    if (v === 'cats')      return renderCats(state, el);
    if (v === 'phrases')   return renderPhrases(state, el);
    if (v === 'scenarios') return renderScenarios(state, el);
    if (v === 'dialog')    return renderDialog(state, el);
    return renderTitle(el);
  }

  function renderTitle(el) {
    el.classList.remove('cn-mode');
    el.classList.add('single');
    el.innerHTML =
      '<div class="travel-screen travel-title">' +
        '<div class="travel-title-zh">旅行會話</div>' +
        '<div class="travel-title-en">TRAVEL · 8 LANGUAGES</div>' +
        '<div class="travel-title-langs">EN · 國 · 粵 · 日 · 韓 · 西 · 葡 · 泰</div>' +
        '<div class="travel-title-buttons">' +
          '<div class="travel-hub-btn" data-travel-hub="phrases">' +
            '<span class="travel-hub-key">1</span>' +
            '<span class="travel-hub-zh">例句</span>' +
            '<span class="travel-hub-en">PHRASES</span>' +
            '<span class="travel-hub-meta">' + CATS.length + ' 類　' + CATS.reduce((a, c) => a + c.phrases.length, 0) + ' 句</span>' +
          '</div>' +
          '<div class="travel-hub-btn" data-travel-hub="scenarios">' +
            '<span class="travel-hub-key">2</span>' +
            '<span class="travel-hub-zh">對話</span>' +
            '<span class="travel-hub-en">SCENARIOS</span>' +
            '<span class="travel-hub-meta">' + SCENARIOS.length + ' 場　' + SCENARIOS.reduce((a, s) => a + s.turns.length, 0) + ' 句</span>' +
          '</div>' +
        '</div>' +
        '<div class="travel-foot">1/2 選擇　ENT 例句　&#9664; 退出 IC</div>' +
      '</div>';
  }

  function renderCats(state, el) {
    el.classList.remove('cn-mode');
    el.classList.add('single');
    const sel = state.travel.cat;
    const cells = CATS.map((c, i) =>
      '<div class="travel-cat' + (i === sel ? ' is-sel' : '') + '" data-travel-cat="' + i + '">' +
        '<span class="travel-cat-key">' + ((i + 1) % 10) + '</span>' +
        '<span class="travel-cat-zh">' + escHtml(c.zh) + '</span>' +
        '<span class="travel-cat-en">' + escHtml(c.en) + '</span>' +
        '<span class="travel-cat-n">' + c.phrases.length + '</span>' +
      '</div>'
    ).join('');
    el.innerHTML =
      '<div class="travel-screen travel-cats">' +
        '<div class="travel-cats-h">' +
          '<span class="travel-home-btn" data-travel-home>&#8962; 首頁</span>' +
          '<span class="travel-cats-h-zh">旅行會話　例句</span>' +
          '<span class="travel-cats-h-en">CHOOSE A CATEGORY</span>' +
        '</div>' +
        '<div class="travel-cats-grid">' + cells + '</div>' +
        '<div class="travel-foot-tip">' +
          '↑↓←→ 選擇 / 0–9 直接進入 / ENT 確認 / &#9664; 返回' +
        '</div>' +
      '</div>';
  }

  function renderPhrases(state, el) {
    el.classList.remove('cn-mode');
    el.classList.add('single');
    const cat   = curCat(state);
    const list  = cat.phrases;
    const idx   = clamp(state.travel.phrase, 0, list.length - 1);
    const p     = list[idx];

    const rows = LANGS.map((L, i) => {
      const txt = p[L.id] || '';
      return '<div class="travel-row" data-speak="' + escHtml(txt) + '" data-speak-lang="' + L.code + '">' +
        '<span class="travel-row-key">' + (i + 1) + '</span>' +
        '<span class="travel-row-tag">' + L.tag + '</span>' +
        '<span class="travel-row-text">' + escHtml(txt) + '</span>' +
        '<span class="travel-row-spk">&#9658;</span>' +
      '</div>';
    }).join('');

    const prevDisabled = idx <= 0;
    const nextDisabled = idx >= list.length - 1;

    el.innerHTML =
      '<div class="travel-screen travel-phrases">' +
        '<div class="travel-phrases-h">' +
          '<span class="travel-menu-btn" data-travel-menu>&#9664; 目錄</span>' +
          '<span class="travel-home-btn" data-travel-home>&#8962; 首頁</span>' +
          '<span class="travel-phrases-cat">' + escHtml(cat.zh + '　' + cat.en) + '</span>' +
          '<span class="travel-phrases-pos">' + (idx + 1) + ' / ' + list.length + '</span>' +
        '</div>' +
        '<div class="travel-phrases-rows">' + rows + '</div>' +
        '<div class="travel-phrases-foot">' +
          '<span class="travel-nav' + (prevDisabled ? ' is-off' : '') + '" data-travel-prev>&#9664; PREV</span>' +
          '<span class="travel-foot-mid">↑↓ 切換句子　1-8 朗讀語言　&#9664; 返回</span>' +
          '<span class="travel-nav' + (nextDisabled ? ' is-off' : '') + '" data-travel-next>NEXT &#9654;</span>' +
        '</div>' +
      '</div>';
  }

  function renderScenarios(state, el) {
    el.classList.remove('cn-mode');
    el.classList.add('single');
    const sel = state.travel.scn;
    const cells = SCENARIOS.map((s, i) =>
      '<div class="travel-cat travel-scn' + (i === sel ? ' is-sel' : '') + '" data-travel-scn="' + i + '">' +
        '<span class="travel-cat-key">' + ((i + 1) % 10) + '</span>' +
        '<span class="travel-cat-zh">' + escHtml(s.zh) + '</span>' +
        '<span class="travel-cat-en">' + escHtml(s.en) + '</span>' +
        '<span class="travel-cat-n">' + s.turns.length + '</span>' +
      '</div>'
    ).join('');
    el.innerHTML =
      '<div class="travel-screen travel-cats">' +
        '<div class="travel-cats-h">' +
          '<span class="travel-home-btn" data-travel-home>&#8962; 首頁</span>' +
          '<span class="travel-cats-h-zh">旅行會話　對話</span>' +
          '<span class="travel-cats-h-en">CHOOSE A SCENARIO</span>' +
        '</div>' +
        '<div class="travel-cats-grid">' + cells + '</div>' +
        '<div class="travel-foot-tip">' +
          '↑↓←→ 選擇 / 1–' + SCENARIOS.length + ' 直接進入 / ENT 確認 / &#9664; 返回' +
        '</div>' +
      '</div>';
  }

  function renderDialog(state, el) {
    el.classList.remove('cn-mode');
    el.classList.add('single');
    const scn    = curScn(state);
    const turns  = scn.turns;
    const langIx = clamp(state.travel.lang, 0, LANGS.length - 1);
    const L      = LANGS[langIx];

    const tabs = LANGS.map((LL, i) =>
      '<span class="travel-dlg-tab' + (i === langIx ? ' is-active' : '') + '" data-travel-lang="' + i + '">' +
        '<span class="travel-dlg-tab-key">' + (i + 1) + '</span>' +
        '<span class="travel-dlg-tab-tag">' + LL.tag + '</span>' +
      '</span>'
    ).join('');

    const rows = turns.map(t => {
      const txt = t[L.id] || '';
      const isMe = t.who === 'me';
      const spk  = isMe ? '我' : scn.themZh;
      return '<div class="travel-dlg-row' + (isMe ? ' is-me' : ' is-them') + '" data-speak="' + escHtml(txt) + '" data-speak-lang="' + L.code + '">' +
        '<span class="travel-dlg-spk">' + escHtml(spk) + '</span>' +
        '<span class="travel-dlg-line">' + escHtml(txt) + '</span>' +
        '<span class="travel-dlg-pl">&#9658;</span>' +
      '</div>';
    }).join('');

    el.innerHTML =
      '<div class="travel-screen travel-dialog">' +
        '<div class="travel-dlg-h">' +
          '<span class="travel-menu-btn" data-travel-menu>&#9664; 目錄</span>' +
          '<span class="travel-home-btn" data-travel-home>&#8962; 首頁</span>' +
          '<span class="travel-dlg-scn-title">' + escHtml(scn.zh + '　' + scn.en) + '</span>' +
          '<span class="travel-dlg-meta">' + escHtml(scn.themZh) + ' · ' + turns.length + ' 句</span>' +
        '</div>' +
        '<div class="travel-dlg-langs">' + tabs + '</div>' +
        '<div class="travel-dlg-script">' + rows + '</div>' +
        '<div class="travel-dlg-foot">' +
          '<span class="travel-dlg-play" data-travel-play>&#9658; 朗讀全段</span>' +
          '<span class="travel-foot-mid">1-8 切換語言　ENT 朗讀全段　&#9664; 返回</span>' +
        '</div>' +
      '</div>';
  }

  /* =========================================================
   *  Input — keyboard + click
   * ========================================================= */

  // Returns true if the key was handled (host will call render()).
  function onKey(state, action) {
    init(state);
    const t = state.travel;

    if (t.view === 'title') {
      if (action === 'enter') { t.view = 'cats'; return true; }       // ENT defaults to phrases
      if (action === 'back')  { return false; }                        // host falls back to setMode('ic')
      return false;
    }

    if (t.view === 'cats') {
      const cols = 3;
      if (action === 'enter') { t.view = 'phrases'; t.phrase = 0; return true; }
      if (action === 'back')  { t.view = 'title'; return true; }
      if (action === 'left')  { t.cat = (t.cat - 1 + CATS.length) % CATS.length; return true; }
      if (action === 'right') { t.cat = (t.cat + 1) % CATS.length; return true; }
      if (action === 'up')    { t.cat = (t.cat - cols + CATS.length) % CATS.length; return true; }
      if (action === 'down')  { t.cat = (t.cat + cols) % CATS.length; return true; }
      return false;
    }

    if (t.view === 'phrases') {
      const list = curPhrases(state);
      if (action === 'back')  { t.view = 'cats'; return true; }
      if (action === 'enter') {
        const p = list[t.phrase];
        speakPhrase(p, LANGS[0]);                     // ENT speaks English by default
        return true;
      }
      if (action === 'up')    { t.phrase = (t.phrase - 1 + list.length) % list.length; return true; }
      if (action === 'down')  { t.phrase = (t.phrase + 1) % list.length; return true; }
      if (action === 'left')  { t.phrase = (t.phrase - 1 + list.length) % list.length; return true; }
      if (action === 'right') { t.phrase = (t.phrase + 1) % list.length; return true; }
      return false;
    }

    if (t.view === 'scenarios') {
      const cols = 3;
      if (action === 'enter') { t.view = 'dialog'; t.turn = 0; return true; }
      if (action === 'back')  { t.view = 'title'; return true; }
      if (action === 'left')  { t.scn = (t.scn - 1 + SCENARIOS.length) % SCENARIOS.length; return true; }
      if (action === 'right') { t.scn = (t.scn + 1) % SCENARIOS.length; return true; }
      if (action === 'up')    { t.scn = (t.scn - cols + SCENARIOS.length) % SCENARIOS.length; return true; }
      if (action === 'down')  { t.scn = (t.scn + cols) % SCENARIOS.length; return true; }
      return false;
    }

    if (t.view === 'dialog') {
      if (action === 'back')  { t.view = 'scenarios'; return true; }
      if (action === 'enter') { speakConversation(state); return true; }
      // ↑↓ jumps to previous / next scenario
      if (action === 'up')    { t.scn = (t.scn - 1 + SCENARIOS.length) % SCENARIOS.length; return true; }
      if (action === 'down')  { t.scn = (t.scn + 1) % SCENARIOS.length; return true; }
      // ←→ cycles through languages
      if (action === 'left')  { t.lang = (t.lang - 1 + LANGS.length) % LANGS.length; return true; }
      if (action === 'right') { t.lang = (t.lang + 1) % LANGS.length; return true; }
      return false;
    }

    return false;
  }

  // Number keys 1-9 / 0:
  //  - title view:     1 → phrases, 2 → scenarios
  //  - cats view:      1..9 → cats[0..8], 0 → cats[9]
  //  - scenarios view: 1..N → SCENARIOS[N-1]
  //  - phrases view:   1..8 → speak language N
  //  - dialog view:    1..8 → speak language N
  function digit(state, n) {
    init(state);
    const t = state.travel;
    if (t.view === 'title') {
      if (n === 1) { t.view = 'cats';      return true; }
      if (n === 2) { t.view = 'scenarios'; return true; }
      return false;
    }
    if (t.view === 'cats') {
      const idx = (n === 0) ? 9 : (n - 1);
      if (idx < CATS.length) { t.cat = idx; t.view = 'phrases'; t.phrase = 0; return true; }
      return false;
    }
    if (t.view === 'scenarios') {
      const idx = (n === 0) ? 9 : (n - 1);
      if (idx < SCENARIOS.length) { t.scn = idx; t.view = 'dialog'; t.turn = 0; return true; }
      return false;
    }
    if (t.view === 'phrases') {
      if (n >= 1 && n <= LANGS.length) {
        speakPhrase(curPhrase(state), LANGS[n - 1]);
        return true;
      }
      return false;
    }
    if (t.view === 'dialog') {
      if (n >= 1 && n <= LANGS.length) {
        t.lang = n - 1;
        return true;
      }
      return false;
    }
    return false;
  }

  function speakPhrase(phrase, lang) {
    if (!phrase || !lang) return;
    const txt = phrase[lang.id];
    if (!txt) return;
    if (typeof window.OMNI_SPEAK === 'function') {
      window.OMNI_SPEAK(txt, lang.code);
    }
  }

  // Play every turn of the current scenario in the active language,
  // back-to-back. Falls back to one-shot speak() if the host doesn't
  // expose a sequence bridge.
  function speakConversation(state) {
    const scn  = curScn(state);
    const lang = LANGS[clamp(state.travel.lang, 0, LANGS.length - 1)];
    const items = scn.turns
      .map(t => ({ text: t[lang.id] || '', lang: lang.code }))
      .filter(it => it.text);
    if (!items.length) return;
    if (typeof window.OMNI_SPEAK_SEQ === 'function') {
      window.OMNI_SPEAK_SEQ(items);
    } else if (typeof window.OMNI_SPEAK === 'function') {
      window.OMNI_SPEAK(items[0].text, items[0].lang);
    }
  }

  // Click delegates
  function pickCat(state, i) {
    init(state);
    const idx = +i;
    if (Number.isFinite(idx) && idx >= 0 && idx < CATS.length) {
      state.travel.cat = idx;
      state.travel.view = 'phrases';
      state.travel.phrase = 0;
    }
  }

  function pickEnter(state) {
    init(state);
    if (state.travel.view === 'title') state.travel.view = 'cats';
  }

  function pickHub(state, which) {
    init(state);
    if (which === 'phrases')   { state.travel.view = 'cats'; }
    if (which === 'scenarios') { state.travel.view = 'scenarios'; }
  }

  function pickScn(state, i) {
    init(state);
    const idx = +i;
    if (Number.isFinite(idx) && idx >= 0 && idx < SCENARIOS.length) {
      state.travel.scn = idx;
      state.travel.view = 'dialog';
      state.travel.turn = 0;
    }
  }

  function pickLang(state, i) {
    init(state);
    const idx = +i;
    if (Number.isFinite(idx) && idx >= 0 && idx < LANGS.length) {
      state.travel.lang = idx;
    }
  }

  function pickPlayAll(state) {
    init(state);
    if (state.travel.view === 'dialog') speakConversation(state);
  }

  // Context-aware "back to section list":
  //   from phrases  → cats
  //   from dialog   → scenarios
  //   from cats / scenarios → title (the hub)
  function pickMenu(state) {
    init(state);
    const v = state.travel.view;
    if (v === 'phrases')   { state.travel.view = 'cats'; return; }
    if (v === 'dialog')    { state.travel.view = 'scenarios'; return; }
    if (v === 'cats' || v === 'scenarios') { state.travel.view = 'title'; return; }
  }

  // Always go straight to the title / hub regardless of current view.
  function pickHome(state) {
    init(state);
    state.travel.view = 'title';
  }

  function pickPrev(state) {
    init(state);
    const v = state.travel.view;
    if (v === 'phrases') {
      const list = curPhrases(state);
      state.travel.phrase = (state.travel.phrase - 1 + list.length) % list.length;
    } else if (v === 'dialog') {
      const turns = curTurns(state);
      state.travel.turn = (state.travel.turn - 1 + turns.length) % turns.length;
    }
  }

  function pickNext(state) {
    init(state);
    const v = state.travel.view;
    if (v === 'phrases') {
      const list = curPhrases(state);
      state.travel.phrase = (state.travel.phrase + 1) % list.length;
    } else if (v === 'dialog') {
      const turns = curTurns(state);
      state.travel.turn = (state.travel.turn + 1) % turns.length;
    }
  }

  function cancel(state) {
    init(state);
    const t = state.travel;
    if (t.view === 'phrases')   { t.view = 'cats';      return true; }
    if (t.view === 'dialog')    { t.view = 'scenarios'; return true; }
    if (t.view === 'cats')      { t.view = 'title';     return true; }
    if (t.view === 'scenarios') { t.view = 'title';     return true; }
    return false;     // title: host returns to IC chooser
  }

  function restart(state) {
    state.travel = { _v: SCHEMA, view: 'title', cat: 0, phrase: 0, scn: 0, turn: 0, lang: 0 };
  }

  /* =========================================================
   *  Export
   * ========================================================= */
  window.TRAVEL = {
    LANGS, CATS, SCENARIOS,
    init, render, onKey, digit,
    pickCat, pickScn, pickLang, pickPlayAll, pickEnter, pickHub, pickHome, pickMenu, pickPrev, pickNext, cancel, restart
  };
})();
