const courseBlueprints = [
  {
    id: 'general-english-a1',
    title: 'General English A1',
    level: 'Beginner',
    cefr: 'A1',
    language: 'English',
    category: 'Conversation',
    description: 'Build everyday English confidence with practical greetings, routines, travel language and simple social conversation.',
    modules: [
      { title: 'Hello and Me', topic: 'introductions', units: ['Introducing Yourself', 'Everyday Life'] },
      { title: 'People and Places', topic: 'daily life', units: ['Family and Home', 'Around Town'] },
      { title: 'Food and Shopping', topic: 'shopping', units: ['Food and Drink', 'Buying and Paying'] },
      { title: 'Time and Routines', topic: 'routines', units: ['Daily Routines', 'Time and Schedules'] },
      { title: 'Past and Future Basics', topic: 'planning', units: ['Last Weekend', 'Next Week'] },
    ],
  },
  {
    id: 'general-english-a2',
    title: 'General English A2',
    level: 'Intermediate',
    cefr: 'A2',
    language: 'English',
    category: 'Grammar',
    description: 'Expand to real-world communication, travel, past events, routines, opinions and everyday problem solving.',
    modules: [
      { title: 'Daily Life and Habits', topic: 'routine', units: ['Routines', 'Past Habits'] },
      { title: 'Travel and Services', topic: 'travel', units: ['Travel Plans', 'Public Services'] },
      { title: 'Food and Health', topic: 'wellbeing', units: ['Healthy Choices', 'At the Clinic'] },
      { title: 'Work and Study', topic: 'work', units: ['Jobs and Tasks', 'Study Life'] },
      { title: 'Talking About the Future', topic: 'planning', units: ['Plans and Goals', 'Future Predictions'] },
    ],
  },
  {
    id: 'general-english-b1',
    title: 'General English B1',
    level: 'Intermediate',
    cefr: 'B1',
    language: 'English',
    category: 'Reading',
    description: 'Improve clear communication, give opinions, describe experiences and move from basic fluency to confident everyday English.',
    modules: [
      { title: 'Life Experience', topic: 'experience', units: ['Past Experiences', 'Achievements'] },
      { title: 'Work and Responsibilities', topic: 'work', units: ['Teamwork', 'Problems at Work'] },
      { title: 'Travel and Culture', topic: 'travel', units: ['City Life', 'Cultural Habits'] },
      { title: 'Media and Opinions', topic: 'society', units: ['News and Views', 'Arguments and Debate'] },
      { title: 'Planning and Problem Solving', topic: 'problem solving', units: ['Projects', 'Solutions'] },
    ],
  },
  {
    id: 'general-english-b2',
    title: 'General English B2',
    level: 'Advanced',
    cefr: 'B2',
    language: 'English',
    category: 'Writing',
    description: 'Reach high-intermediate fluency through complex grammar, negotiation, argumentation, and professional communication.',
    modules: [
      { title: 'Professional Communication', topic: 'work', units: ['Meetings', 'Email Writing'] },
      { title: 'Debate and Analysis', topic: 'ideas', units: ['Presenting Ideas', 'Counterarguments'] },
      { title: 'Leadership and Change', topic: 'leadership', units: ['Management Skills', 'Organisational Change'] },
      { title: 'Technology and Society', topic: 'digital life', units: ['Digital Trends', 'Ethics and Media'] },
      { title: 'Advanced Language Control', topic: 'precision', units: ['Nuance and Accuracy', 'Formal and Informal Style'] },
    ],
  },
  {
    id: 'business-english',
    title: 'Business English',
    level: 'Intermediate',
    cefr: 'B1',
    language: 'English',
    category: 'Conversation',
    description: 'Develop practical business English for meetings, negotiations, emails, presentations and international teams.',
    modules: [
      { title: 'Workplace Basics', topic: 'business life', units: ['Introductions', 'Workplace Communication'] },
      { title: 'Meetings', topic: 'meetings', units: ['Running Meetings', 'Following Up'] },
      { title: 'Emails and Reports', topic: 'writing', units: ['Professional Email', 'Reports and Updates'] },
      { title: 'Presentations', topic: 'pitching', units: ['Short Talks', 'Q&A Handling'] },
      { title: 'Negotiation', topic: 'sales', units: ['Price and Terms', 'Conflict and Agreement'] },
    ],
  },
  {
    id: 'english-speaking',
    title: 'English Speaking',
    level: 'Intermediate',
    cefr: 'A2',
    language: 'English',
    category: 'Conversation',
    description: 'Speak with confidence through short prompts, storytelling, roleplay, interview practice, and everyday communication.',
    modules: [
      { title: 'Introductions and Small Talk', topic: 'social talk', units: ['Greetings', 'Conversation Flow'] },
      { title: 'Daily Stories', topic: 'storytelling', units: ['My Day', 'Memories'] },
      { title: 'Travel and Culture', topic: 'travel', units: ['Tourist Talk', 'Planning a Trip'] },
      { title: 'Work and Problems', topic: 'professional life', units: ['Work Conversations', 'Problem Solving'] },
      { title: 'Viewpoints and Debate', topic: 'opinion', units: ['Opinions', 'Debating Ideas'] },
    ],
  },
  {
    id: 'english-for-kids',
    title: 'English for Kids',
    level: 'Beginner',
    cefr: 'A1',
    language: 'English',
    category: 'Vocabulary',
    description: 'Friendly, age-appropriate English for children with family, school, animals, nature and everyday activities.',
    modules: [
      { title: 'My World', topic: 'children', units: ['Me and My Family', 'My Home'] },
      { title: 'School and Friends', topic: 'school', units: ['School Life', 'Friends and Feelings'] },
      { title: 'Food and Animals', topic: 'animals', units: ['Foods I Like', 'Animals We Know'] },
      { title: 'Hobbies and Nature', topic: 'play', units: ['Sports and Fun', 'Nature Walks'] },
      { title: 'Stories and Senses', topic: 'imagination', units: ['Story Time', 'My Five Senses'] },
    ],
  },
]

