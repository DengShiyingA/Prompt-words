import { useScroll, useMotionValueEvent } from 'framer-motion'
import { useState } from 'react'

export function Nav() {
  return (
    <nav className="nav">
      <div className="nav-content">
        <span>&#9670;</span>
        <ul className="nav-links">
          {['写作', '编程', '分析', '设计', '支持'].map((item) => (
            <li key={item}><a href="#">{item}</a></li>
          ))}
        </ul>
        <span style={{ width: 16 }} />
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
        <div className="sub-nav-title">提示词专业版</div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <a href="#" style={{ fontSize: '12px', color: '#6e6e73' }}>概览</a>
          <a href="#" style={{ fontSize: '12px', color: '#6e6e73' }}>定价</a>
          <button className="buy-button">立即订阅</button>
        </div>
      </div>
    </div>
  )
}
