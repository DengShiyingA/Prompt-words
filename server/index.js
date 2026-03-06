import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import db from './db.js'

// 加载 .env
try {
  const __dir = dirname(fileURLToPath(import.meta.url))
  const env = readFileSync(resolve(__dir, '.env'), 'utf-8')
  for (const line of env.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim()
  }
} catch {}

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'
const JWT_SECRET = process.env.JWT_SECRET || 'changeme_secret'
const PORT = process.env.PORT || 3001

const app = express()
app.use(cors())
app.use(express.json())

// ── 中间件：验证管理员 token ──────────────────────────
function requireAdmin(req, res, next) {
  const token = req.headers['authorization']?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: '未登录' })
  try {
    jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'token 无效或已过期' })
  }
}

// ── 工具函数 ──────────────────────────────────────────
function withCounts(rows, userId) {
  return rows.map(row => {
    const likes = db.prepare('SELECT COUNT(*) as n FROM likes WHERE gallery_id=?').get(row.id).n
    const liked = userId ? !!db.prepare('SELECT 1 FROM likes WHERE gallery_id=? AND user_id=?').get(row.id, userId) : false
    const favorited = userId ? !!db.prepare('SELECT 1 FROM favorites WHERE gallery_id=? AND user_id=?').get(row.id, userId) : false
    return { ...row, tags: JSON.parse(row.tags), likes, liked, favorited }
  })
}

// ── 管理员登录 ────────────────────────────────────────
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: '密码错误' })
  const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '7d' })
  res.json({ token })
})

// ── Gallery API ───────────────────────────────────────
app.get('/api/gallery', (req, res) => {
  const userId = req.headers['x-user-id'] || null
  const rows = db.prepare('SELECT * FROM gallery ORDER BY created_at DESC').all()
  res.json(withCounts(rows, userId))
})

app.post('/api/gallery', requireAdmin, (req, res) => {
  const { img, prompt, model, tags } = req.body
  if (!img || !prompt) return res.status(400).json({ error: '缺少必填字段' })
  const result = db.prepare('INSERT INTO gallery (img, prompt, model, tags) VALUES (?, ?, ?, ?)').run(
    img, prompt, model || '', JSON.stringify(tags || [])
  )
  res.json({ id: result.lastInsertRowid })
})

app.put('/api/gallery/:id', requireAdmin, (req, res) => {
  const { img, prompt, model, tags } = req.body
  db.prepare('UPDATE gallery SET img=?, prompt=?, model=?, tags=? WHERE id=?').run(
    img, prompt, model || '', JSON.stringify(tags || []), req.params.id
  )
  res.json({ ok: true })
})

app.delete('/api/gallery/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM gallery WHERE id=?').run(req.params.id)
  db.prepare('DELETE FROM likes WHERE gallery_id=?').run(req.params.id)
  db.prepare('DELETE FROM favorites WHERE gallery_id=?').run(req.params.id)
  res.json({ ok: true })
})

// ── 点赞 ──────────────────────────────────────────────
app.post('/api/gallery/:id/like', (req, res) => {
  const { userId } = req.body
  if (!userId) return res.status(400).json({ error: '缺少 userId' })
  const exists = db.prepare('SELECT 1 FROM likes WHERE gallery_id=? AND user_id=?').get(req.params.id, userId)
  if (exists) {
    db.prepare('DELETE FROM likes WHERE gallery_id=? AND user_id=?').run(req.params.id, userId)
  } else {
    db.prepare('INSERT INTO likes (gallery_id, user_id) VALUES (?, ?)').run(req.params.id, userId)
  }
  const count = db.prepare('SELECT COUNT(*) as n FROM likes WHERE gallery_id=?').get(req.params.id).n
  res.json({ liked: !exists, count })
})

// ── 收藏 ──────────────────────────────────────────────
app.post('/api/gallery/:id/favorite', (req, res) => {
  const { userId } = req.body
  if (!userId) return res.status(400).json({ error: '缺少 userId' })
  const exists = db.prepare('SELECT 1 FROM favorites WHERE gallery_id=? AND user_id=?').get(req.params.id, userId)
  if (exists) {
    db.prepare('DELETE FROM favorites WHERE gallery_id=? AND user_id=?').run(req.params.id, userId)
  } else {
    db.prepare('INSERT INTO favorites (gallery_id, user_id) VALUES (?, ?)').run(req.params.id, userId)
  }
  res.json({ favorited: !exists })
})

app.get('/api/favorites', (req, res) => {
  const userId = req.headers['x-user-id']
  if (!userId) return res.json([])
  const rows = db.prepare(`
    SELECT g.* FROM gallery g
    INNER JOIN favorites f ON f.gallery_id = g.id
    WHERE f.user_id = ?
    ORDER BY f.id DESC
  `).all(userId)
  res.json(withCounts(rows, userId))
})

// ── Prompts API ───────────────────────────────────────
app.get('/api/prompts', (_req, res) => {
  const rows = db.prepare('SELECT * FROM prompts ORDER BY category, created_at').all()
  // 按分类分组
  const map = {}
  for (const row of rows) {
    if (!map[row.category]) map[row.category] = []
    map[row.category].push(row)
  }
  res.json(map)
})

app.post('/api/prompts', requireAdmin, (req, res) => {
  const { category, title, desc, text } = req.body
  if (!category || !title || !text) return res.status(400).json({ error: '缺少必填字段' })
  const result = db.prepare('INSERT INTO prompts (category, title, desc, text) VALUES (?, ?, ?, ?)').run(category, title, desc || '', text)
  res.json({ id: result.lastInsertRowid })
})

app.put('/api/prompts/:id', requireAdmin, (req, res) => {
  const { category, title, desc, text } = req.body
  db.prepare('UPDATE prompts SET category=?, title=?, desc=?, text=? WHERE id=?').run(category, title, desc || '', text, req.params.id)
  res.json({ ok: true })
})

app.delete('/api/prompts/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM prompts WHERE id=?').run(req.params.id)
  res.json({ ok: true })
})

// ── 健康检查 ──────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ ok: true }))

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
