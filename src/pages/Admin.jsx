import { useState, useEffect } from 'react'
import { adminFetch, apiFetch, API_BASE } from '../lib/api'

const inputStyle = {
  width: '100%', padding: '10px 14px', fontSize: 14,
  borderRadius: 10, border: '1.5px solid rgba(0,0,0,0.12)',
  outline: 'none', background: '#fff', boxSizing: 'border-box',
}
const btnStyle = (color = '#5e5ce6') => ({
  padding: '8px 18px', fontSize: 13, fontWeight: 600,
  borderRadius: 980, border: 'none', cursor: 'pointer',
  background: color, color: '#fff',
})

// ── 登录 ──────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    const resp = await fetch(`${API_BASE}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    })
    if (resp.ok) {
      const { token } = await resp.json()
      localStorage.setItem('ppo_admin_token', token)
      onLogin()
    } else {
      setErr('密码错误')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f7' }}>
      <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: 24, padding: '48px 40px', width: 360, boxShadow: '0 4px 32px rgba(0,0,0,0.08)' }}>
        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24, textAlign: 'center' }}>管理后台</h2>
        <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="管理密码" style={{ ...inputStyle, marginBottom: 12 }} />
        {err && <p style={{ color: '#ff3b30', fontSize: 13, margin: '0 0 8px' }}>{err}</p>}
        <button type="submit" style={{ ...btnStyle(), width: '100%', padding: '12px' }}>登录</button>
      </form>
    </div>
  )
}

