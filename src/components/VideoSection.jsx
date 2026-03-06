import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Check, X, Play } from 'lucide-react'
import { useState, useEffect } from 'react'
import { apiFetch } from '../lib/api'

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  function handleCopy(e) {
    e.stopPropagation()
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        background: copied ? '#34c759' : 'rgba(0,0,0,0.06)',
        color: copied ? '#fff' : '#1d1d1f', border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: 980, padding: '6px 12px',
        fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
      }}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? '已复制' : '复制提示词'}
    </button>
  )
}

function VideoModal({ item, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(255,255,255,0.3)', backdropFilter: 'blur(20px) saturate(1.8)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 28, overflow: 'hidden', maxWidth: 860, width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* 视频播放区 */}
        {item.video_url ? (
          <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#000' }}>
            <iframe
              src={item.video_url}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : item.cover ? (
          <img src={item.cover} alt={item.title} style={{ width: '100%', maxHeight: 400, objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: 200, background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Play size={48} color="rgba(255,255,255,0.8)" />
          </div>
        )}

        <div style={{ padding: '28px 32px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {item.tags.map(t => (
                <span key={t} style={{ fontSize: 12, background: 'rgba(0,0,0,0.06)', color: '#6e6e73', borderRadius: 980, padding: '3px 10px' }}>{t}</span>
              ))}
              {item.model && (
                <span style={{ fontSize: 12, background: 'rgba(94,92,230,0.12)', color: '#5e5ce6', borderRadius: 980, padding: '3px 10px' }}>{item.model}</span>
              )}
            </div>
            <button onClick={onClose} style={{ background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#1d1d1f', flexShrink: 0 }}>
              <X size={16} />
            </button>
          </div>
          {item.title && <h3 style={{ fontSize: 17, fontWeight: 600, color: '#1d1d1f', margin: '0 0 12px' }}>{item.title}</h3>}
          <p style={{ fontSize: 15, color: '#1d1d1f', lineHeight: 1.7, margin: '0 0 20px', fontFamily: 'monospace' }}>{item.prompt}</p>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <CopyButton text={item.prompt} />
            {item.video_url && (
              <a
                href={item.video_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(0,0,0,0.06)', color: '#1d1d1f', border: 'none', borderRadius: 980, padding: '6px 14px', fontSize: 12, textDecoration: 'none', transition: 'all 0.2s' }}
              >
                <Play size={12} /> 原视频
              </a>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function VideoCard({ item, onClick }) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={() => onClick(item)}
      style={{ cursor: 'pointer', borderRadius: 20, overflow: 'hidden', background: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,0.08)', position: 'relative' }}
    >
      {/* 封面 */}
      <div style={{ position: 'relative', paddingTop: '56.25%', background: 'linear-gradient(135deg,#667eea,#764ba2)' }}>
        {item.cover
          ? <img src={item.cover} alt={item.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Play size={32} color="rgba(255,255,255,0.8)" /></div>
        }
        {/* 播放按钮遮罩 */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.opacity = 1}
          onMouseLeave={e => e.currentTarget.style.opacity = 0}
        >
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Play size={20} color="#1d1d1f" fill="#1d1d1f" />
          </div>
        </div>
        {item.model && (
          <span style={{ position: 'absolute', top: 10, right: 10, fontSize: 11, background: 'rgba(94,92,230,0.85)', color: '#fff', borderRadius: 980, padding: '2px 8px' }}>{item.model}</span>
        )}
      </div>

      {/* 内容 */}
      <div style={{ padding: '14px 16px' }}>
        {item.title && <p style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f', margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>}
        <p style={{ fontSize: 12, color: '#6e6e73', margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{item.prompt}</p>
        {item.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 4, marginTop: 10, flexWrap: 'wrap' }}>
            {item.tags.slice(0, 3).map(t => (
              <span key={t} style={{ fontSize: 11, background: 'rgba(0,0,0,0.05)', color: '#6e6e73', borderRadius: 980, padding: '2px 8px' }}>{t}</span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export function VideoSection() {
  const [items, setItems] = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    apiFetch('/api/videos').then(d => {
      if (Array.isArray(d)) setItems(d)
    }).catch(() => {})
  }, [])

  if (items.length === 0) return null

  return (
    <section className="section-container" style={{ padding: '80px 24px' }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.6 }}
        style={{ textAlign: 'center', marginBottom: 48 }}
      >
        <p style={{ fontSize: 13, fontWeight: 600, color: '#5e5ce6', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>视频提示词</p>
        <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, color: '#1d1d1f', margin: 0 }}>AI 视频生成效果展示</h2>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24, maxWidth: 1200, margin: '0 auto' }}>
        {items.map((item, i) => (
          <motion.div key={item.id}
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.05, duration: 0.5 }}
          >
            <VideoCard item={item} onClick={setSelected} />
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selected && <VideoModal item={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </section>
  )
}
