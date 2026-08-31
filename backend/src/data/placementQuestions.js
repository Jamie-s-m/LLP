// Original CEFR-style English placement questions (A1-B2), used to route a new student to a
// starting course level. 8 questions per tier (32 total), spanning three skills - grammar,
// vocabulary, and short reading comprehension - instead of grammar alone, since a single
// grammar-only item type measures a much narrower slice of ability than the CEFR framework
// actually describes. Presented in increasing difficulty; scoring lives in placementController.
export const placementQuestions = [
  // ---- A1 ----
  { order: 1, cefr: 'A1', skill: 'grammar', question: 'I ___ from Uzbekistan.', options: ['is', 'am', 'are', 'be'], correctAnswer: 1 },
  { order: 2, cefr: 'A1', skill: 'grammar', question: 'She ___ a teacher.', options: ['work', 'works', 'working', 'worked'], correctAnswer: 1 },
  { order: 3, cefr: 'A1', skill: 'grammar', question: 'There ___ five books on the table.', options: ['is', 'am', 'are', 'be'], correctAnswer: 2 },
  { order: 4, cefr: 'A1', skill: 'vocabulary', question: 'Which word means the meal you eat in the morning?', options: ['Dinner', 'Lunch', 'Breakfast', 'Snack'], correctAnswer: 2 },
  { order: 5, cefr: 'A1', skill: 'vocabulary', question: 'Which word means a place where you buy food?', options: ['Hospital', 'Market', 'School', 'Bank'], correctAnswer: 1 },
  { order: 6, cefr: 'A1', skill: 'vocabulary', question: 'My father works at a ___. He builds houses.', options: ['hospital', 'construction site', 'library', 'restaurant'], correctAnswer: 1 },
  { order: 7, cefr: 'A1', skill: 'reading', question: 'Aziz wakes up at 7 a.m. He eats breakfast, then goes to work by bus. How does Aziz go to work?', options: ['By car', 'By bus', 'By bike', 'On foot'], correctAnswer: 1 },
  { order: 8, cefr: 'A1', skill: 'reading', question: 'Malika has two brothers and one sister. She is the youngest child in her family. How many brothers does Malika have?', options: ['One', 'Two', 'Three', 'None'], correctAnswer: 1 },

  // ---- A2 ----
  { order: 9, cefr: 'A2', skill: 'grammar', question: 'Yesterday, we ___ to the cinema.', options: ['go', 'goes', 'went', 'going'], correctAnswer: 2 },
  { order: 10, cefr: 'A2', skill: 'grammar', question: 'This exercise is ___ than the last one.', options: ['easy', 'easier', 'easiest', 'more easy'], correctAnswer: 1 },
  { order: 11, cefr: 'A2', skill: 'grammar', question: 'Can you tell me ___ the station is?', options: ['where', 'what', 'when', 'who'], correctAnswer: 0 },
  { order: 12, cefr: 'A2', skill: 'vocabulary', question: "If something is 'affordable', it means it is...", options: ['Expensive', 'Cheap enough to buy', 'Difficult to find', 'Old'], correctAnswer: 1 },
  { order: 13, cefr: 'A2', skill: 'vocabulary', question: 'I need to ___ an appointment with the doctor.', options: ['make', 'do', 'take', 'have'], correctAnswer: 0 },
  { order: 14, cefr: 'A2', skill: 'vocabulary', question: 'A person who teaches at a university is called a...', options: ['Lecturer', 'Driver', 'Cashier', 'Plumber'], correctAnswer: 0 },
  { order: 15, cefr: 'A2', skill: 'reading', question: 'The bus to Samarkand leaves every hour from 6 a.m. to 8 p.m. What time does the last bus leave?', options: ['6 a.m.', '12 p.m.', '6 p.m.', '8 p.m.'], correctAnswer: 3 },
  { order: 16, cefr: 'A2', skill: 'reading', question: 'Dilnoza works in an office from Monday to Friday. On weekends, she likes to visit her parents. When does Dilnoza visit her parents?', options: ['On weekdays', 'On weekends', 'Every day', 'Never'], correctAnswer: 1 },

  // ---- B1 ----
  { order: 17, cefr: 'B1', skill: 'grammar', question: 'I have never ___ sushi before.', options: ['eat', 'eaten', 'ate', 'eating'], correctAnswer: 1 },
  { order: 18, cefr: 'B1', skill: 'grammar', question: 'If it rains tomorrow, we ___ the picnic.', options: ['cancel', 'will cancel', 'canceled', 'would cancel'], correctAnswer: 1 },
  { order: 19, cefr: 'B1', skill: 'grammar', question: "She's the woman ___ helped me yesterday.", options: ['who', 'which', 'whose', 'whom'], correctAnswer: 0 },
  { order: 20, cefr: 'B1', skill: 'vocabulary', question: "Choose the best synonym for 'responsibility' at work.", options: ['Duty', 'Holiday', 'Salary', 'Meeting'], correctAnswer: 0 },
  { order: 21, cefr: 'B1', skill: 'vocabulary', question: "A 'deadline' is...", options: ['A type of holiday', 'The latest time to finish something', 'A meeting room', 'A job title'], correctAnswer: 1 },
  { order: 22, cefr: 'B1', skill: 'vocabulary', question: "If a colleague is 'reliable', you can...", options: ['Never trust them', 'Always count on them', 'Rarely see them', 'Easily replace them'], correctAnswer: 1 },
  { order: 23, cefr: 'B1', skill: 'reading', question: 'Our company is moving to a new office next month. All employees will receive an email with the new address and moving date by Friday. How will employees learn the new address?', options: ['By phone call', 'By email', 'In a meeting', "They won't be told"], correctAnswer: 1 },
  { order: 24, cefr: 'B1', skill: 'reading', question: 'Farrukh applied for five jobs last week. He got two interviews, but no offers yet. How many interviews did Farrukh get?', options: ['Five', 'Two', 'Zero', 'Unknown'], correctAnswer: 1 },

  // ---- B2 ----
  { order: 25, cefr: 'B2', skill: 'grammar', question: 'The report ___ by the team next week.', options: ['will finish', 'will be finished', 'is finishing', 'finished'], correctAnswer: 1 },
  { order: 26, cefr: 'B2', skill: 'grammar', question: 'She said she ___ the email the day before.', options: ['sends', 'sent', 'had sent', 'has sent'], correctAnswer: 2 },
  { order: 27, cefr: 'B2', skill: 'grammar', question: '___ the heavy traffic, we arrived on time.', options: ['Despite', 'Although', 'Because', 'Even'], correctAnswer: 0 },
  { order: 28, cefr: 'B2', skill: 'vocabulary', question: "Choose the best synonym for 'negotiate' in a business context.", options: ['Ignore', 'Discuss to reach an agreement', 'Cancel', 'Complain'], correctAnswer: 1 },
  { order: 29, cefr: 'B2', skill: 'vocabulary', question: "If a plan is 'feasible', it is...", options: ['Impossible', 'Realistic and achievable', 'Illegal', 'Expensive'], correctAnswer: 1 },
  { order: 30, cefr: 'B2', skill: 'vocabulary', question: "A company's 'turnover' usually refers to...", options: ['Staff uniforms', 'Total sales revenue', 'Office furniture', 'Holiday schedule'], correctAnswer: 1 },
  { order: 31, cefr: 'B2', skill: 'reading', question: 'The proposal was approved by the board, but implementation was delayed due to a shortage of qualified staff in the technical department. Why was implementation delayed?', options: ['The board rejected it', 'Not enough qualified staff', 'Lack of funding', 'The office moved'], correctAnswer: 1 },
  { order: 32, cefr: 'B2', skill: 'reading', question: 'Although remote work increased productivity for some employees, others reported feeling isolated and struggled to separate work from personal life. What problem did some employees have with remote work?', options: ['Lower pay', 'Feeling isolated', 'Too many meetings', 'Shorter hours'], correctAnswer: 1 },
]