const baseVocabulary = [
  'achievement','active','address','adventure','afternoon','agreement','alert','amazing','analyze','answer','apartment','appointment','arrive','assistant','attention','average','balance','basic','beginner','benefit','bicycle','booking','breeze','budget','business','calendar','camera','career','careful','celebrate','chance','change','charge','chat','check','choice','clean','clear','climate','close','collect','comfortable','comment','community','complete','concern','confident','connect','continue','control','conversation','correct','create','culture','daily','danger','debate','decide','describe','detail','develop','dialogue','diet','difficult','direct','discover','discussion','document','during','easy','effect','efficient','email','emotion','energy','enjoy','entry','environment','equal','essay','event','everyday','example','exercise','expect','experience','explain','family','favorite','feeling','field','finish','flexible','flower','focus','follow','format','free','friend','future','gather','general','goal','grade','grammar','group','growth','guide','habit','happen','health','helpful','history','home','honest','hour','idea','improve','include','independent','industry','introduce','invite','issue','journey','judge','key','kind','language','large','learn','lesson','letter','level','limit','listen','local','location','luck','manage','market','match','meaning','measure','member','method','minute','moment','morning','music','native','natural','nearly','necessary','neighbor','note','number','object','occasion','opinion','order','organize','original','particular','partner','path','peace','people','percent','perfect','period','person','phrase','picture','plan','point','policy','positive','practice','prepare','present','problem','process','product','progress','project','promise','quick','quiet','question','raise','rate','reason','record','reduce','reference','reflect','region','regular','relax','remain','remember','report','request','result','review','risk','routine','schedule','school','science','season','second','section','service','share','signal','simple','skill','social','solution','speak','special','speech','speed','spend','stability','standard','start','statement','station','step','story','strategy','strength','study','success','suggest','support','sustain','system','table','talk','target','teacher','technique','temple','text','thank','thought','ticket','topic','travel','treat','trend','understand','urgent','useful','vacation','value','variety','verb','version','village','voice','visit','vocabulary','wait','walk','watch','weather','week','welcome','window','word','work','world','write','year','young','youth','zone']

const topicClusters = {
  greetings: ['hello','hi','good morning','good afternoon','nice to meet you','please','thanks'],
  travel: ['ticket','passport','hotel','train','airport','map','delay','luggage'],
  family: ['mother','father','sister','brother','grandmother','grandfather','cousin','friend'],
  food: ['breakfast','lunch','dinner','juice','bread','fruit','vegetable','meal'],
  work: ['meeting','project','team','deadline','report','client','office','document'],
  school: ['student','teacher','lesson','classroom','homework','library','grade','exam'],
  feelings: ['happy','calm','nervous','excited','tired','confident','worried','proud'],
  nature: ['river','forest','mountain','garden','sunrise','wind','cloud','rain'],
  business: ['contract','budget','customer','sales','invoice','target','performance','strategy'],
  technology: ['device','software','signal','screen','battery','button','camera','network'],
  // Keyed by the exact `topic` string used on each course blueprint's modules (below), so
  // buildLesson can pick vocabulary that actually matches what each lesson is about instead
  // of a fixed CEFR-wide list repeated on every lesson regardless of topic.
  introductions: ['name','meet','hello','nice','from','live','age','favorite'],
  'daily life': ['wake up','morning','evening','breakfast','sleep','routine','home','usually'],
  shopping: ['buy','price','shop','pay','money','store','choose','receipt'],
  routines: ['everyday','always','often','schedule','wake up','brush','walk','habit'],
  planning: ['plan','future','tomorrow','weekend','goal','arrange','schedule','hope'],
  routine: ['habit','everyday','usually','morning','evening','weekday','always','routine'],
  wellbeing: ['health','healthy','exercise','sleep','doctor','diet','relax','energy'],
  experience: ['achievement','memory','past','learned','journey','challenge','grow','milestone'],
  society: ['news','community','culture','opinion','issue','public','media','change'],
  'problem solving': ['solution','challenge','decide','solve','option','plan','resolve','outcome'],
  ideas: ['concept','suggest','propose','insight','perspective','argument','viewpoint','innovate'],
  leadership: ['manage','lead','decision','responsibility','motivate','delegate','vision','team'],
  'digital life': ['device','online','app','network','data','digital','screen','update'],
  precision: ['accurate','detail','exact','clarify','nuance','formal','informal','tone'],
  'business life': ['office','colleague','workplace','career','role','company','client','task'],
  meetings: ['agenda','discuss','schedule','attend','minutes','follow-up','decision','participant'],
  writing: ['email','report','draft','format','subject','message','reply','attachment'],
  pitching: ['presentation','audience','slide','pitch','persuade','summary','question','confidence'],
  sales: ['price','deal','customer','offer','negotiate','discount','contract','agreement'],
  'social talk': ['chat','weather','weekend','hobby','small talk','friendly','topic','conversation'],
  storytelling: ['memory','once','happened','story','remember','exciting','funny','adventure'],
  'professional life': ['job','colleague','task','office','career','meeting','deadline','role'],
  opinion: ['think','believe','agree','disagree','opinion','perspective','prefer','view'],
  children: ['family','home','mother','father','brother','sister','pet','love'],
  animals: ['dog','cat','bird','fish','lion','elephant','rabbit','farm'],
  play: ['game','fun','toy','ball','sport','play','friend','outside'],
  imagination: ['story','dream','magic','pretend','adventure','fairy tale','wonder','create'],
}

