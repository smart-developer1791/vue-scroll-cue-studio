<script setup lang="ts">
import { ref, computed } from 'vue'
import StudioHeader from './components/StudioHeader.vue'
import DataTools from './components/DataTools.vue'
import AppDialog from './components/AppDialog.vue'
import ReadingPreview from './components/ReadingPreview.vue'
import { useDraft } from './services/draft'
import { download } from './services/files'
import {
  sample,
  parseWorkspace,
  parseSection,
  exportWorkspace,
  exportHtml,
  type Section,
} from './domain/sections'
const { draft, storageStatus } = useDraft('vue-scroll-cue-studio:v1', sample, parseWorkspace)
const selectedId = ref(draft.value.sections[0]!.id)
const selected = computed(
  () => draft.value.sections.find((s) => s.id === selectedId.value) ?? draft.value.sections[0]!,
)
const form = ref({ ...selected.value }),
  nameDraft = ref(draft.value.name),
  introductionDraft = ref(draft.value.introduction)
const error = ref(''),
  pageError = ref(''),
  removeOpen = ref(false)
const marker = computed(() => exportWorkspace(draft.value).provenance.marker)
const serialize = (value: unknown) => exportWorkspace(parseWorkspace(value))
function edit(section: Section) {
  selectedId.value = section.id
  form.value = { ...section }
  error.value = ''
}
function replace(value: unknown) {
  const w = parseWorkspace(value)
  draft.value = w
  nameDraft.value = w.name
  introductionDraft.value = w.introduction
  pageError.value = ''
  edit(w.sections[0]!)
}
function savePage() {
  try {
    draft.value = parseWorkspace({
      ...draft.value,
      name: nameDraft.value,
      introduction: introductionDraft.value,
    })
    pageError.value = ''
  } catch (e) {
    pageError.value = (e as Error).message
  }
}
function saveSection() {
  try {
    const section = parseSection(form.value)
    draft.value = parseWorkspace({
      ...draft.value,
      sections: draft.value.sections.map((s) => (s.id === section.id ? section : s)),
    })
    edit(section)
  } catch (e) {
    error.value = (e as Error).message
  }
}
function add() {
  const section = {
    id: `chapter-${crypto.randomUUID().slice(0, 8)}`,
    title: 'A new little chapter',
    body: 'Begin with one clear thought. Add the next paragraph when it is ready.',
  }
  draft.value = parseWorkspace({ ...draft.value, sections: [...draft.value.sections, section] })
  edit(section)
}
function move(delta: number) {
  const sections = [...draft.value.sections],
    index = sections.findIndex((s) => s.id === selectedId.value),
    target = index + delta
  if (target < 0 || target >= sections.length) return
  const item = sections.splice(index, 1)[0]!
  sections.splice(target, 0, item)
  draft.value = parseWorkspace({ ...draft.value, sections })
}
function remove() {
  draft.value = parseWorkspace({
    ...draft.value,
    sections: draft.value.sections.filter((s) => s.id !== selectedId.value),
  })
  edit(draft.value.sections[0]!)
  removeOpen.value = false
}
function saveHtml() {
  download(`${marker.value}.html`, exportHtml(draft.value), 'text/html;charset=utf-8')
}
const position = computed(() => draft.value.sections.findIndex((s) => s.id === selectedId.value))
function setDensity(event: Event) {
  draft.value = parseWorkspace({
    ...draft.value,
    density: (event.target as HTMLSelectElement).value,
  })
}
</script>
<template>
  <div
    data-project="vue-scroll-cue-studio"
    data-author="CodeSculptor"
    :data-marker="marker"
    class="min-h-screen"
  >
    <StudioHeader
      title="Scroll Cue Studio"
      subtitle="Small chapters. A clear sense of place."
      code="SC"
      ><DataTools
        :workspace="draft"
        :sample="sample"
        :parse="parseWorkspace"
        :serialize="serialize"
        @replace="replace"
        ><button
          class="border-accent! bg-accent text-on-accent hover:brightness-110"
          @click="saveHtml"
        >
          HTML
        </button></DataTools
      ></StudioHeader
    >
    <main class="mx-auto max-w-[1500px] px-5 py-7 md:px-8">
      <div class="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div class="min-w-0">
          <p class="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            A WAY THROUGH THE WORDS
          </p>
          <h1 class="max-w-4xl break-words text-3xl font-semibold leading-tight sm:text-4xl">
            {{ draft.name }}
          </h1>
          <p class="mt-3 max-w-xl leading-relaxed text-muted">
            Build a short reading page, follow the chapters, and see how the flow feels.
          </p>
        </div>
        <span class="rounded-full border border-line bg-surface px-3 py-2 text-xs text-muted">{{
          storageStatus
        }}</span>
      </div>
      <div data-ui="workspace" class="grid min-w-0 gap-5 xl:grid-cols-[310px_minmax(0,1fr)_320px]">
        <section
          class="min-w-0 rounded-2xl border border-line bg-surface p-5"
          aria-labelledby="page-heading"
        >
          <h2 id="page-heading" class="mb-5 text-lg font-semibold">Give it a shape</h2>
          <form @submit.prevent="savePage">
            <label>Page title<input v-model="nameDraft" maxlength="80" /></label
            ><label class="mt-4"
              >Introduction<textarea
                v-model="introductionDraft"
                maxlength="240"
                rows="3"
                class="resize-none"
              /></label
            ><button type="submit" class="mt-3 w-full bg-soft hover:bg-accent/10">
              Save page details
            </button>
            <p class="mt-2 h-10 overflow-auto text-xs text-danger" role="alert">{{ pageError }}</p>
          </form>
          <label
            >Reading density<select :value="draft.density" @change="setDensity">
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
            </select></label
          >
          <div class="mt-5 flex items-center justify-between gap-2">
            <h3 class="text-sm font-semibold">Chapters</h3>
            <button
              class="bg-soft px-2! text-xs! hover:bg-accent/10"
              :disabled="draft.sections.length >= 12"
              @click="add"
            >
              Add chapter
            </button>
          </div>
          <div
            class="mt-3 h-[245px] overflow-y-auto rounded-xl border border-line p-2"
            role="region"
            tabindex="0"
            aria-label="Editable chapters"
          >
            <button
              v-for="(section, index) in draft.sections"
              :key="section.id"
              class="mb-2 w-full min-w-0 justify-start! text-left hover:bg-soft"
              :class="selectedId === section.id ? 'border-accent! bg-soft' : 'border-transparent!'"
              :aria-pressed="selectedId === section.id"
              @click="edit(section)"
            >
              <span class="shrink-0 text-xs text-accent">{{ index + 1 }}.</span
              ><span class="truncate">{{ section.title }}</span>
            </button>
          </div>
          <p class="mt-4 text-xs leading-relaxed text-muted">
            Plain text, one idea at a time. Separate paragraphs with an empty line.
          </p>
        </section>
        <ReadingPreview :workspace="draft" />
        <section
          data-ui="chapter-editor"
          class="min-w-0 rounded-2xl border border-line bg-surface p-5"
          aria-labelledby="chapter-heading"
        >
          <h2 id="chapter-heading" class="mb-5 text-lg font-semibold">Work on a chapter</h2>
          <form class="h-[515px] overflow-y-auto" @submit.prevent="saveSection">
            <label>Chapter title<input v-model="form.title" maxlength="80" /></label
            ><label class="mt-4"
              >Chapter text<textarea
                v-model="form.body"
                maxlength="3000"
                rows="11"
                class="resize-none"
              />
            </label>
            <p class="mt-3 h-10 overflow-auto text-xs text-danger" role="alert">{{ error }}</p>
            <button
              type="submit"
              class="w-full border-accent! bg-accent text-on-accent hover:brightness-110"
            >
              Save chapter
            </button>
            <div class="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                class="hover:bg-soft"
                :disabled="position === 0"
                @click="move(-1)"
              >
                Move earlier</button
              ><button
                type="button"
                class="hover:bg-soft"
                :disabled="position === draft.sections.length - 1"
                @click="move(1)"
              >
                Move later
              </button>
            </div>
            <button
              type="button"
              class="mt-4 text-danger hover:bg-danger/5"
              :disabled="draft.sections.length <= 2"
              @click="removeOpen = true"
            >
              Remove chapter
            </button>
          </form>
          <div class="mt-4 rounded-xl bg-soft p-4">
            <p class="font-display text-lg">A sense of where you are.</p>
            <p class="mt-2 text-xs leading-relaxed text-muted">
              Scroll the preview or choose a chapter. The cue follows the page, even after an edit
              or a reorder.
            </p>
          </div>
        </section>
      </div>
      <footer class="mt-6 flex flex-wrap justify-between gap-2 text-xs text-muted">
        <span>Plain-text reading pages · SC/1</span><span>{{ marker }} · CodeSculptor</span>
      </footer>
    </main>
    <AppDialog v-model="removeOpen" title="Remove this chapter?"
      ><p class="break-words text-muted">Remove “{{ selected.title }}” from the page?</p>
      <div class="mt-6 flex justify-end gap-2">
        <button @click="removeOpen = false">Cancel</button
        ><button class="bg-danger text-white" @click="remove">Remove chapter</button>
      </div></AppDialog
    >
  </div>
</template>
