import { record, list, unique, choice, text } from './validation.ts'
import { single, id, provenance, htmlDocument } from './shared.ts'
import { escapeXml } from '../services/files.ts'
export type Section = { id: string; title: string; body: string }
export type Workspace = {
  version: 1
  name: string
  introduction: string
  density: 'comfortable' | 'compact'
  sections: Section[]
}
export const sample: Workspace = {
  version: 1,
  name: 'A small guide to a shared garden',
  introduction:
    'Five little chapters for making a place where people and plants can grow together.',
  density: 'comfortable',
  sections: [
    {
      id: 'begin',
      title: 'Begin with a conversation',
      body: 'Ask what people would like to grow, and what they already know. A shared garden begins with listening.\n\nMake space for someone who has never held a trowel. One friendly invitation can change how a place feels.\n\nWrite down a small first step that everyone can recognise.',
    },
    {
      id: 'find',
      title: 'Find a patch of possibility',
      body: 'Notice the light, the path to water, and the places where people already gather. Walk around at a few different times of day.\n\nA modest space that is easy to reach can be more useful than a beautiful place that is hard to visit.\n\nAgree who can help care for the space before planting begins.',
    },
    {
      id: 'plant',
      title: 'Plant something forgiving',
      body: 'Choose a few plants suited to the place and the season. Leave room between them, and room for questions.\n\nKeep the first planting small enough to care for together. Mark what went where; a pencil and a simple label are enough.\n\nGive someone new the chance to plant the first seed.',
    },
    {
      id: 'tend',
      title: 'Make care a shared rhythm',
      body: 'A clear watering plan is kinder than a hopeful guess. Decide how people will notice when a task needs doing.\n\nShare what worked as well as what did not. Leave a short note for the next person, and make it easy to ask for help.\n\nA garden changes. Let the plan change with it.',
    },
    {
      id: 'share',
      title: 'Share what grows',
      body: 'Celebrate the small things: a new leaf, a useful conversation, a person returning for a second visit.\n\nShare the harvest with people who helped and people who are curious. Keep a little space for a new idea next season.\n\nThe garden is a place to grow things, and a place to belong.',
    },
  ],
}
export function parseSection(value: unknown): Section {
  const o = record(value, 'Section')
  return {
    id: id(o.id),
    title: single(o.title, 'Section title', 80),
    body: text(o.body, 'Section body', 3000),
  }
}
export function parseWorkspace(value: unknown): Workspace {
  const o = record(value, 'Workspace')
  if (o.version !== 1) throw new Error('Expected SC/1 workspace.')
  const sections = list(o.sections, 'Sections', 12).map(parseSection)
  if (sections.length < 2) throw new Error('Keep at least two sections.')
  unique(
    sections.map((s) => s.id),
    'Section identities',
  )
  return {
    version: 1,
    name: single(o.name, 'Page title', 80),
    introduction: single(o.introduction, 'Introduction', 240, true),
    density: choice(o.density, 'Reading density', ['comfortable', 'compact']),
    sections,
  }
}
export function paragraphs(body: string) {
  return body
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean)
}
export function activeSection(positions: { id: string; top: number }[], position: number) {
  return positions.reduce(
    (current, item) => (item.top <= position ? item.id : current),
    positions[0]?.id ?? '',
  )
}
export function scrollProgress(top: number, total: number, viewport: number) {
  return total <= viewport
    ? 100
    : Math.round(Math.max(0, Math.min(1, top / (total - viewport))) * 100)
}
export function exportWorkspace(value: Workspace) {
  const w = parseWorkspace(value)
  return { ...w, provenance: provenance('SC', 'vue-scroll-cue-studio', w) }
}
export function exportHtml(value: Workspace) {
  const w = parseWorkspace(value),
    marker = exportWorkspace(w).provenance.marker
  return htmlDocument(
    w.name,
    `<header><small>SCROLL CUE READING PAGE</small><h1>${escapeXml(w.name)}</h1><p>${escapeXml(w.introduction)}</p></header><nav aria-label="Chapters">${w.sections.map((s, i) => `<a href="#${s.id}">${i + 1}. ${escapeXml(s.title)}</a>`).join('')}</nav>${w.sections
      .map(
        (s) =>
          `<section id="${s.id}" tabindex="-1"><h2>${escapeXml(s.title)}</h2>${paragraphs(s.body)
            .map((p) => `<p>${escapeXml(p)}</p>`)
            .join('')}</section>`,
      )
      .join('')}`,
    marker,
  )
}
