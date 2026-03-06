// 匿名用户 ID，首次访问自动生成并存入 localStorage
export function getUserId() {
  let id = localStorage.getItem('ppo_uid')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('ppo_uid', id)
  }
  return id
}
