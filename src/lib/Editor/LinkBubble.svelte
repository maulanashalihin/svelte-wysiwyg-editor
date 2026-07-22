<script>
  import { createEventDispatcher } from 'svelte';

  export let activeLink = null;
  export let position = { top: 0, left: 0 };

  const dispatch = createEventDispatcher();

  let isEditingLink = false;
  let linkUrl = '';
  let linkText = '';
  let openInNewTab = false;

  // Reset state when activeLink changes or when component is mounted
  $: if (activeLink) {
     // Optional: We could reset editing state here if needed
  }

  function editLink() {
      if (!activeLink) return;
      linkUrl = activeLink.getAttribute('href');
      linkText = activeLink.innerText;
      openInNewTab = activeLink.getAttribute('target') === '_blank';
      isEditingLink = true;
  }

  function updateLink() {
     if (activeLink && linkUrl) {
        activeLink.setAttribute('href', linkUrl);
        activeLink.innerText = linkText || linkUrl;
        if (openInNewTab) {
           activeLink.setAttribute('target', '_blank');
           activeLink.setAttribute('rel', 'noopener noreferrer');
        } else {
           activeLink.removeAttribute('target');
           activeLink.removeAttribute('rel');
        }

        isEditingLink = false;
        dispatch('update');
     }
  }

  function removeLink() {
      dispatch('remove', { link: activeLink });
      isEditingLink = false;
  }

  function cancel() {
      isEditingLink = false;
  }
</script>

<div
   class="link-bubble"
   style="top: {position.top}px; left: {position.left}px;"
   on:click|stopPropagation
>
   {#if isEditingLink}
      <!-- Edit Mode -->
      <div class="flex flex-col gap-2 p-3 min-w-[300px]">
         <div class="flex flex-col gap-1 w-full">
           <label class="text-xs font-medium text-gray-600 dark:text-gray-400">URL</label>
           <input
             type="text"
             bind:value={linkUrl}
             placeholder="https://example.com"
             class="popover-input w-full"
             autofocus
             on:keydown={(e) => e.key === 'Enter' && updateLink()}
           />
         </div>

         <div class="flex flex-col gap-1 w-full">
           <label class="text-xs font-medium text-gray-600 dark:text-gray-400">Text</label>
           <input
             type="text"
             bind:value={linkText}
             placeholder="Link text"
             class="popover-input w-full"
             on:keydown={(e) => e.key === 'Enter' && updateLink()}
           />
         </div>

         <label class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer select-none mt-1">
            <input type="checkbox" bind:checked={openInNewTab} class="rounded text-blue-600 focus:ring-blue-500" />
            Open in new tab
         </label>

         <div class="flex justify-end gap-2 w-full mt-2">
           <button type="button" class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" on:click={cancel}>Cancel</button>
           <button type="button" class="popover-btn" on:click={updateLink}>Update</button>
         </div>
      </div>
   {:else}
      <!-- View Mode -->
      <div class="flex items-center gap-2 p-2">
         <a href={activeLink.getAttribute('href')} target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline text-sm truncate max-w-[200px] block mr-2">
            {activeLink.getAttribute('href')}
         </a>

         <div class="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>

         <button type="button" class="toolbar-btn text-gray-500 hover:text-blue-600" title="Edit Link" on:click={editLink}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
         </button>

         <button type="button" class="toolbar-btn text-gray-500 hover:text-red-600" title="Remove Link" on:click={removeLink}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>
         </button>
      </div>
   {/if}
 </div>

<style>
  .link-bubble {
    @apply absolute bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-40 transform -translate-x-1/2 transition-all duration-200;
  }
  .popover-input {
    @apply flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-transparent focus:outline-none focus:border-blue-500;
  }
  .popover-btn {
    @apply px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors;
  }
  .toolbar-btn {
    @apply p-1.5 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-colors;
  }
</style>
