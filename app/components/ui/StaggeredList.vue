<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    tag?: string
    delay?: number
  }>(),
  {
    tag: 'div',
    delay: 50,
  },
)

function onBeforeEnter(el: Element) {
  const htmlEl = el as HTMLElement
  const siblings = htmlEl.parentElement?.children
  if (siblings) {
    const index = Array.from(siblings).indexOf(el)
    htmlEl.style.transitionDelay = `${index * props.delay}ms`
  }
}

function onAfterEnter(el: Element) {
  ;(el as HTMLElement).style.transitionDelay = ''
}
</script>

<template>
  <TransitionGroup
    :tag="tag"
    appear
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 translate-y-2"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
    move-class="transition-all duration-300"
    @before-enter="onBeforeEnter"
    @after-enter="onAfterEnter"
  >
    <slot />
  </TransitionGroup>
</template>