const wordBank = [...new Set([
  ...baseVocabulary,
  ...Object.values(topicClusters).flat(),
])]

// Real English -> Uzbek translations for every word in wordBank, keyed by the exact
// lowercase word/phrase. A word missing here falls back to itself (see buildTranslation
// below) rather than a "uz-123" placeholder, so a translation gap degrades gracefully
// instead of showing obviously-fake text.
const uzTranslations = {
  "achievement": "yutuq", "active": "faol", "address": "manzil", "adventure": "sarguzasht", "afternoon": "tushdan keyin", "agreement": "kelishuv", "alert": "ogohlantirish", "amazing": "ajoyib", "analyze": "tahlil qilmoq", "answer": "javob", "apartment": "kvartira", "appointment": "uchrashuv", "arrive": "yetib kelmoq", "assistant": "yordamchi", "attention": "e'tibor", "average": "o'rtacha", "balance": "muvozanat", "basic": "asosiy", "beginner": "boshlovchi", "benefit": "foyda", "bicycle": "velosiped", "booking": "bron qilish", "breeze": "shabada", "budget": "byudjet", "business": "biznes", "calendar": "kalendar", "camera": "kamera", "career": "karyera", "careful": "ehtiyotkor", "celebrate": "nishonlamoq", "chance": "imkoniyat", "change": "o'zgarish", "charge": "zaryadlamoq", "chat": "gaplashish", "check": "tekshirmoq", "choice": "tanlov", "clean": "toza", "clear": "aniq", "climate": "iqlim", "close": "yopmoq", "collect": "yig'moq", "comfortable": "qulay", "comment": "izoh", "community": "hamjamiyat", "complete": "to'liq", "concern": "tashvish", "confident": "ishonchli", "connect": "bog'lamoq", "continue": "davom etmoq", "control": "nazorat", "conversation": "suhbat", "correct": "to'g'ri", "create": "yaratmoq", "culture": "madaniyat", "daily": "kunlik", "danger": "xavf", "debate": "munozara", "decide": "qaror qilmoq", "describe": "tasvirlamoq", "detail": "tafsilot", "develop": "rivojlantirmoq", "dialogue": "dialog", "diet": "parhez", "difficult": "qiyin", "direct": "to'g'ridan-to'g'ri", "discover": "kashf etmoq", "discussion": "muhokama", "document": "hujjat", "during": "davomida", "easy": "oson", "effect": "ta'sir", "efficient": "samarali", "email": "elektron pochta", "emotion": "hissiyot", "energy": "energiya", "enjoy": "zavqlanmoq", "entry": "kirish", "environment": "atrof-muhit", "equal": "teng", "essay": "insho", "event": "tadbir", "everyday": "har kunlik", "example": "misol", "exercise": "mashq", "expect": "kutmoq", "experience": "tajriba", "explain": "tushuntirmoq", "family": "oila", "favorite": "sevimli", "feeling": "tuyg'u", "field": "soha", "finish": "tugatmoq", "flexible": "moslashuvchan", "flower": "gul", "focus": "diqqat", "follow": "ergashmoq", "format": "format", "free": "bepul", "friend": "do'st", "future": "kelajak", "gather": "to'planmoq", "general": "umumiy", "goal": "maqsad", "grade": "baho", "grammar": "grammatika", "group": "guruh", "growth": "o'sish", "guide": "qo'llanma", "habit": "odat", "happen": "sodir bo'lmoq", "health": "sog'liq", "helpful": "foydali", "history": "tarix", "home": "uy", "honest": "halol", "hour": "soat", "idea": "g'oya", "improve": "yaxshilamoq", "include": "kiritmoq", "independent": "mustaqil", "industry": "sanoat", "introduce": "tanishtirmoq", "invite": "taklif qilmoq", "issue": "masala", "journey": "sayohat", "judge": "baholamoq", "key": "kalit", "kind": "mehribon", "language": "til", "large": "katta", "learn": "o'rganmoq", "lesson": "dars", "letter": "xat", "level": "daraja", "limit": "chegara", "listen": "tinglamoq", "local": "mahalliy", "location": "joylashuv", "luck": "omad", "manage": "boshqarmoq", "market": "bozor", "match": "mos kelmoq", "meaning": "ma'no", "measure": "o'lchamoq", "member": "a'zo", "method": "usul", "minute": "daqiqa", "moment": "lahza", "morning": "ertalab", "music": "musiqa", "native": "tug'ma", "natural": "tabiiy", "nearly": "deyarli", "necessary": "zarur", "neighbor": "qo'shni", "note": "eslatma", "number": "raqam", "object": "narsa", "occasion": "marosim", "opinion": "fikr", "order": "tartib", "organize": "tashkil qilmoq", "original": "asl", "particular": "alohida", "partner": "hamkor", "path": "yo'l", "peace": "tinchlik", "people": "odamlar", "percent": "foiz", "perfect": "mukammal", "period": "davr", "person": "inson", "phrase": "ibora", "picture": "rasm", "plan": "reja", "point": "nuqta", "policy": "siyosat", "positive": "ijobiy", "practice": "amaliyot", "prepare": "tayyorlamoq", "present": "taqdim etmoq", "problem": "muammo", "process": "jarayon", "product": "mahsulot", "progress": "rivojlanish", "project": "loyiha", "promise": "va'da", "quick": "tez", "quiet": "jim", "question": "savol", "raise": "ko'tarmoq", "rate": "sur'at", "reason": "sabab", "record": "yozib olmoq", "reduce": "kamaytirmoq", "reference": "manba", "reflect": "o'ylab ko'rmoq", "region": "hudud", "regular": "muntazam", "relax": "dam olmoq", "remain": "qolmoq", "remember": "eslamoq", "report": "hisobot", "request": "so'rov", "result": "natija", "review": "sharh", "risk": "tavakkal", "routine": "kundalik tartib", "schedule": "jadval", "school": "maktab", "science": "fan", "season": "fasl", "second": "soniya", "section": "bo'lim", "service": "xizmat", "share": "ulashmoq", "signal": "signal", "simple": "oddiy", "skill": "ko'nikma", "social": "ijtimoiy", "solution": "yechim", "speak": "gapirmoq", "special": "maxsus", "speech": "nutq", "speed": "tezlik", "spend": "sarflamoq", "stability": "barqarorlik", "standard": "standart", "start": "boshlamoq", "statement": "bayonot", "station": "stansiya", "step": "qadam", "story": "hikoya", "strategy": "strategiya", "strength": "kuch", "study": "o'qimoq", "success": "muvaffaqiyat", "suggest": "tavsiya qilmoq", "support": "qo'llab-quvvatlamoq", "sustain": "saqlab turmoq", "system": "tizim", "table": "stol", "talk": "gaplashmoq", "target": "nishon", "teacher": "o'qituvchi", "technique": "texnika", "temple": "ibodatxona", "text": "matn", "thank": "rahmat aytmoq", "thought": "o'y", "ticket": "chipta", "topic": "mavzu", "travel": "sayohat qilmoq", "treat": "muomala qilmoq", "trend": "tendensiya", "understand": "tushunmoq", "urgent": "shoshilinch", "useful": "kerakli", "vacation": "ta'til", "value": "qiymat", "variety": "xilma-xillik", "verb": "fe'l", "version": "versiya", "village": "qishloq", "voice": "ovoz", "visit": "tashrif buyurmoq", "vocabulary": "lug'at", "wait": "kutib turmoq", "walk": "yurmoq", "watch": "tomosha qilmoq", "weather": "ob-havo", "week": "hafta", "welcome": "xush kelibsiz", "window": "deraza", "word": "so'z", "work": "ish", "world": "dunyo", "write": "yozmoq", "year": "yil", "young": "yosh", "youth": "yoshlik", "zone": "zona",
  "hello": "salom", "hi": "salom", "good morning": "xayrli tong", "good afternoon": "xayrli kun", "nice to meet you": "tanishganimdan xursandman", "please": "iltimos", "thanks": "rahmat",
  "passport": "pasport", "hotel": "mehmonxona", "train": "poyezd", "airport": "aeroport", "map": "xarita", "delay": "kechikish", "luggage": "bagaj",
  "mother": "ona", "father": "ota", "sister": "opa-singil", "brother": "aka-uka", "grandmother": "buvi", "grandfather": "bobo", "cousin": "amakivachcha",
  "breakfast": "nonushta", "lunch": "tushlik", "dinner": "kechki ovqat", "juice": "sharbat", "bread": "non", "fruit": "meva", "vegetable": "sabzavot", "meal": "ovqat",
  "meeting": "yig'ilish", "team": "jamoa", "deadline": "muddat", "client": "mijoz", "office": "ofis",
  "student": "o'quvchi", "classroom": "sinf xonasi", "homework": "uy vazifasi", "library": "kutubxona", "exam": "imtihon",
  "happy": "baxtli", "calm": "xotirjam", "nervous": "asabiy", "excited": "hayajonlangan", "tired": "charchagan", "worried": "xavotirli", "proud": "g'ururli",
  "river": "daryo", "forest": "o'rmon", "mountain": "tog'", "garden": "bog'", "sunrise": "quyosh chiqishi", "wind": "shamol", "cloud": "bulut", "rain": "yomg'ir",
  "contract": "shartnoma", "customer": "xaridor", "sales": "sotuv", "invoice": "hisob-faktura", "performance": "samaradorlik",
  "device": "qurilma", "software": "dastur", "screen": "ekran", "battery": "batareya", "button": "tugma", "network": "tarmoq",
  // Words used in lessonPatterns[cefr].vocabulary below that don't already appear in
  // baseVocabulary/topicClusters above.
  "name": "ism", "country": "mamlakat", "coffee": "qahva", "time": "vaqt", "healthy": "sog'lom",
  "responsibility": "mas'uliyat", "media": "ommaviy axborot vositalari", "analysis": "tahlil",
  "negotiate": "muzokara olib bormoq", "evidence": "dalil", "framework": "asos", "structure": "tuzilma",
  "initiative": "tashabbus", "proposal": "taklif", "resilience": "chidamlilik", "priority": "ustuvorlik",
  "delivery": "yetkazib berish",
  // Added for the per-topic vocabulary clusters above, so a lesson's own topic words get a
  // real translation instead of silently falling back to showing the English word again.
  "meet": "uchrashmoq", "nice": "yoqimli", "from": "-dan", "live": "yashamoq", "age": "yosh",
  "wake up": "uyg'onmoq", "evening": "kechqurun", "sleep": "uxlamoq", "usually": "odatda",
  "buy": "sotib olmoq", "price": "narx", "shop": "do'kon", "pay": "to'lamoq", "money": "pul",
  "store": "do'kon", "choose": "tanlamoq", "receipt": "kvitansiya", "always": "doim", "often": "tez-tez",
  "brush": "cho'tkalamoq", "tomorrow": "ertaga", "weekend": "dam olish kunlari", "arrange": "tashkil qilmoq",
  "hope": "umid qilmoq", "weekday": "ish kuni", "doctor": "shifokor", "memory": "xotira", "past": "o'tmish",
  "learned": "o'rgangan", "challenge": "qiyinchilik", "grow": "o'smoq", "milestone": "muhim bosqich",
  "news": "yangilik", "public": "jamoat", "solve": "hal qilmoq", "option": "variant", "resolve": "hal qilmoq",
  "outcome": "natija", "concept": "tushuncha", "propose": "taklif qilmoq", "insight": "chuqur fikr",
  "perspective": "nuqtai nazar", "argument": "bahs", "viewpoint": "qarash", "innovate": "yangilik kiritmoq",
  "lead": "yetaklamoq", "decision": "qaror", "motivate": "rag'batlantirmoq", "delegate": "vakolat bermoq",
  "vision": "tasavvur", "online": "onlayn", "app": "ilova", "data": "ma'lumot", "digital": "raqamli",
  "update": "yangilamoq", "accurate": "aniq", "exact": "to'g'ri", "clarify": "aniqlashtirmoq",
  "nuance": "nozik farq", "formal": "rasmiy", "informal": "norasmiy", "tone": "ohang",
  "colleague": "hamkasb", "workplace": "ish joyi", "role": "rol", "company": "kompaniya", "task": "vazifa",
  "agenda": "kun tartibi", "discuss": "muhokama qilmoq", "attend": "qatnashmoq", "minutes": "bayonnoma",
  "follow-up": "keyingi qadam", "participant": "ishtirokchi", "draft": "qoralama", "subject": "sarlavha",
  "message": "xabar", "reply": "javob bermoq", "attachment": "ilova", "presentation": "taqdimot",
  "audience": "auditoriya", "slide": "slayd", "pitch": "taklif qilmoq", "persuade": "ishontirmoq",
  "summary": "xulosa", "confidence": "ishonch", "deal": "bitim", "offer": "taklif", "discount": "chegirma",
  "hobby": "sevimli mashg'ulot", "small talk": "yengil suhbat", "friendly": "do'stona", "once": "bir marta",
  "happened": "sodir bo'ldi", "exciting": "hayajonli", "funny": "kulgili", "job": "ish", "think": "o'ylamoq",
  "believe": "ishonmoq", "agree": "rozi bo'lmoq", "disagree": "rozi bo'lmaslik", "prefer": "afzal ko'rmoq",
  "view": "qarash", "pet": "uy hayvoni", "love": "sevgi", "dog": "it", "cat": "mushuk", "bird": "qush",
  "fish": "baliq", "lion": "sher", "elephant": "fil", "rabbit": "quyon", "farm": "ferma", "game": "o'yin",
  "fun": "qiziqarli", "toy": "o'yinchoq", "ball": "to'p", "sport": "sport", "play": "o'ynamoq",
  "outside": "tashqarida", "dream": "orzu", "magic": "sehr", "pretend": "taqlid qilmoq",
  "fairy tale": "ertak", "wonder": "ajablanmoq",
}

