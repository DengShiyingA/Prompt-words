import { motion, AnimatePresence } from 'framer-motion'
import { X, Heart, Bookmark } from 'lucide-react'
import { useState, useEffect } from 'react'
import { apiFetch } from '../lib/api'
import { getUserId } from '../lib/userId'

export function FavoritesDrawer({ open, onClose }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const resp = await apiFetch('/api/favorites')
      const data = await resp.json()
      setItems(Array.isArray(data) ? data : [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    if (open) load()
  }, [open])

  async function handleUnfavorite(id) {
    await apiFetch(`/api/gallery/${id}/favorite`, {
      method: 'POST',
      body: JSON.stringify({ userId: getUserId() }),
    })
    setItems(prev => prev.filter(i => i.id !== id))
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* 遮罩 */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          />
          {/* 抽屉 */}
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 9999,
              width: 380, maxWidth: '90vw',
              background: '#fff', boxShadow: '-4px 0 40px rgba(0,0,0,0.12)',
              display: 'flex', flexDirection: 'column',
            }}
          >
            {/* 头部 */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bookmark size={18} fill="#ff9500" stroke="#ff9500" />
                <span style={{ fontSize: 16, fontWeight: 600 }}>我的收藏</span>
                {items.length > 0 && (
                  <span style={{ fontSize: 12, background: '#f5f5f7', color: '#6e6e73', borderRadius: 980, padding: '2px 8px' }}>{items.length}</span>
                )}
              </div>
              <button onClick={onClose} style={{ background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            {/* 内容 */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#6e6e73', fontSize: 14 }}>加载中...</div>
              ) : items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <Bookmark size={40} color="#d1d1d6" style={{ marginBottom: 12 }} />
                  <p style={{ color: '#6e6e73', fontSize: 14, margin: 0 }}>还没有收藏</p>
                  <p style={{ color: '#aeaeb2', fontSize: 12, marginTop: 6 }}>点击图片上的书签图标来收藏</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {items.map(item => (
                    <div key={item.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 12px', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', background: '#fafafa' }}>
                      <img
                        src={item.img} alt=""
                        style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 10, flexShrink: 0, background: '#f0f0f0' }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 12, color: '#1d1d1f', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>
                          {item.prompt || '（无提示词）'}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
                          <span style={{ fontSize: 11, color: '#aeaeb2' }}>{item.model || '未知模型'}</span>
                          <span style={{ fontSize: 11, color: '#aeaeb2', display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Heart size={9} fill="#ff375f" stroke="#ff375f" /> {item.likes}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnfavorite(item.id)}
                        title="取消收藏"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, color: '#ff9500', flexShrink: 0 }}
                      >
                        <Bookmark size={16} fill="#ff9500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
