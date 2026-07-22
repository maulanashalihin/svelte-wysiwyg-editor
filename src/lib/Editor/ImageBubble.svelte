<script>
  import { createEventDispatcher } from 'svelte';

  export let activeImage = null;
  export let position = { top: 0, left: 0 };

  const dispatch = createEventDispatcher();

  let altText = '';
  let linkUrl = '';
  let openInNewTab = false;
  let showSettings = false;

  $: if (activeImage) {
      altText = activeImage.getAttribute('alt') || '';

      const parent = activeImage.parentNode;
      if (parent && parent.tagName === 'A') {
          linkUrl = parent.getAttribute('href');
          openInNewTab = parent.getAttribute('target') === '_blank';
      } else {
          linkUrl = '';
          openInNewTab = false;
      }
  }

  function updateAlign(align) {
      dispatch('update', { type: 'align', value: align });
  }

  function updateSize(size) {
      dispatch('update', { type: 'size', value: size });
  }

  function toggleCaption() {
      dispatch('update', { type: 'caption' });
  }

  function updateAlt() {
      dispatch('update', { type: 'alt', value: altText });
      showSettings = false;
  }

  function updateLink() {
      dispatch('update', {
          type: 'link',
          value: { url: linkUrl, openInNewTab }
      });
      showSettings = false;
  }

  function remove() {
      dispatch('remove');
  }
</script>

<div
   class="image-bubble"
   style="top: {position.top}px; left: {position.left}px;"
   on:click|stopPropagation
>
   <!-- Toolbar Row -->
   <div class="flex items-center gap-1 p-1">
      <!-- Alignment -->
      <div class="flex items-center gap-0.5 border-r border-gray-200 dark:border-gray-700 pr-1 mr-1">
          <button type="button" class="bubble-btn" on:click={() => updateAlign('left')} title="Align Left">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="21" x2="3" y1="6" y2="6"/><line x1="15" x2="3" y1="12" y2="12"/><line x1="17" x2="3" y1="18" y2="18"/></svg>
          </button>
          <button type="button" class="bubble-btn" on:click={() => updateAlign('center')} title="Align Center">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="21" x2="3" y1="6" y2="6"/><line x1="19" x2="5" y1="12" y2="12"/><line x1="21" x2="3" y1="18" y2="18"/></svg>
          </button>
          <button type="button" class="bubble-btn" on:click={() => updateAlign('right')} title="Align Right">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="21" x2="3" y1="6" y2="6"/><line x1="21" x2="9" y1="12" y2="12"/><line x1="21" x2="7" y1="18" y2="18"/></svg>
          </button>
      </div>

      <!-- Size -->
      <div class="flex items-center gap-0.5 border-r border-gray-200 dark:border-gray-700 pr-1 mr-1">
          <button type="button" class="bubble-btn text-xs font-bold" on:click={() => updateSize('25%')} title="Small">S</button>
          <button type="button" class="bubble-btn text-xs font-bold" on:click={() => updateSize('50%')} title="Medium">M</button>
          <button type="button" class="bubble-btn text-xs font-bold" on:click={() => updateSize('100%')} title="Full">L</button>
      </div>

      <!-- Actions -->
      <button type="button" class="bubble-btn" on:click={toggleCaption} title="Toggle Caption">
         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>
      </button>

      <button type="button" class="bubble-btn {showSettings ? 'active' : ''}" on:click={() => showSettings = !showSettings} title="Settings">
         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
      </button>

      <button type="button" class="bubble-btn text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" on:click={remove} title="Remove Image">
         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
   </div>

   {#if showSettings}
      <div class="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg flex flex-col gap-3">
          <!-- Link Settings -->
          <div class="flex flex-col gap-1">
             <label class="text-xs font-medium text-gray-600 dark:text-gray-400">Link URL</label>
             <div class="flex gap-2">
                 <input
                   type="text"
                   bind:value={linkUrl}
                   placeholder="https://..."
                   class="bubble-input"
                   on:keydown={(e) => e.key === 'Enter' && updateLink()}
                 />
             </div>
             <label class="flex items-center gap-1 text-xs text-gray-500 cursor-pointer mt-1">
                <input type="checkbox" bind:checked={openInNewTab} class="rounded text-blue-600 focus:ring-blue-500 w-3 h-3" />
                Open in new tab
             </label>
             <button type="button" class="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 self-end mt-1" on:click={updateLink}>Update Link</button>
          </div>

          <div class="h-px bg-gray-200 dark:bg-gray-700"></div>

          <!-- Alt Text -->
          <div class="flex flex-col gap-1">
             <label class="text-xs font-medium text-gray-600 dark:text-gray-400">Alt Text</label>
             <div class="flex gap-2">
                 <input
                   type="text"
                   bind:value={altText}
                   placeholder="Describe this image..."
                   class="bubble-input"
                   on:keydown={(e) => e.key === 'Enter' && updateAlt()}
                 />
                 <button type="button" class="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700" on:click={updateAlt}>Save</button>
             </div>
          </div>
      </div>
   {/if}
 </div>

<style>
  .image-bubble {
    @apply absolute bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-40 transform -translate-x-1/2 transition-all duration-200 flex flex-col;
  }
  .bubble-btn {
    @apply p-1.5 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center min-w-[28px];
  }
  .bubble-btn.active {
    @apply text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20;
  }
  .bubble-input {
    @apply flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 focus:outline-none focus:border-blue-500;
  }
</style>