const buildTranslation = (word) => uzTranslations[word] || word

const assessmentBank = [
  { level: 'A1', question: 'Choose the correct answer: I ___ from Tashkent.', answer: 'am', options: ['am', 'is', 'are', 'be'], explanation: 'Use am with I.' },
  { level: 'A1', question: 'Complete the sentence: She ___ coffee every morning.', answer: 'drinks', options: ['drink', 'drinks', 'drinking', 'drank'], explanation: 'Third-person singular in the present simple takes -s.' },
  { level: 'A2', question: 'Choose the correct form: We ___ a new house last year.', answer: 'bought', options: ['buy', 'buys', 'bought', 'buying'], explanation: 'Last year tells us the tense is past simple.' },
  { level: 'A2', question: 'Which sentence is correct?', answer: 'Could you help me, please?', options: ['Could you help me, please?', 'Can you to help me?', 'Do you help me kindly?', 'You could help me now.'], explanation: 'Could you... is the polite request structure.' },
  { level: 'B1', question: 'Choose the sentence with the correct conditional form.', answer: 'If I had more time, I would study more.', options: ['If I had more time, I would study more.', 'If I have more time, I would study more.', 'If I would have more time, I studied more.', 'If I had more time, I will study more.'], explanation: 'Second conditional uses if + past simple, would + infinitive.' },
  { level: 'B1', question: 'Which is the best reported speech version?', answer: 'She said that she was tired.', options: ['She said that she was tired.', 'She said that she is tired.', 'She said that I was tired.', 'She said tired.'], explanation: 'Backshift the tense in reported speech.' },
  { level: 'B2', question: 'Choose the most appropriate sentence.', answer: 'By the time we arrived, the meeting had already started.', options: ['By the time we arrived, the meeting had already started.', 'By the time we arrived, the meeting already started.', 'By the time we arrived, the meeting has started.', 'By the time we arrived, the meeting starts.'], explanation: 'Past perfect shows that the meeting started before arrival.' },
  { level: 'B2', question: 'Which sentence is most formal?', answer: 'We would appreciate your prompt response.', options: ['We would appreciate your prompt response.', 'Can you reply soon?', 'Hey, get back to us.', 'Please respond quick.'], explanation: 'Formal business English uses more polite, indirect phrasing.' },
]

