import mongoose from 'mongoose';

const placementQuestionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: {
      type: [String],
      required: true,
      validate: { validator: (value) => Array.isArray(value) && value.length >= 2, message: 'At least 2 options are required' },
    },
    correctAnswer: { type: Number, required: true },
    cefr: { type: String, enum: ['A1', 'A2', 'B1', 'B2'], required: true },
    skill: { type: String, enum: ['grammar', 'vocabulary', 'reading'], default: 'grammar' },
    order: { type: Number, required: true },
  },
  { timestamps: true }
);

placementQuestionSchema.index({ order: 1 });

export default mongoose.model('PlacementQuestion', placementQuestionSchema);
