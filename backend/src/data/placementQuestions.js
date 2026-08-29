// Original CEFR-style English placement questions (A1-B2), used to route a new student to a
// starting course level. Presented in increasing difficulty; scoring lives in placementController.
export const placementQuestions = [
  // A1
  { order: 1, cefr: 'A1', question: 'I ___ from Uzbekistan.', options: ['is', 'am', 'are', 'be'], correctAnswer: 1 },
  { order: 2, cefr: 'A1', question: 'She ___ a teacher.', options: ['work', 'works', 'working', 'worked'], correctAnswer: 1 },
  { order: 3, cefr: 'A1', question: 'This is my friend. ___ name is Aziz.', options: ['He', 'His', 'Him', "He's"], correctAnswer: 1 },
  { order: 4, cefr: 'A1', question: 'There ___ five books on the table.', options: ['is', 'am', 'are', 'be'], correctAnswer: 2 },
  // A2
  { order: 5, cefr: 'A2', question: 'Yesterday, we ___ to the cinema.', options: ['go', 'goes', 'went', 'going'], correctAnswer: 2 },
  { order: 6, cefr: 'A2', question: 'This exercise is ___ than the last one.', options: ['easy', 'easier', 'easiest', 'more easy'], correctAnswer: 1 },
  { order: 7, cefr: 'A2', question: 'I usually ___ up at 7 a.m.', options: ['wake', 'woke', 'waking', 'wakes'], correctAnswer: 0 },
  { order: 8, cefr: 'A2', question: 'Can you tell me ___ the station is?', options: ['where', 'what', 'when', 'who'], correctAnswer: 0 },
  // B1
  { order: 9, cefr: 'B1', question: 'I have never ___ sushi before.', options: ['eat', 'eaten', 'ate', 'eating'], correctAnswer: 1 },
  { order: 10, cefr: 'B1', question: 'If it rains tomorrow, we ___ the picnic.', options: ['cancel', 'will cancel', 'canceled', 'would cancel'], correctAnswer: 1 },
  { order: 11, cefr: 'B1', question: "She's the woman ___ helped me yesterday.", options: ['who', 'which', 'whose', 'whom'], correctAnswer: 0 },
  { order: 12, cefr: 'B1', question: 'He apologized ___ being late.', options: ['to', 'for', 'about', 'of'], correctAnswer: 1 },
  // B2
  { order: 13, cefr: 'B2', question: 'The report ___ by the team next week.', options: ['will finish', 'will be finished', 'is finishing', 'finished'], correctAnswer: 1 },
  { order: 14, cefr: 'B2', question: 'She said she ___ the email the day before.', options: ['sends', 'sent', 'had sent', 'has sent'], correctAnswer: 2 },
  { order: 15, cefr: 'B2', question: '___ the heavy traffic, we arrived on time.', options: ['Despite', 'Although', 'Because', 'Even'], correctAnswer: 0 },
  { order: 16, cefr: 'B2', question: 'The more you practice, ___ you become.', options: ['confident', 'more confident', 'the more confident', 'most confident'], correctAnswer: 2 },
]
