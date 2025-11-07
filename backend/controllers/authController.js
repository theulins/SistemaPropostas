import bcrypt from 'bcrypt'; import jwt from 'jsonwebtoken'; import { db } from '../db.js'; import { logger } from '../utils/logger.js';
const resolveJwtSecret=()=>{ if(process.env.JWT_SECRET && process.env.JWT_SECRET.trim()) return process.env.JWT_SECRET;
 logger.warn('JWT_SECRET não definido; usando valor padrão apenas para desenvolvimento.'); return 'dev-secret'; };
export const login=async(req,res)=>{ const {email,password}=req.body;
 if(!email?.trim()||!password){ return res.status(400).json({message:'E-mail e senha são obrigatórios.'}); }
 const[rows]=await db.query('SELECT id,name,email,password,role FROM users WHERE email=?',[email.trim()]);
 if(!rows.length) return res.status(401).json({message:'E-mail não encontrado.'}); const u=rows[0];
 let ok=false; const stored=u.password||'';
 if(stored.startsWith('$2a$')||stored.startsWith('$2b$')||stored.startsWith('$2y$')){ ok=await bcrypt.compare(password,stored); }
 else { ok=stored===password; }
 if(!ok) return res.status(401).json({message:'Senha incorreta.'});
 const token=jwt.sign({id:u.id,role:u.role},resolveJwtSecret(),{expiresIn:'1d'}); res.json({token,user:{id:u.id,name:u.name,role:u.role}}); };