// ── Gallery 管理 ──────────────────────────────────────
function GalleryAdmin() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ img: '', prompt: '', model: '', tags: '' })
  const [editing, setEditing] = useState(null)

  async function load() {
    const resp = await apiFetch('/api/gallery')
    setItems(await resp.json())
  }
  useEffect(() => { load() }, [])

  async function handleSave() {
    const body = { ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) }
    if (editing) {
      await adminFetch(`/api/gallery/${editing}`, { method: 'PUT', body: JSON.stringify(body) })
    } else {
      await adminFetch('/api/gallery', { method: 'POST', body: JSON.stringify(body) })
    }
    setForm({ img: '', prompt: '', model: '', tags: '' })
    setEditing(null)
    load()
  }

  async function handleDelete(id) {
    if (!confirm('确认删除？')) return
    await adminFetch(`/api/gallery/${id}`, { method: 'DELETE' })
    load()
  }

  function handleEdit(item) {
    setEditing(item.id)
    setForm({ img: item.img, prompt: item.prompt, model: item.model, tags: item.tags.join(', ') })
  }

  return (
    <div>
      <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>图片库管理</h3>

      {/* 表单 */}
      <div style={{ background: '#f5f5f7', borderRadius: 16, padding: 24, marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h4 style={{ margin: '0 0 8px', fontSize: 14, color: '#6e6e73' }}>{editing ? '编辑图片' : '添加图片'}</h4>
        <input value={form.img} onChange={e => setForm(p => ({ ...p, img: e.target.value }))} placeholder="图片链接（URL）" style={inputStyle} />
        <textarea value={form.prompt} onChange={e => setForm(p => ({ ...p, prompt: e.target.value }))} placeholder="提示词" rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
        <input value={form.model} onChange={e => setForm(p => ({ ...p, model: e.target.value }))} placeholder="模型名（如 Midjourney v6）" style={inputStyle} />
        <input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder="标签，逗号分隔（如 赛博朋克, 城市）" style={inputStyle} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleSave} style={btnStyle()}>{editing ? '保存修改' : '添加'}</button>
          {editing && <button onClick={() => { setEditing(null); setForm({ img: '', prompt: '', model: '', tags: '' }) }} style={btnStyle('#6e6e73')}>取消</button>}
        </div>
      </div>

      {/* 列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map(item => (
          <div key={item.id} style={{ display: 'flex', gap: 16, alignItems: 'center', background: '#fff', borderRadius: 14, padding: '12px 16px', border: '1px solid rgba(0,0,0,0.07)' }}>
            <img src={item.img} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, color: '#1d1d1f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.prompt}</p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6e6e73' }}>{item.model} · 点赞 {item.likes}</p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button onClick={() => handleEdit(item)} style={btnStyle('#ff9500')}>编辑</button>
              <button onClick={() => handleDelete(item.id)} style={btnStyle('#ff3b30')}>删除</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Prompts 管理 ──────────────────────────────────────
function PromptsAdmin() {
  const [data, setData] = useState({})
  const [form, setForm] = useState({ category: '写作', title: '', desc: '', text: '' })
  const [editing, setEditing] = useState(null)
  const CATEGORIES = ['写作', '编程', '分析', '设计']

  async function load() {
    const resp = await apiFetch('/api/prompts')
    setData(await resp.json())
  }
  useEffect(() => { load() }, [])

  const allPrompts = Object.values(data).flat()

  async function handleSave() {
    if (editing) {
      await adminFetch(`/api/prompts/${editing}`, { method: 'PUT', body: JSON.stringify(form) })
    } else {
      await adminFetch('/api/prompts', { method: 'POST', body: JSON.stringify(form) })
    }
    setForm({ category: '写作', title: '', desc: '', text: '' })
    setEditing(null)
    load()
  }

  async function handleDelete(id) {
    if (!confirm('确认删除？')) return
    await adminFetch(`/api/prompts/${id}`, { method: 'DELETE' })
    load()
  }

  function handleEdit(p) {
    setEditing(p.id)
    setForm({ category: p.category, title: p.title, desc: p.desc, text: p.text })
  }

  return (
    <div>
      <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>提示词模板管理</h3>

      <div style={{ background: '#f5f5f7', borderRadius: 16, padding: 24, marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h4 style={{ margin: '0 0 8px', fontSize: 14, color: '#6e6e73' }}>{editing ? '编辑提示词' : '添加提示词'}</h4>
        <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={inputStyle}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="标题" style={inputStyle} />
        <input value={form.desc} onChange={e => setForm(p => ({ ...p, desc: e.target.value }))} placeholder="简介" style={inputStyle} />
        <textarea value={form.text} onChange={e => setForm(p => ({ ...p, text: e.target.value }))} placeholder="提示词内容" rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleSave} style={btnStyle()}>{editing ? '保存修改' : '添加'}</button>
          {editing && <button onClick={() => { setEditing(null); setForm({ category: '写作', title: '', desc: '', text: '' }) }} style={btnStyle('#6e6e73')}>取消</button>}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {allPrompts.map(p => (
          <div key={p.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: '#fff', borderRadius: 14, padding: '14px 16px', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>[{p.category}] {p.title}</p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6e6e73', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.text}</p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button onClick={() => handleEdit(p)} style={btnStyle('#ff9500')}>编辑</button>
              <button onClick={() => handleDelete(p.id)} style={btnStyle('#ff3b30')}>删除</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── 主页面 ────────────────────────────────────────────
export default function Admin() {
  const [authed, setAuthed] = useState(!!localStorage.getItem('ppo_admin_token'))
  const [tab, setTab] = useState('gallery')

  if (!authed) return <LoginPage onLogin={() => setAuthed(true)} />

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f7' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.08)', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 52 }}>
        <span style={{ fontWeight: 600, fontSize: 15 }}>◆ 管理后台</span>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ key: 'gallery', label: '图片库' }, { key: 'prompts', label: '提示词' }].map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)} style={{ ...btnStyle(tab === key ? '#5e5ce6' : '#e5e5ea'), color: tab === key ? '#fff' : '#1d1d1f' }}>{label}</button>
          ))}
          <button onClick={() => { localStorage.removeItem('ppo_admin_token'); setAuthed(false) }} style={btnStyle('#ff3b30')}>退出</button>
        </div>
      </div>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        {tab === 'gallery' ? <GalleryAdmin /> : <PromptsAdmin />}
      </div>
    </div>
  )
}