const createExercise = ({ title, type, question, options, answer, explanation, difficulty, points, lessonId }) => ({
  id: `${lessonId}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
  title,
  type,
  question,
  options,
  // multiple_choice is graded against an OPTION INDEX (exerciseController.gradeAnswer, and
  // the placement-test question bank already stores correctAnswer this way) - storing the
  // answer's text here instead meant every real submission (the frontend always sends the
  // selected option's index) was graded incorrect no matter what the student picked. Only
  // multiple_choice needs this: fill_blank is matched by normalized text, and speaking's
  // "correctAnswer" is just the prompt echoed back, not something graded by equality.
  correctAnswer: type === 'multiple_choice' && Array.isArray(options) ? options.indexOf(answer) : answer,
  explanation,
  difficulty,
  points,
})

const lessonPatterns = {
  A1: {
    vocabulary: ['hello', 'good morning', 'name', 'country', 'work', 'family', 'home', 'breakfast', 'coffee', 'time'],
    grammar: ['I am', 'Present simple', 'There is / There are', 'Possessive adjectives'],
    speakingPrompt: 'Introduce yourself in three sentences.',
    mcQuestions: [
      { question: 'Choose the correct sentence.', options: ['I am a student.', 'I is a student.', 'I are a student.', 'I be a student.'], answer: 'I am a student.', explanation: '"Am" is the correct form of "to be" with "I".' },
      { question: 'Choose the correct sentence.', options: ['She works in a bank.', 'She working in a bank.', 'She work in a bank.', 'She is work in a bank.'], answer: 'She works in a bank.', explanation: 'The present simple adds -s for he/she/it.' },
      { question: 'Choose the correct sentence.', options: ['There are three books on the table.', 'There is three books on the table.', 'There be three books on the table.', 'Three books there are on the table.'], answer: 'There are three books on the table.', explanation: '"Are" agrees with the plural noun "books".' },
      { question: 'Choose the correct sentence.', options: ['This is my brother.', 'This is me brother.', 'This is I brother.', 'This is mine brother.'], answer: 'This is my brother.', explanation: '"My" is the possessive adjective form.' },
    ],
    fillBlanks: [
      { sentence: '___, how are you today?', answer: 'Hello' },
      { sentence: '___! Did you sleep well?', answer: 'Good morning' },
      { sentence: 'My ___ is Aziz.', answer: 'name' },
      { sentence: 'Uzbekistan is a beautiful ___.', answer: 'country' },
      { sentence: 'I go to ___ every day at nine.', answer: 'work' },
      { sentence: 'I love spending time with my ___.', answer: 'family' },
      { sentence: "Let's go ___ after class.", answer: 'home' },
      { sentence: 'I always eat ___ before school.', answer: 'breakfast' },
      { sentence: 'Would you like a cup of ___?', answer: 'coffee' },
      { sentence: 'What ___ is it now?', answer: 'time' },
    ],
  },
  A2: {
    vocabulary: ['habit', 'travel', 'schedule', 'healthy', 'service', 'ticket', 'plan', 'future', 'choice', 'review'],
    grammar: ['Past simple', 'Present perfect', 'Comparatives', 'Modal verbs'],
    speakingPrompt: 'Talk about your last weekend or your plans for next week.',
    mcQuestions: [
      { question: 'Choose the correct sentence.', options: ['We visited Samarkand last year.', 'We visit Samarkand last year.', 'We visiting Samarkand last year.', 'We have visit Samarkand last year.'], answer: 'We visited Samarkand last year.', explanation: '"Last year" signals the past simple.' },
      { question: 'Choose the correct sentence.', options: ['I have finished my homework.', 'I have finish my homework.', 'I finished have my homework.', 'I has finished my homework.'], answer: 'I have finished my homework.', explanation: 'Present perfect uses have/has + past participle.' },
      { question: 'Choose the correct sentence.', options: ['This book is more interesting than that one.', 'This book is more interesting that one.', 'This book is interestinger than that one.', 'This book is most interesting than that one.'], answer: 'This book is more interesting than that one.', explanation: 'Longer adjectives use "more ... than".' },
      { question: 'Choose the correct sentence.', options: ['You should study every day.', 'You should to study every day.', 'You should studying every day.', 'You should studies every day.'], answer: 'You should study every day.', explanation: 'Modal verbs like "should" are followed by the base verb.' },
    ],
    fillBlanks: [
      { sentence: 'Reading before bed is a good ___.', answer: 'habit' },
      { sentence: 'We love to ___ to new countries.', answer: 'travel' },
      { sentence: 'Please check the train ___ before you leave.', answer: 'schedule' },
      { sentence: 'Eating vegetables every day is ___.', answer: 'healthy' },
      { sentence: 'The hotel ___ was excellent.', answer: 'service' },
      { sentence: 'I bought a ___ for the concert.', answer: 'ticket' },
      { sentence: 'What is your ___ for the weekend?', answer: 'plan' },
      { sentence: 'She is optimistic about the ___.', answer: 'future' },
      { sentence: 'You made the right ___.', answer: 'choice' },
      { sentence: 'Please ___ your answers before submitting.', answer: 'review' },
    ],
  },
  B1: {
    vocabulary: ['achievement', 'responsibility', 'debate', 'process', 'opinion', 'issue', 'media', 'strategy', 'promise', 'analysis'],
    grammar: ['Conditionals', 'Reported speech', 'Relative clauses', 'Passive overview'],
    speakingPrompt: 'Give a short explanation of a problem and a solution.',
    mcQuestions: [
      { question: 'Choose the correct sentence.', options: ['If I had more time, I would travel more.', 'If I have more time, I would travel more.', 'If I would have more time, I traveled more.', 'If I had more time, I will travel more.'], answer: 'If I had more time, I would travel more.', explanation: 'Second conditional: if + past simple, would + base verb.' },
      { question: 'Choose the correct sentence.', options: ['She said that she was tired.', 'She said that she is tired.', 'She said that I was tired.', 'She said tired.'], answer: 'She said that she was tired.', explanation: 'Reported speech shifts the tense back one step.' },
      { question: 'Choose the correct sentence.', options: ['The man who called you is my uncle.', 'The man which called you is my uncle.', 'The man who calling you is my uncle.', 'The man whose called you is my uncle.'], answer: 'The man who called you is my uncle.', explanation: '"Who" introduces a relative clause about a person.' },
      { question: 'Choose the correct sentence.', options: ['The report was written by the team.', 'The report was write by the team.', 'The report is written by the team yesterday.', 'The report wrote by the team.'], answer: 'The report was written by the team.', explanation: 'Passive past: was/were + past participle.' },
    ],
    fillBlanks: [
      { sentence: 'Winning the award was a great ___ for the team.', answer: 'achievement' },
      { sentence: 'Taking care of the project is your ___ now.', answer: 'responsibility' },
      { sentence: 'The class had a lively ___ about climate change.', answer: 'debate' },
      { sentence: 'Learning a language is a gradual ___.', answer: 'process' },
      { sentence: 'In my ___, this is the best solution.', answer: 'opinion' },
      { sentence: 'We need to solve this ___ quickly.', answer: 'issue' },
      { sentence: 'Social ___ has changed how people communicate.', answer: 'media' },
      { sentence: 'Our marketing ___ worked very well.', answer: 'strategy' },
      { sentence: 'He made a ___ to call every day.', answer: 'promise' },
      { sentence: 'The report includes a detailed ___ of the data.', answer: 'analysis' },
    ],
  },
  B2: {
    vocabulary: ['negotiate', 'evidence', 'framework', 'structure', 'initiative', 'proposal', 'analysis', 'resilience', 'priority', 'delivery'],
    grammar: ['Advanced conditionals', 'Passive reporting', 'Complex clauses', 'Nuance and register'],
    speakingPrompt: 'Present a solution in a professional meeting.',
    mcQuestions: [
      { question: 'Choose the correct sentence.', options: ['Had I known earlier, I would have helped.', 'If I had known earlier, I help.', 'Had I know earlier, I would have helped.', 'If I have known earlier, I would help.'], answer: 'Had I known earlier, I would have helped.', explanation: 'Inverted third conditional: Had + subject + past participle.' },
      { question: 'Choose the correct sentence.', options: ['It is believed that the plan will succeed.', 'It is believe that the plan will succeed.', 'It believed that the plan will succeed.', 'It is believed the plan will succeed that.'], answer: 'It is believed that the plan will succeed.', explanation: 'Passive reporting: It is believed/said/thought that...' },
      { question: 'Choose the correct sentence.', options: ['Although it was raining, we continued the meeting.', 'Although it was raining, but we continued the meeting.', 'Despite it was raining, we continued the meeting.', 'Although raining, we continued the meeting.'], answer: 'Although it was raining, we continued the meeting.', explanation: '"Although" is not paired with "but" in the same sentence.' },
      { question: 'Choose the most appropriate formal sentence.', options: ['We would appreciate your prompt response.', 'Can you reply soon?', 'Hey, get back to us.', 'Please respond quick.'], answer: 'We would appreciate your prompt response.', explanation: 'Formal business English favours polite, indirect phrasing.' },
    ],
    fillBlanks: [
      { sentence: 'They had to ___ a better price with the supplier.', answer: 'negotiate' },
      { sentence: 'There is strong ___ to support this theory.', answer: 'evidence' },
      { sentence: 'The new policy provides a clear ___ for decision-making.', answer: 'framework' },
      { sentence: 'The essay needs a clearer ___.', answer: 'structure' },
      { sentence: 'She took the ___ to start the new project.', answer: 'initiative' },
      { sentence: 'The committee approved the ___ unanimously.', answer: 'proposal' },
      { sentence: 'A thorough ___ was needed before the merger.', answer: 'analysis' },
      { sentence: 'Her ___ helped her recover quickly from setbacks.', answer: 'resilience' },
      { sentence: 'Safety is our top ___.', answer: 'priority' },
      { sentence: 'The ___ of the package was delayed by two days.', answer: 'delivery' },
    ],
  },
}

const makeExercises = (lessonId, lessonTitle, cefr, orderIndex, speakingPrompt) => {
  const pattern = lessonPatterns[cefr] || lessonPatterns.A1
  const mc = pattern.mcQuestions[orderIndex % pattern.mcQuestions.length]
  const fillBlank = pattern.fillBlanks[orderIndex % pattern.fillBlanks.length]
  const prompt = speakingPrompt || pattern.speakingPrompt
  const base = [
    createExercise({
      title: 'Quick Check',
      type: 'multiple_choice',
      question: mc.question,
      options: mc.options,
      answer: mc.answer,
      explanation: mc.explanation,
      difficulty: 'Easy',
      points: 10,
      lessonId,
    }),
    createExercise({
      title: 'Sentence Builder',
      type: 'fill_blank',
      question: `Complete the sentence: ${fillBlank.sentence}`,
      options: [],
      answer: fillBlank.answer,
      explanation: `"${fillBlank.answer}" fits naturally in this sentence for a ${cefr} learner.`,
      difficulty: 'Medium',
      points: 15,
      lessonId,
    }),
    createExercise({
      title: 'Speaking Task',
      type: 'speaking',
      question: prompt,
      options: [],
      answer: prompt,
      explanation: 'Speak for 30 to 60 seconds and focus on clear structure and useful vocabulary.',
      difficulty: 'Medium',
      points: 20,
      lessonId,
    }),
  ]
  return base
}

// Falls back to the CEFR-wide list only for a topic string with no cluster defined above -
// every topic actually used by a course blueprint has one, so this is a safety net, not the
// normal path.
const resolveLessonVocabulary = (topic, cefr) => topicClusters[topic] || lessonPatterns[cefr]?.vocabulary || []

// Explicit per-lesson video overrides, keyed by the deterministic lessonId buildCourse
// generates (`${blueprintId}-lesson-${order}`). Kept here (not a one-off DB script) so it
// survives reseeding/redeploys like the rest of the generated catalog. Empty by default -
// every entry here is a real, deliberately chosen video, never a placeholder/guessed URL.
const LESSON_MEDIA_OVERRIDES = {
  'general-english-a1-lesson-1': {
    contentType: 'video',
    mediaUrl: 'https://www.youtube.com/watch?v=t26iooY3PAo',
  },
}

const buildLesson = ({ lessonId, title, description, objective, content, level, cefr, order, topic }) => {
  const topicWords = resolveLessonVocabulary(topic, cefr).slice(0, 5)
  // Ties the speaking prompt to this lesson's own topic vocabulary instead of one fixed
  // prompt shared by every lesson at the same CEFR level.
  const speakingPrompt = topicWords.length > 0
    ? `Talk for 30-60 seconds about ${topic}. Try to use words like ${topicWords.slice(0, 3).join(', ')}.`
    : undefined
  const mediaOverride = LESSON_MEDIA_OVERRIDES[lessonId]

  return {
    id: lessonId,
    title,
    description,
    objective,
    content,
    order,
    level,
    duration: 10 + (order % 5) * 5,
    ...(mediaOverride || {}),
    vocabulary: topicWords.map((word) => ({
      word,
      translation: buildTranslation(word),
      pronunciation: word,
      examples: [`I use "${word}" when I talk about ${topic}.`],
    })),
    grammar: lessonPatterns[cefr]?.grammar.slice(0, 2).map((rule) => ({
      rule,
      explanation: `${rule} is a useful pattern for this lesson.`,
      examples: [`Example: ${rule}.`],
    })) || [],
    exercises: makeExercises(lessonId, title, cefr, order, speakingPrompt),
  }
}

const buildCourse = (blueprint) => {
  const moduleList = blueprint.modules.map((module, moduleIndex) => ({
    id: `${blueprint.id}-module-${moduleIndex + 1}`,
    title: module.title,
    topic: module.topic,
    units: module.units.map((unitTitle, unitIndex) => ({
      id: `${blueprint.id}-${moduleIndex + 1}-${unitIndex + 1}`,
      title: unitTitle,
      lessons: Array.from({ length: 3 }, (_, lessonIndex) => {
        const lessonOrder = (moduleIndex * 10) + (unitIndex * 3) + lessonIndex + 1
        const lessonId = `${blueprint.id}-lesson-${lessonOrder}`
        const lessonTitle = `${unitTitle} ${lessonIndex + 1}`
        return buildLesson({
          lessonId,
          title: lessonTitle,
          description: `Practice ${unitTitle.toLowerCase()} with realistic language tasks and guided explanation.`,
          objective: `Learners will improve confidence when discussing ${unitTitle.toLowerCase()}.`,
          content: `This lesson helps learners apply useful language in ${module.topic} contexts. Students will study vocabulary, grammar, speaking prompts and short practice tasks related to ${unitTitle.toLowerCase()}.`,
          level: blueprint.level,
          cefr: blueprint.cefr,
          order: lessonOrder,
          topic: module.topic,
        })
      }),
    })),
  }))

  const lessons = moduleList.flatMap((module) => module.units.flatMap((unit) => unit.lessons))
  return {
    id: blueprint.id,
    contentKey: blueprint.id,
    title: blueprint.title,
    description: blueprint.description,
    language: blueprint.language,
    level: blueprint.level,
    category: blueprint.category,
    estimatedHours: 18 + (blueprint.level === 'Advanced' ? 10 : blueprint.level === 'Intermediate' ? 8 : 5),
    modules: moduleList,
    lessons,
  }
}

const generatedCourses = courseBlueprints.map(buildCourse)

const buildAssessmentSet = () => {
  const questions = []
  const levelOrder = ['A1', 'A2', 'B1', 'B2']
  levelOrder.forEach((level) => {
    for (let i = 0; i < 60; i += 1) {
      const base = assessmentBank[i % assessmentBank.length]
      questions.push({
        id: `${level.toLowerCase()}-question-${i + 1}`,
        level,
        question: `${base.question} (${level} practice)`,
        answer: base.answer,
        options: base.options,
        explanation: base.explanation,
        skill: ['grammar', 'vocabulary', 'reading', 'listening'][i % 4],
      })
    }
  })
  return questions
}

export const buildLinguaNestContentLibrary = () => {
  const vocabulary = wordBank.map((word, index) => ({
    id: `vocab-${index + 1}`,
    word,
    lemma: word,
    pronunciation: word,
    partOfSpeech: ['noun', 'verb', 'adjective', 'adverb'][index % 4],
    uz: buildTranslation(word),
    definition: `"${word}" - a common word for everyday English communication.`,
    example: `Example: I heard the word "${word}" in class today.`,
    topic: ['daily life', 'travel', 'work', 'school', 'food', 'relationships'][index % 6],
    ceFr: ['A1', 'A2', 'B1', 'B2'][index % 4],
    difficulty: ['easy', 'medium', 'hard'][index % 3],
  }))

  const flashcards = vocabulary.slice(0, 180).map((item, index) => ({
    id: `flash-${index + 1}`,
    word: item.word,
    pronunciation: item.pronunciation,
    partOfSpeech: item.partOfSpeech,
    ru: item.ru,
    uz: item.uz,
    example: item.example,
    category: item.topic,
    difficulty: item.difficulty,
  }))

  return {
    courses: generatedCourses,
    modules: generatedCourses.flatMap((course) => course.modules),
    lessons: generatedCourses.flatMap((course) => course.lessons),
    flashcards,
    vocabulary,
    assessments: buildAssessmentSet(),
    metadata: {
      totalCourses: generatedCourses.length,
      totalModules: generatedCourses.flatMap((course) => course.modules).length,
      totalUnits: generatedCourses.flatMap((course) => course.modules.flatMap((module) => module.units)).length,
      totalLessons: generatedCourses.flatMap((course) => course.lessons).length,
      totalExercises: generatedCourses.flatMap((course) => course.lessons.flatMap((lesson) => lesson.exercises)).length,
      totalVocabulary: vocabulary.length,
      totalAssessmentQuestions: buildAssessmentSet().length,
    },
  }
}

export const LINGUANEST_CONTENT_LIBRARY = buildLinguaNestContentLibrary()
