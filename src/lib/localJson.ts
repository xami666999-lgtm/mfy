export async function localJson<T = any>(file: string): Promise<T> {
  const res = await fetch(`./data/${file}`)
  if (!res.ok) throw new Error(file)
  return res.json()
}
