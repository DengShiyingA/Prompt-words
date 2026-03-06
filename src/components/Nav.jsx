import { useScroll, useMotionValueEvent } from 'framer-motion'
import { useState } from 'react'
import { Bookmark } from 'lucide-react'

export function Nav({ onFavClick }) {
  return (
    <nav className="nav">
      <div className="nav-content">
        <span>&#9670;</span>
        <span style={{ flex: 1 }} />
        <button
          onClick={onFavClick}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#1d1d1f', fontSize: 12, padding: '4px 10px',
            borderRadius: 980, transition: 'background 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.06)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <Bookmark size={14} />
          我的收藏
        </button>
      </div>
    </nav>
  )
}

export function SubNav() {
  const [scrolled, setScrolled] = useState(false)
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, 'change', (v) => {
    setScrolled(v > 50)
  })

  return (
    <div className={`sub-nav${scrolled ? ' scrolled' : ''}`}>
      <div className="sub-nav-content">
        <div className="sub-nav-title">提示词展示</div>
      </div>
    </div>
  )
}
