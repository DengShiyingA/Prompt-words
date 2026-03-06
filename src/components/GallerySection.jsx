import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Check, X, Heart, Bookmark } from 'lucide-react'
import { useState, useEffect } from 'react'
import { apiFetch } from '../lib/api'
import { getUserId } from '../lib/userId'

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
        backdropFilter: 'blur(8px)',
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

function LightboxModal({ item, onClose, onLike, onFavorite }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(24px)',
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
        <img src={item.img} alt={item.prompt} style={{ width: '100%', maxHeight: 480, objectFit: 'cover' }} />
        <div style={{ padding: '28px 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {item.tags.map(t => (
                <span key={t} style={{ fontSize: 12, background: 'rgba(0,0,0,0.06)', color: '#6e6e73', borderRadius: 980, padding: '3px 10px' }}>{t}</span>
              ))}
              <span style={{ fontSize: 12, background: 'rgba(94,92,230,0.12)', color: '#5e5ce6', borderRadius: 980, padding: '3px 10px' }}>{item.model}</span>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#1d1d1f', flexShrink: 0 }}>
              <X size={16} />
            </button>
          </div>
          <p style={{ fontSize: 15, color: '#1d1d1f', lineHeight: 1.7, margin: '0 0 20px', fontFamily: 'monospace' }}>{item.prompt}</p>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <CopyButton text={item.prompt} />
            <button
              onClick={() => onLike(item.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, background: item.liked ? '#ff375f' : 'rgba(0,0,0,0.06)', color: item.liked ? '#fff' : '#1d1d1f', border: 'none', borderRadius: 980, padding: '6px 14px', fontSize: 12, cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <Heart size={12} fill={item.liked ? '#fff' : 'none'} /> {item.likes}
            </button>
            <button
              onClick={() => onFavorite(item.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, background: item.favorited ? '#ff9500' : 'rgba(0,0,0,0.06)', color: item.favorited ? '#fff' : '#1d1d1f', border: 'none', borderRadius: 980, padding: '6px 14px', fontSize: 12, cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <Bookmark size={12} fill={item.favorited ? '#fff' : 'none'} /> {item.favorited ? '已收藏' : '收藏'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export function GallerySection() {
  const [items, setItems] = useState([])
  const [selected, setSelected] = useState(null)

  async function load() {
    try {
      const resp = await apiFetch('/api/gallery')
      const data = await resp.json()
      if (!Array.isArray(data)) return
      setItems(data)
      if (selected) setSelected(data.find(i => i.id === selected.id) || null)
    } catch {}
  }

  useEffect(() => { load() }, [])

  async function handleLike(id) {
    await apiFetch(`/api/gallery/${id}/like`, {
      method: 'POST',
      body: JSON.stringify({ userId: getUserId() }),
    })
    load()
  }

  async function handleFavorite(id) {
    await apiFetch(`/api/gallery/${id}/favorite`, {
      method: 'POST',
      body: JSON.stringify({ userId: getUserId() }),
    })
    load()
  }

  return (
    <section style={{ padding: '100px 0', background: '#fff' }}>
      <div className="section-container">
        <motion.div
          style={{ textAlign: 'center', marginBottom: 56 }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 600, color: '#1d1d1f', marginBottom: 12 }}>
            提示词效果展示
          </h2>
          <p style={{ fontSize: 17, color: '#6e6e73' }}>点击图片查看完整提示词，一键复制使用</p>
        </motion.div>

        <div style={{ columns: 'auto 280px', columnGap: 16 }}>
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              onClick={() => setSelected(item)}
              style={{ breakInside: 'avoid', marginBottom: 16, borderRadius: 20, overflow: 'hidden', cursor: 'pointer', position: 'relative', display: 'block' }}
              whileHover={{ scale: 1.02 }}
            >
              <img src={item.img} alt={item.prompt} style={{ width: '100%', display: 'block', borderRadius: 20 }} />
              <motion.div
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 50%)',
                  borderRadius: 20, display: 'flex', flexDirection: 'column',
                  justifyContent: 'flex-end', padding: 16, gap: 10,
                }}
              >
                <p style={{ color: '#fff', fontSize: 13, lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {item.prompt}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#aeaeb2' }}>{item.model}</span>
                    <span style={{ fontSize: 11, color: item.liked ? '#ff375f' : '#aeaeb2', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Heart size={10} fill={item.liked ? '#ff375f' : 'none'} stroke={item.liked ? '#ff375f' : '#aeaeb2'} /> {item.likes}
                    </span>
                  </div>
                  <CopyButton text={item.prompt} />
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <LightboxModal
            item={selected}
            onClose={() => setSelected(null)}
            onLike={handleLike}
            onFavorite={handleFavorite}
          />
        )}
      </AnimatePresence>
    </section>
  )
}
