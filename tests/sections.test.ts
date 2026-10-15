import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  sample,
  parseWorkspace,
  paragraphs,
  activeSection,
  scrollProgress,
  exportWorkspace,
  exportHtml,
} from '../src/domain/sections.ts'
test('sample and provenance round-trip with detached content and canonical order', () => {
  const fixture = JSON.parse(
    readFileSync(new URL('../public/sample-workspace.json', import.meta.url), 'utf8'),
  )
  assert.deepEqual(exportWorkspace(sample), fixture)
  assert.deepEqual(parseWorkspace(fixture), sample)
  const w = parseWorkspace(sample)
  w.sections[0]!.body = 'Changed'
  assert.notEqual(w.sections[0]!.body, sample.sections[0]!.body)
  assert.notEqual(exportWorkspace(w).provenance.marker, fixture.provenance.marker)
})
test('strict bounded sections reject enum arrays, invalid identities, and empty content', () => {
  for (const value of [
    { ...sample, name: ['x'] },
    { ...sample, density: ['compact'] },
    { ...sample, sections: sample.sections.slice(0, 1) },
    { ...sample, sections: [sample.sections[0], sample.sections[0]] },
    { ...sample, sections: [{ ...sample.sections[0], body: ' ' }, sample.sections[1]] },
    { ...sample, sections: [{ ...sample.sections[0], id: 'constructor' }, sample.sections[1]] },
    {
      ...sample,
      sections: [{ ...sample.sections[0], body: 'x'.repeat(3001) }, sample.sections[1]],
    },
  ])
    assert.throws(() => parseWorkspace(value))
})
test('paragraphs preserve plain text and split blank lines with CRLF', () => {
  assert.deepEqual(paragraphs(' One line\r\n\r\nSecond\ncontinuation\n\n  Third '), [
    'One line',
    'Second\ncontinuation',
    'Third',
  ])
  assert.equal(paragraphs(sample.sections[0]!.body).length, 3)
})
test('active chapter follows ordered DOM positions including reorder and leading space', () => {
  const items = [
    { id: 'third', top: 100 },
    { id: 'first', top: 400 },
    { id: 'second', top: 700 },
  ]
  assert.equal(activeSection(items, 0), 'third')
  assert.equal(activeSection(items, 450), 'first')
  assert.equal(activeSection(items, 1000), 'second')
  assert.equal(activeSection([], 0), '')
})
test('reading progress is bounded and short pages count as completely visible', () => {
  assert.equal(scrollProgress(0, 1000, 500), 0)
  assert.equal(scrollProgress(250, 1000, 500), 50)
  assert.equal(scrollProgress(500, 1000, 500), 100)
  assert.equal(scrollProgress(900, 1000, 500), 100)
  assert.equal(scrollProgress(-20, 1000, 500), 0)
  assert.equal(scrollProgress(0, 300, 500), 100)
})
test('exported page contains escaped chapters, valid anchor identities, and no runtime code', () => {
  const w = {
    ...sample,
    name: '<script>title</script>',
    sections: sample.sections.map((s, i) => ({
      ...s,
      title: `Chapter ${i} & <word>`,
      body: '<img src=x onerror=boom>\n\nA second paragraph.',
    })),
  }
  const html = exportHtml(w)
  for (const s of w.sections) {
    assert.ok(html.includes(`href="#${s.id}"`))
    assert.ok(html.includes(`id="${s.id}"`))
  }
  assert.ok(html.includes('&lt;img src=x onerror=boom&gt;'))
  assert.equal(html.includes('<script>'), false)
  assert.match(html, /SC-[A-F0-9]{8}/)
})
