export function hashPassword(password: string): string {
  let hash = 5381
  const str = password + ':em_salt_v1'
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i)
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}
