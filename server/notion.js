import { Client } from '@notionhq/client'

// 懒加载：等 .env 加载完再创建客户端
let _notion = null
function getNotion() {
  if (!_notion) _notion = new Client({ auth: process.env.NOTION_TOKEN })
  return _notion
}

// 缓存，60 秒过期
const cache = new Map()
function cached(key, fn, ttl = 60_000) {
  const hit = cache.get(key)
  if (hit && Date.now() - hit.ts < ttl) return Promise.resolve(hit.data)
  return fn().then(data => {
    cache.set(key, { data, ts: Date.now() })
    return data
  })
}
export function clearCache() { cache.clear() }

// ── 工具：从 Notion property 取值 ───────────────────────
function text(prop) {
  if (!prop) return ''
  if (prop.type === 'title') return prop.title.map(t => t.plain_text).join('')
  if (prop.type === 'rich_text') return prop.rich_text.map(t => t.plain_text).join('')
  if (prop.type === 'select') return prop.select?.name || ''
  if (prop.type === 'multi_select') return prop.multi_select.map(s => s.name)
  if (prop.type === 'url') return prop.url || ''
  if (prop.type === 'files') {
    const f = prop.files[0]
    if (!f) return ''
    return f.type === 'external' ? f.external.url : f.file.url
  }
  return ''
}

// 直接获取某个 page 的最新图片 URL（用于代理接口，绕过过期问题）
export async function fetchPageImageUrl(pageId) {
  const page = await getNotion().pages.retrieve({ page_id: pageId })
  return text(page.properties['Image'])
}

// ── Gallery：从 Notion 数据库读取图片 ────────────────────
// Notion 数据库列（属性名区分大小写）：
//   Name (title)           - 图片标题
//   Image (files & media)  - 上传的图片文件
//   Prompt (rich_text)     - 提示词
//   Model (select)         - 模型名称
//   Tags (multi_select)    - 标签
export async function fetchGallery() {
  return cached('gallery', async () => {
    const dbId = process.env.NOTION_GALLERY_DB
    if (!dbId) return []
    const response = await getNotion().dataSources.query({
      database_id: dbId,
      filter: { property: 'Image', files: { is_not_empty: true } },
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
    })
    return response.results.map(page => ({
      id: page.id,
      // img 指向我们自己的代理接口，避免 Notion 临时 URL 过期
      img: `/api/img/${page.id}`,
      prompt: text(page.properties['Prompt']),
      model: text(page.properties['Model']),
      tags: text(page.properties['Tags']),
      created_at: Math.floor(new Date(page.created_time).getTime() / 1000),
    }))
  })
}

// ── Prompts：从 Notion 数据库读取提示词 ──────────────────
// Notion 数据库列：
//   Name (title)      - 提示词标题
//   Category (select) - 分类（写作/编程/分析/设计）
//   Desc (rich_text)  - 简短描述
//   Text (rich_text)  - 提示词正文
export async function fetchPrompts() {
  return cached('prompts', async () => {
    const dbId = process.env.NOTION_PROMPTS_DB
    if (!dbId) return {}
    const response = await getNotion().dataSources.query({
      database_id: dbId,
      sorts: [{ property: 'Category', direction: 'ascending' }],
    })
    const map = {}
    for (const page of response.results) {
      const category = text(page.properties['Category']) || '其他'
      if (!map[category]) map[category] = []
      map[category].push({
        id: page.id,
        category,
        title: text(page.properties['Name']),
        desc: text(page.properties['Desc']),
        text: text(page.properties['Text']),
      })
    }
    return map
  })
}
