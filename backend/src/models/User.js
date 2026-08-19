import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'teacher', 'parent', 'admin'], default: 'student' },
    isEmailVerified: { type: Boolean, default: false },
    avatar: { type: String, default: '' },
    nativeLanguage: { type: String, default: 'English' },
    targetLanguages: [{ type: String }],
    xp: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    lastActiveDate: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    parents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);