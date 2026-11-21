import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User.js';

const router = Router();
const registerSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(254),
  password: z.string().min(10).max(128)
});
const createToken = (user) => jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
const publicUser = (user) => ({ id: user.id, name: user.name, email: user.email });

router.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const email = data.email.toLowerCase();
    if (await User.findOne({ email })) return res.status(409).json({ error: 'Email already registered' });
    const user = await User.create({ name: data.name, email, passwordHash: await bcrypt.hash(data.password, 12) });
    res.status(201).json({ token: createToken(user), user: publicUser(user) });
  } catch (error) {
    if (error.name === 'ZodError') return res.status(400).json({ error: 'Enter a valid name, email and password of at least 10 characters' });
    if (error.code === 11000) return res.status(409).json({ error: 'Email already registered' });
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: 'Invalid email or password' });
    res.json({ token: createToken(user), user: publicUser(user) });
  } catch (error) { next(error); }
});
export default router;
