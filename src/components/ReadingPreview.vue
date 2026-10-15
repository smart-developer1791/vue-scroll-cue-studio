<script setup lang="ts">
import { ref, useId, useTemplateRef, watchPostEffect } from 'vue'
import { activeSection, scrollProgress, paragraphs, type Workspace } from '../domain/sections'
const props = defineProps<{ workspace: Workspace }>()
const root = useTemplateRef<HTMLElement>('reader')
const sections = useTemplateRef<HTMLElement[]>('chapters')
const prefix = useId()
const active = ref(''),
  progress = ref(0)
watchPostEffect((cleanup) => {
  // Read content as well as identity so observers reconnect after Vue patches it.
  const ids = props.workspace.sections.map((s) => {
    void s.title
    void s.body
    return s.id
  })
  void props.workspace.density
  const viewport = root.value,
    targets = sections.value
  if (!viewport || !targets) return
  const byId = new Map(targets.map((element) => [element.dataset.section!, element]))
  let frame = 0
  function measure() {
    if (!viewport) return
    const rect = viewport.getBoundingClientRect()
    const positions = ids.map((id) => ({
      id,
      top: (byId.get(id)?.getBoundingClientRect().top ?? rect.top) - rect.top + viewport.scrollTop,
    }))
    active.value =
      viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight - 2
        ? (ids.at(-1) ?? '')
        : activeSection(positions, viewport.scrollTop + 90)
    progress.value = scrollProgress(
      viewport.scrollTop,
      viewport.scrollHeight,
      viewport.clientHeight,
    )
  }
  function queue() {
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(measure)
  }
  viewport.addEventListener('scroll', queue, { passive: true })
  const observer = new ResizeObserver(queue)
  observer.observe(viewport)
  for (const target of targets) observer.observe(target)
  measure()
  cleanup(() => {
    viewport.removeEventListener('scroll', queue)
    observer.disconnect()
    cancelAnimationFrame(frame)
  })
})
function jump(id: string) {
  // Vue does not guarantee the order of refs inside v-for. Find the identity explicitly.
  const target = sections.value?.find((element) => element.dataset.section === id),
    viewport = root.value
  if (!target || !viewport) return
  viewport.scrollTo({
    top:
      target.getBoundingClientRect().top -
      viewport.getBoundingClientRect().top +
      viewport.scrollTop -
      20,
    behavior: 'instant',
  })
  target.focus({ preventScroll: true })
}
</script>
<template>
  <div data-ui="reading-preview" class="min-w-0 rounded-2xl border border-line bg-surface p-5">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
      <h2 class="text-lg font-semibold">Walk through the page</h2>
      <span class="text-xs text-accent">{{ progress }}% read</span>
    </div>
    <progress
      class="mb-4 block h-1.5 w-full overflow-hidden rounded-full accent-accent"
      :value="progress"
      max="100"
      aria-label="Reading progress"
    />
    <nav
      class="mb-4 flex h-24 flex-wrap content-start gap-2 overflow-y-auto rounded-xl bg-background p-3"
      aria-label="Reading chapters"
    >
      <button
        v-for="(section, index) in workspace.sections"
        :key="section.id"
        class="max-w-full min-w-0 px-2! py-1! text-xs! hover:bg-accent/10"
        :class="
          active === section.id
            ? 'border-accent! bg-accent text-on-accent'
            : 'bg-surface text-muted'
        "
        :aria-current="active === section.id ? 'location' : undefined"
        :aria-label="`Read ${section.title}`"
        @click="jump(section.id)"
      >
        <span class="shrink-0">{{ index + 1 }}.</span
        ><span class="truncate">{{ section.title }}</span>
      </button>
    </nav>
    <div
      ref="reader"
      data-ui="reader"
      class="h-[520px] overflow-y-auto overscroll-contain rounded-xl border border-line bg-background p-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:p-7"
      tabindex="0"
      role="region"
      aria-label="Reading page, scroll through chapters"
    >
      <header class="mb-8">
        <p class="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
          A SMALL FIELD GUIDE
        </p>
        <h3 class="mt-3 break-words text-2xl font-semibold leading-tight sm:text-3xl">
          {{ workspace.name }}
        </h3>
        <p class="mt-4 break-words leading-relaxed text-muted">{{ workspace.introduction }}</p>
      </header>
      <section
        v-for="(section, index) in workspace.sections"
        :id="`${prefix}-${section.id}`"
        :key="section.id"
        ref="chapters"
        :data-section="section.id"
        class="mb-6 min-w-0 rounded-xl border border-line bg-surface p-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:p-7"
        :class="workspace.density === 'comfortable' ? 'min-h-[370px]' : 'min-h-[240px]'"
        tabindex="-1"
        :aria-labelledby="`${prefix}-${section.id}-heading`"
      >
        <p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">
          CHAPTER {{ String(index + 1).padStart(2, '0') }}
        </p>
        <h3
          :id="`${prefix}-${section.id}-heading`"
          class="mt-3 break-words text-xl font-semibold sm:text-2xl"
        >
          {{ section.title }}
        </h3>
        <p
          v-for="(paragraph, p) in paragraphs(section.body)"
          :key="p"
          class="break-words text-muted"
          :class="
            workspace.density === 'comfortable' ? 'mt-5 leading-loose' : 'mt-3 leading-relaxed'
          "
        >
          {{ paragraph }}
        </p>
      </section>
    </div>
  </div>
</template>
