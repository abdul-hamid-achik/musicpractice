<script setup lang="ts">
useHead({
  script: [{
    innerHTML: `(function(){try{var s=localStorage.getItem('musicpractice-settings');if(s){var t=JSON.parse(s);if(t.theme==='light')document.documentElement.classList.add('light')}}catch(e){}})()`,
  }],
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage :transition="{ name: 'page', mode: 'out-in' }" />
    <ToastManager />
  </NuxtLayout>
</template>
