import Database from 'better-sqlite3'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const db = new Database(resolve(__dir, 'data.db'))

db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS gallery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    img TEXT NOT NULL,
    prompt TEXT NOT NULL,
    model TEXT NOT NULL DEFAULT '',
    tags TEXT NOT NULL DEFAULT '[]',
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS prompts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    desc TEXT NOT NULL DEFAULT '',
    text TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gallery_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    UNIQUE(gallery_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gallery_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    UNIQUE(gallery_id, user_id)
  );
`)

// 初始数据（首次运行时插入）
const count = db.prepare('SELECT COUNT(*) as n FROM gallery').get()
if (count.n === 0) {
  const insertGallery = db.prepare('INSERT INTO gallery (img, prompt, model, tags) VALUES (?, ?, ?, ?)')
  const items = [
    ['https://images.unsplash.com/photo-1686191128892-3b37add4c844?w=800&q=80', 'A futuristic city at night, neon lights reflecting on wet streets, cinematic lighting, 8K, photorealistic, blade runner aesthetic', 'Midjourney v6', '["赛博朋克","城市","夜景"]'],
    ['https://images.unsplash.com/photo-1682687221038-404670f09ef1?w=800&q=80', 'Portrait of a woman with galaxy swirling in her eyes, ethereal glow, ultra detailed, oil painting style, dramatic lighting', 'DALL-E 3', '["人像","奇幻","星空"]'],
    ['https://images.unsplash.com/photo-1693591565869-0c1e8b877d9b?w=800&q=80', 'Ancient Japanese temple in autumn forest, morning mist, golden hour, studio ghibli style, peaceful atmosphere, high detail', 'Stable Diffusion XL', '["日式","建筑","秋天"]'],
    ['https://images.unsplash.com/photo-1699190861691-d3ae4ae1fab7?w=800&q=80', 'Abstract fluid art, vibrant colors melting together, macro photography, iridescent surface, ultra high resolution', 'Midjourney v6', '["抽象","流体","色彩"]'],
    ['https://images.unsplash.com/photo-1681400693157-3fc98e6ef7d3?w=800&q=80', 'Snow-covered mountain peak at sunrise, dramatic clouds, god rays, landscape photography, professional grade, award winning', 'Stable Diffusion XL', '["山脉","雪景","日出"]'],
    ['https://images.unsplash.com/photo-1686595032079-1e1e2c1f4c8c?w=800&q=80', 'Deep ocean scene with bioluminescent creatures, dark blue water, ethereal light rays, documentary photography style, 4K', 'DALL-E 3', '["海洋","生物","发光"]'],
  ]
  for (const row of items) insertGallery.run(...row)

  const insertPrompt = db.prepare('INSERT INTO prompts (category, title, desc, text) VALUES (?, ?, ?, ?)')
  const prompts = [
    ['写作', '爆款小红书文案', '生成带话题标签的种草文案', '你是一位小红书爆款文案专家。请根据以下产品/主题，写一篇吸引眼球的小红书笔记，包含：①引人入胜的标题（含emoji）②3-5个核心卖点 ③真实感强的使用体验描述 ④5个相关话题标签。产品/主题：[在此填写]'],
    ['写作', '邮件润色', '将口语化邮件改写为专业表达', '请将以下邮件改写为专业、简洁、礼貌的商务邮件，保持原意不变，去除口语化表达，语气友好但正式。原始邮件：[在此粘贴]'],
    ['写作', '故事创作', '快速搭建有吸引力的故事框架', '请帮我创作一个短篇故事大纲，包含：①吸引人的开场（制造悬念）②主角动机与冲突 ③3个关键转折点 ④令人回味的结局。故事类型：[类型] 核心主题：[主题]'],
    ['编程', 'Code Review', '全面审查代码质量与安全性', '请对以下代码进行专业 Code Review，重点检查：①逻辑错误与边界情况 ②性能瓶颈 ③安全漏洞 ④代码可读性与命名规范 ⑤给出具体改进建议。代码：\n```\n[在此粘贴代码]\n```'],
    ['编程', '解释代码', '用简单语言解释复杂代码逻辑', '请用简单易懂的语言解释以下代码的功能和运行逻辑，假设读者是初学者。然后指出代码中值得注意的技巧或潜在问题。代码：\n```\n[在此粘贴代码]\n```'],
    ['编程', '写单元测试', '自动生成完整的测试用例', '请为以下函数/模块编写完整的单元测试，覆盖：①正常输入情况 ②边界值 ③异常输入和错误处理。使用 [Jest/PyTest/其他框架] 格式。代码：\n```\n[在此粘贴代码]\n```'],
    ['分析', '文档总结', '快速提取长文档的核心信息', '请对以下文档进行结构化总结，输出格式：①一句话核心结论 ②3-5个关键要点 ③值得关注的数据或细节 ④我需要采取的行动（如有）。文档内容：[在此粘贴]'],
    ['分析', '竞品分析', '系统对比产品优劣势', '请对 [产品A] 和 [产品B] 进行竞品分析，从以下维度对比：①核心功能 ②目标用户 ③定价策略 ④优势与不足 ⑤市场定位。最后给出简短的战略建议。'],
    ['分析', '决策分析', '用结构化思维辅助重要决策', '我需要做一个决策：[描述决策]。请帮我分析：①各选项的优缺点对比 ②短期和长期影响 ③关键风险点 ④你的推荐方案及理由。'],
    ['设计', 'UI 设计反馈', '专业角度审查界面设计', '请从专业 UI/UX 设计师角度，对以下界面设计提供反馈，涵盖：①视觉层次与信息架构 ②配色与对比度 ③字体排版 ④交互逻辑 ⑤改进建议。设计描述：[在此描述]'],
    ['设计', '品牌命名', '生成有记忆点的品牌名称', '请为以下产品/服务生成10个品牌名称候选，要求：①简洁好记 ②与品牌调性匹配 ③中英文都考虑 ④每个名称附简短说明。产品描述：[在此填写] 品牌调性：[例如：专业、年轻、科技感]'],
    ['设计', '配色方案', '生成专业配色建议', '请为以下场景推荐3套配色方案，每套包含：主色、辅助色、强调色、背景色（提供十六进制色值）并说明配色逻辑。设计场景：[例如：科技产品官网] 风格偏好：[例如：现代简约]'],
  ]
  for (const row of prompts) insertPrompt.run(...row)
}

export default db
