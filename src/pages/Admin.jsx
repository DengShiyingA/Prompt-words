import { useState, useEffect } from 'react'
import { adminFetch, apiFetch, API_BASE } from '../lib/api'

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
        <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="管理密码"
          style={{ width: '100%', padding: '10px 14px', fontSize: 14, borderRadius: 10, border: '1.5px solid rgba(0,0,0,0.12)', outline: 'none', background: '#fff', boxSizing: 'border-box', marginBottom: 12 }} />
        {err && <p style={{ color: '#ff3b30', fontSize: 13, margin: '0 0 8px' }}>{err}</p>}
        <button type="submit" style={{ ...btnStyle(), width: '100%', padding: '12px' }}>登录</button>
      </form>
    </div>
  )
}

// ── 主页面 ────────────────────────────────────────────
function Dashboard() {
  const [gallery, setGallery] = useState([])
  const [prompts, setPrompts] = useState({})
  const [health, setHealth] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshMsg, setRefreshMsg] = useState('')

  async function load() {
    try {
      const [g, p, h] = await Promise.all([
        apiFetch('/api/gallery').then(r => r.json()),
        apiFetch('/api/prompts').then(r => r.json()),
        fetch(`${API_BASE}/health`).then(r => r.json()),
      ])
      setGallery(g)
      setPrompts(p)
      setHealth(h)
    } catch {}
  }

  useEffect(() => { load() }, [])

  async function handleRefreshCache() {
    setRefreshing(true)
    setRefreshMsg('')
    try {
      await adminFetch('/api/admin/refresh-cache', { method: 'POST' })
      setRefreshMsg('缓存已刷新，正在重新加载...')
      await load()
      setRefreshMsg('✓ 已同步最新 Notion 内容')
    } catch {
      setRefreshMsg('刷新失败，请检查服务器')
    }
    setRefreshing(false)
  }

  const totalLikes = gallery.reduce((s, i) => s + (i.likes || 0), 0)
  const totalPrompts = Object.values(prompts).flat().length
  const notionEnabled = health?.notion

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>

      {/* 状态卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { label: '图片数量', value: gallery.length, icon: '🖼️' },
          { label: '提示词数量', value: totalPrompts, icon: '✍️' },
          { label: '总点赞数', value: totalLikes, icon: '❤️' },
          { label: 'Notion CMS', value: notionEnabled ? '已启用' : '未启用', icon: '📑', ok: notionEnabled },
        ].map(card => (
          <div key={card.label} style={{ background: '#fff', borderRadius: 18, padding: '24px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{card.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: card.ok === false ? '#ff3b30' : '#1d1d1f' }}>{card.value ?? '—'}</div>
            <div style={{ fontSize: 13, color: '#6e6e73', marginTop: 4 }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Notion 操作 */}
      <div style={{ background: '#fff', borderRadius: 18, padding: '28px 24px', marginBottom: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 6px' }}>Notion 内容管理</h3>
        <p style={{ fontSize: 13, color: '#6e6e73', margin: '0 0 20px' }}>
          在 Notion 数据库里直接添加、编辑或删除内容，完成后点击「刷新缓存」让网站立即更新。
        </p>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <a href="https://www.notion.so/31bd2b468c79815e91d4cde23e9708bb" target="_blank" rel="noreferrer"
            style={{ ...btnStyle('#000'), textDecoration: 'none', display: 'inline-block' }}>
            打开图片库
          </a>
          <a href="https://www.notion.so/31bd2b468c7981358f98c57c0e1621b9" target="_blank" rel="noreferrer"
            style={{ ...btnStyle('#000'), textDecoration: 'none', display: 'inline-block' }}>
            打开提示词库
          </a>
          <button onClick={handleRefreshCache} disabled={refreshing} style={btnStyle(refreshing ? '#aaa' : '#5e5ce6')}>
            {refreshing ? '刷新中...' : '刷新缓存'}
          </button>
          {refreshMsg && <span style={{ fontSize: 13, color: refreshMsg.startsWith('✓') ? '#30d158' : '#ff3b30' }}>{refreshMsg}</span>}
        </div>
      </div>

      {/* 图片列表预览 */}
      <div style={{ background: '#fff', borderRadius: 18, padding: '28px 24px', marginBottom: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>图片库预览</h3>
        {gallery.length === 0
          ? <p style={{ color: '#6e6e73', fontSize: 13 }}>暂无图片，去 Notion 添加后刷新缓存</p>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {gallery.map(item => (
              <div key={item.id} style={{ display: 'flex', gap: 14, alignItems: 'center', borderRadius: 12, padding: '10px 14px', border: '1px solid rgba(0,0,0,0.07)' }}>
                <img src={item.img} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, flexShrink: 0, background: '#f0f0f0' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, color: '#1d1d1f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.prompt || '（无提示词）'}</p>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: '#6e6e73' }}>{item.model || '未填模型'} · ❤️ {item.likes}</p>
                </div>
              </div>
            ))}
          </div>
        }
      </div>

      {/* 提示词列表预览 */}
      <div style={{ background: '#fff', borderRadius: 18, padding: '28px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>提示词库预览</h3>
        {totalPrompts === 0
          ? <p style={{ color: '#6e6e73', fontSize: 13 }}>暂无提示词，去 Notion 添加后刷新缓存</p>
          : Object.entries(prompts).map(([cat, list]) => (
            <div key={cat} style={{ marginBottom: 16 }}>
              <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#5e5ce6' }}>{cat} ({list.length})</p>
              {list.map(p => (
                <div key={p.id} style={{ fontSize: 13, color: '#1d1d1f', padding: '6px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  {p.title} <span style={{ color: '#6e6e73', fontSize: 12 }}>— {p.desc}</span>
                </div>
              ))}
            </div>
          ))
        }
      </div>
    </div>
  )
}

export default function Admin() {
  const [authed, setAuthed] = useState(!!localStorage.getItem('ppo_admin_token'))

  if (!authed) return <LoginPage onLogin={() => setAuthed(true)} />

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f7' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.08)', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 52 }}>
        <span style={{ fontWeight: 600, fontSize: 15 }}>◆ 管理后台</span>
        <button onClick={() => { localStorage.removeItem('ppo_admin_token'); setAuthed(false) }} style={btnStyle('#ff3b30')}>退出</button>
      </div>
      <Dashboard />
    </div>
  )
}
