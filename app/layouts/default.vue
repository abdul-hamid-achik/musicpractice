<template>
  <div class="min-h-screen bg-surface flex flex-col">
    <AppHeader />
    <AppSidebar />
    <main class="ml-0 lg:ml-64 mt-16 p-6 pb-8 flex-1">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
