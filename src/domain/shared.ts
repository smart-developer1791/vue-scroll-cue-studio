import { stamp, escapeXml } from '../services/files.ts'
export const author = 'CodeSculptor'
export function single(value: unknown, label: string, max: number, empty = false): string {
  if (
    typeof value !== 'string' ||
    value.length > max ||
    (!empty && !value.trim()) ||
    /[\u0000-\u001F\u007F]/.test(value)
  )
    throw new Error(`${label} must be ${empty ? 'at most' : '1–'}${max} single-line characters.`)
  return value
}
export function id(value: unknown): string {
  const parsed = single(value, 'Identity', 40)
  if (
    !/^[a-z][a-z0-9-]*$/.test(parsed) ||
    ['constructor', 'prototype', '__proto__'].includes(parsed)
  )
    throw new Error('Identity must use a safe lowercase name.')
  return parsed
}
export function provenance(prefix: string, project: string, value: unknown) {
  return { project, author, marker: stamp(prefix, value) }
}
export function htmlDocument(title: string, body: string, marker: string) {
  return `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="author" content="${author}"><meta name="project-marker" content="${marker}"><title>${escapeXml(title)}</title><style>*,*::before,*::after{box-sizing:border-box}body{margin:0 auto;max-width:900px;padding:32px 20px;font:16px/1.7 system-ui,sans-serif;color:#292632;background:#fff}h1,h2,p,a,li{overflow-wrap:anywhere}a{color:#306e64}a:focus-visible{outline:3px solid;outline-offset:3px}section{padding:24px 0;border-bottom:1px solid #ddd}small{color:#6a6572}nav a{display:inline-block;margin:4px 12px 4px 0}pre{white-space:pre-wrap}footer{margin-top:40px;color:#6a6572}@media print{body{max-width:none;padding:0}nav{display:none}section{break-inside:avoid}}</style></head><body>${body}<footer>${marker} · ${author}</footer></body></html>`
}
