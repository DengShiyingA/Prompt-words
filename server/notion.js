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
export async function fetchPageImageUrl(pageId, field = '图片 Image') {
  const page = await getNotion().pages.retrieve({ page_id: pageId })
  return text(page.properties[field])
}

// ── Gallery：从 Notion 数据库读取图片 ────────────────────
// Notion 数据库列（属性名区分大小写）：
//   标题 Name (title)           - 图片标题
//   图片 Image (files & media)  - 上传的图片文件
//   提示词 Prompt (rich_text)   - 提示词
//   模型 Model (select)         - 模型名称
//   标签 Tags (multi_select)    - 标签
export async function fetchGallery() {
  return cached('gallery', async () => {
    const dbId = process.env.NOTION_GALLERY_DB
    if (!dbId) return []
    const response = await getNotion().databases.query({
      database_id: dbId,
      filter: { property: '图片 Image', files: { is_not_empty: true } },
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
    })
    return response.results.map(page => ({
      id: page.id,
      img: `/api/img/${page.id}`,
      prompt: text(page.properties['提示词 Prompt']),
      model: text(page.properties['模型 Model']),
      tags: text(page.properties['标签 Tags']),
      created_at: Math.floor(new Date(page.created_time).getTime() / 1000),
    }))
  })
}

// ── Videos：从 Notion 数据库读取视频提示词 ────────────────
// 字段：标题 Name(title) | 视频链接 Video_URL(url) | 封面图 Cover(files) | 提示词 Prompt(rich_text) | 模型 Model(select) | 标签 Tags(multi_select)
export async function fetchVideos() {
  return cached('videos', async () => {
    const dbId = process.env.NOTION_VIDEO_DB
    if (!dbId) return []
    const response = await getNotion().databases.query({
      database_id: dbId,
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
    })
    return response.results.map(page => ({
      id: page.id,
      title: text(page.properties['标题 Name']),
      video_url: text(page.properties['视频链接 Video_URL']),
      cover: text(page.properties['封面图 Cover']) ? `/api/img/${page.id}?field=封面图 Cover` : null,
      prompt: text(page.properties['提示词 Prompt']),
      model: text(page.properties['模型 Model']),
      tags: text(page.properties['标签 Tags']),
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
    const response = await getNotion().databases.query({
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
