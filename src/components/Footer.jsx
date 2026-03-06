export function Footer() {
  return (
    <footer>
      <div className="footer-content">
        <p>1. 本站内容均来自网络收集整理，仅供学习参考。</p>
        <p>2. 提示词效果因模型版本及平台不同可能存在差异。</p>
        <div className="footer-line" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <span>版权所有 &copy; 2026 提示词效果库. 保留所有权利。</span>
          <div style={{ display: 'flex', gap: '24px' }}>
            <a href="#">隐私政策</a>
            <a href="#">使用条款</a>
            <a href="#">关于我们</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
