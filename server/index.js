import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import db from './db.js'
import { fetchGallery, fetchPrompts, clearCache, fetchPageImageUrl } from './notion.js'

// 加载 .env
try {
  const __dir = dirname(fileURLToPath(import.meta.url))
  const env = readFileSync(resolve(__dir, '.env'), 'utf-8')
  for (const line of env.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim()
  }
} catch {}

const USE_NOTION = () => !!process.env.NOTION_TOKEN
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

// ── 工具函数：给 SQLite 行附加点赞/收藏计数 ──────────────
function withCounts(rows, userId) {
  return rows.map(row => {
    const likes = db.prepare('SELECT COUNT(*) as n FROM likes WHERE gallery_id=?').get(row.id).n
    const liked = userId ? !!db.prepare('SELECT 1 FROM likes WHERE gallery_id=? AND user_id=?').get(row.id, userId) : false
    const favorited = userId ? !!db.prepare('SELECT 1 FROM favorites WHERE gallery_id=? AND user_id=?').get(row.id, userId) : false
    return { ...row, tags: Array.isArray(row.tags) ? row.tags : JSON.parse(row.tags || '[]'), likes, liked, favorited }
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
app.get('/api/gallery', async (req, res) => {
  const userId = req.headers['x-user-id'] || null
  try {
    if (USE_NOTION()) {
      const items = await fetchGallery()
      return res.json(items.map(item => {
        const likes = db.prepare('SELECT COUNT(*) as n FROM likes WHERE gallery_id=?').get(item.id).n
        const liked = userId ? !!db.prepare('SELECT 1 FROM likes WHERE gallery_id=? AND user_id=?').get(item.id, userId) : false
        const favorited = userId ? !!db.prepare('SELECT 1 FROM favorites WHERE gallery_id=? AND user_id=?').get(item.id, userId) : false
        return { ...item, likes, liked, favorited }
      }))
    }
    const rows = db.prepare('SELECT * FROM gallery ORDER BY created_at DESC').all()
    res.json(withCounts(rows, userId))
  } catch (e) {
    console.error('Gallery fetch error:', e.message)
    res.status(500).json({ error: e.message })
  }
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
  const id = req.params.id
  const exists = db.prepare('SELECT 1 FROM likes WHERE gallery_id=? AND user_id=?').get(id, userId)
  if (exists) {
    db.prepare('DELETE FROM likes WHERE gallery_id=? AND user_id=?').run(id, userId)
  } else {
    db.prepare('INSERT INTO likes (gallery_id, user_id) VALUES (?, ?)').run(id, userId)
  }
  const count = db.prepare('SELECT COUNT(*) as n FROM likes WHERE gallery_id=?').get(id).n
  res.json({ liked: !exists, count })
})

// ── 收藏 ──────────────────────────────────────────────
app.post('/api/gallery/:id/favorite', (req, res) => {
  const { userId } = req.body
  if (!userId) return res.status(400).json({ error: '缺少 userId' })
  const id = req.params.id
  const exists = db.prepare('SELECT 1 FROM favorites WHERE gallery_id=? AND user_id=?').get(id, userId)
  if (exists) {
    db.prepare('DELETE FROM favorites WHERE gallery_id=? AND user_id=?').run(id, userId)
  } else {
    db.prepare('INSERT INTO favorites (gallery_id, user_id) VALUES (?, ?)').run(id, userId)
  }
  res.json({ favorited: !exists })
})

app.get('/api/favorites', async (req, res) => {
  const userId = req.headers['x-user-id']
  if (!userId) return res.json([])
  try {
    if (USE_NOTION()) {
      const favoriteRows = db.prepare('SELECT gallery_id FROM favorites WHERE user_id=? ORDER BY id DESC').all(userId)
      const ids = new Set(favoriteRows.map(r => r.gallery_id))
      if (!ids.size) return res.json([])
      const all = await fetchGallery()
      return res.json(all.filter(item => ids.has(item.id)).map(item => {
        const likes = db.prepare('SELECT COUNT(*) as n FROM likes WHERE gallery_id=?').get(item.id).n
        return { ...item, likes, liked: false, favorited: true }
      }))
    }
    const rows = db.prepare(`
      SELECT g.* FROM gallery g
      INNER JOIN favorites f ON f.gallery_id = g.id
      WHERE f.user_id = ?
      ORDER BY f.id DESC
    `).all(userId)
    res.json(withCounts(rows, userId))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ── Prompts API ───────────────────────────────────────
app.get('/api/prompts', async (_req, res) => {
  try {
    if (USE_NOTION()) {
      return res.json(await fetchPrompts())
    }
    const rows = db.prepare('SELECT * FROM prompts ORDER BY category, created_at').all()
    const map = {}
    for (const row of rows) {
      if (!map[row.category]) map[row.category] = []
      map[row.category].push(row)
    }
    res.json(map)
  } catch (e) {
    console.error('Prompts fetch error:', e.message)
    res.status(500).json({ error: e.message })
  }
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

// ── 图片代理（Notion 上传图片 URL 会过期，通过此接口每次实时获取）────
app.get('/api/img/:id', async (req, res) => {
  try {
    const url = await fetchPageImageUrl(req.params.id)
    if (!url) return res.status(404).json({ error: '图片不存在' })
    res.redirect(302, url)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ── 刷新 Notion 缓存 ───────────────────────────────────
app.post('/api/admin/refresh-cache', requireAdmin, (_req, res) => {
  clearCache()
  res.json({ ok: true })
})

// ── 健康检查 ──────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ ok: true, notion: USE_NOTION() }))

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT} [Notion: ${USE_NOTION()}]`))
