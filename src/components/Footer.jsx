export function Footer() {
  return (
    <footer>
      <div className="footer-content">
        <p>1. 提示词专业版功能需要订阅后使用。</p>
        <p>2. 实际性能可能因所选模型及网络连接状况而有所差异。</p>
        <div className="footer-line" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <span>版权所有 &copy; 2026 Prompt Inc. 保留所有权利。</span>
          <div style={{ display: 'flex', gap: '24px' }}>
            <a href="#">隐私政策</a>
            <a href="#">使用条款</a>
            <a href="#">销售与退款</a>
            <a href="#">网站地图</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
