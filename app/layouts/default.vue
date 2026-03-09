<template>
  <div class="min-h-screen bg-surface flex flex-col">
    <!-- Skip Link for keyboard users -->
    <a
      href="#main-content"
      class="skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-primary focus:text-on-primary focus:px-4 focus:py-2 focus:rounded-md focus:font-medium focus:shadow-lg"
    >
      Skip to main content
    </a>

    <AppHeader />
    <AppSidebar />
    <main
      id="main-content"
      class="ml-0 lg:ml-64 mt-16 p-6 pb-8 flex-1"
      tabindex="-1"
    >
      <slot />
    </main>
    <AppFooter />
  </div>
</template>

<style scoped>
/* Skip link styles - visible only on focus */
.skip-link {
  position: absolute;
  top: -100px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  transition: top 0.3s;
}

.skip-link:focus {
  top: 16px;
}

/* Screen reader only utility */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.focus\\:not-sr-only:focus {
  position: static;
  width: auto;
  height: auto;
  padding: 0.5rem 1rem;
  margin: 0;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
</style>
