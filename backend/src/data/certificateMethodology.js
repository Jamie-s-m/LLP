// The exact language used on every certificate LinguaNest issues, and the one place that
// language is allowed to live - see PRIORITY 5/20 of the Phase 2 brief. Do not write
// "Cambridge certified", "official CEFR certification", or similar anywhere else in the
// codebase; there is no such authorization.

export const CERTIFICATE_ISSUER = 'LinguaNest';

export const CERTIFICATE_METHODOLOGY_STATEMENT =
  'This is a LinguaNest Certificate of Achievement, referenced against the CEFR (Common ' +
  'European Framework of Reference for Languages) descriptors LinguaNest uses to design its ' +
  'own curriculum and assessments. It is issued by LinguaNest, not by Cambridge Assessment ' +
  'English, the Council of Europe, or any examination board, and is not an official CEFR or ' +
  'Cambridge certification. It reflects performance on LinguaNest\'s own lesson exercises, ' +
  'assessment items, and (where applicable) teacher-reviewed speaking tasks within the stated ' +
  'course, not an independently administered, standardized examination.';

export const CERTIFICATE_LIMITATIONS_STATEMENT =
  'LinguaNest assessment items are original content, not past or sample papers from any ' +
  'official examination. Confidence in the underlying CEFR-referenced level estimate depends ' +
  'on how much evidence (completed lessons, graded exercises, placement result) the learner ' +
  'has generated - see the "confidence" field on the learner\'s skill profile.';
