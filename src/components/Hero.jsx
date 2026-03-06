import { motion, useScroll, useTransform } from 'framer-motion'

export function Hero() {
  const { scrollY } = useScroll()
  const scale = useTransform(scrollY, [0, 500], [1, 1.2])
  const opacity = useTransform(scrollY, [0, 300], [1, 0])

  return (
    <section className="hero section-container">
      <motion.div style={{ opacity }}>
        <p className="hero-subtitle">提示词专业版</p>
        <h1 className="hero-title text-gradient">
          为你的日常 AI 工作流<br />打造的最强工具。
        </h1>
      </motion.div>

      <div className="hero-visual">
        <motion.div
          className="orb"
          style={{ scale }}
          animate={{ boxShadow: ['0 0 80px 20px rgba(94,92,230,0.2)', '0 0 120px 40px rgba(94,92,230,0.35)', '0 0 80px 20px rgba(94,92,230,0.2)'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="orb-ring"
          animate={{ rotateZ: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      <motion.p
        style={{ opacity, fontSize: '17px', color: '#6e6e73', maxWidth: 600, textAlign: 'center' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        简单得像魔法一样。
      </motion.p>
    </section>
  )
}
