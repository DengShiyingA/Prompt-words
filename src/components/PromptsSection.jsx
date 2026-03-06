import { motion } from 'framer-motion'
import { Copy, Check } from 'lucide-react'
import { useState, useEffect } from 'react'
import { apiFetch } from '../lib/api'

const CATEGORY_STYLE = {
  写作: { color: '#5e5ce6', bg: '#f0f0ff' },
  编程: { color: '#30b050', bg: '#f0fff4' },
  分析: { color: '#ff9500', bg: '#fff8f0' },
  设计: { color: '#ff375f', bg: '#fff0f3' },
}

function PromptCard({ title, desc, text, color, bg }) {
  const [copied, setCopied] = useState(false)
  function handleCopy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5 }}
      style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 20, padding: '24px', boxShadow: '0 2px 16px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <div>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#1d1d1f', marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 13, color: '#6e6e73' }}>{desc}</div>
      </div>
      <div style={{ background: bg, borderRadius: 12, padding: '14px 16px', fontSize: 13, color: '#1d1d1f', lineHeight: 1.7, flex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {text}
      </div>
      <button
        onClick={handleCopy}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: copied ? color : '#f5f5f7', color: copied ? '#fff' : '#1d1d1f', border: 'none', borderRadius: 980, padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s', alignSelf: 'flex-start' }}
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
        {copied ? '已复制' : '复制提示词'}
      </button>
    </motion.div>
  )
}

export function PromptsSection() {
  const [data, setData] = useState({})
  const [activeCategory, setActiveCategory] = useState(null)

  useEffect(() => {
    apiFetch('/api/prompts').then(r => r.json()).then(d => {
      if (!d || typeof d !== 'object' || Array.isArray(d) || d.error) return
      setData(d)
      const first = Object.keys(d)[0]
      if (first) setActiveCategory(first)
    }).catch(() => {})
  }, [])

  const categories = Object.keys(data)
  const prompts = activeCategory ? (data[activeCategory] || []) : []
  const style = CATEGORY_STYLE[activeCategory] || { color: '#5e5ce6', bg: '#f0f0ff' }

  return (
    <section style={{ padding: '80px 0 120px', background: '#f5f5f7' }}>
      <div className="section-container">
        <motion.div
          style={{ textAlign: 'center', marginBottom: 48 }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 600, color: '#1d1d1f', marginBottom: 12 }}>
            即用提示词库
          </h2>
          <p style={{ fontSize: 17, color: '#6e6e73' }}>点击复制，直接粘贴使用</p>
        </motion.div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 40, flexWrap: 'wrap' }}>
          {categories.map(cat => {
            const s = CATEGORY_STYLE[cat] || { color: '#5e5ce6' }
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '8px 20px', borderRadius: 980, border: 'none', cursor: 'pointer',
                  fontSize: 14, fontWeight: 500,
                  background: activeCategory === cat ? s.color : '#fff',
                  color: activeCategory === cat ? '#fff' : '#1d1d1f',
                  boxShadow: activeCategory === cat ? `0 4px 16px ${s.color}40` : '0 1px 4px rgba(0,0,0,0.08)',
                  transition: 'all 0.2s',
                }}
              >
                {cat}
              </button>
            )
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          {prompts.map(p => (
            <PromptCard key={p.id} {...p} color={style.color} bg={style.bg} />
          ))}
        </div>
      </div>
    </section>
  )
}
