<script>
  import { createEventDispatcher } from 'svelte';
  import ColorPicker from './ColorPicker.svelte';

  export let activeStates = {};
  export let disabled = false;
  export let lastRange = null;
  export let showHtml = false;
  /**
   * Optional async image upload handler.
   * Signature: (file: File) => Promise<string>  // returns the uploaded image URL
   * If not provided, the "Upload Image" button is hidden.
   */
  export let uploadHandler = null;
  /**
   * Whether to show the "Choose from Gallery" button.
   * The actual gallery listing is handled by the parent via the `openGallery` event,
   * so this only controls button visibility.
   */
  export let enableGallery = false;

  const dispatch = createEventDispatcher();

  let showHeadingsDropdown = false;
  let showLinkPopover = false;
  let showImagePopover = false;

  let linkUrl = '';
  let linkText = '';
  let openInNewTab = false;

  let imageUrl = '';
  let isUploading = false;
  let fileInput;

  function exec(command, value = null) {
      dispatch('exec', { command, value });
  }

  function formatBlock(tagName) {
      exec('formatBlock', tagName);
      showHeadingsDropdown = false;
  }

  function openLinkPopover() {
    showLinkPopover = !showLinkPopover;
    if (showLinkPopover) {
      dispatch('closeBubble');

      if (lastRange) {
         linkText = lastRange.toString();

         let node = lastRange.commonAncestorContainer;
         if (node.nodeType === 3) node = node.parentNode;

         const anchor = node.closest('a');
         if (anchor) {
             linkUrl = anchor.getAttribute('href');
             linkText = anchor.innerText;
             openInNewTab = anchor.getAttribute('target') === '_blank';
         } else {
             linkUrl = '';
             openInNewTab = false;
         }
      } else {
         linkText = '';
         linkUrl = '';
         openInNewTab = false;
      }
    }
  }

  function insertLink() {
    if (linkUrl) {
       dispatch('insertLink', { url: linkUrl, text: linkText, openInNewTab });
       linkUrl = '';
       linkText = '';
       openInNewTab = false;
       showLinkPopover = false;
    }
  }

  function insertImage() {
    if (imageUrl) {
      dispatch('insertImage', { url: imageUrl });
      imageUrl = '';
      showImagePopover = false;
    }
  }

  async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        alert('Image must be less than 10MB');
        return;
    }

    if (typeof uploadHandler !== 'function') {
        console.warn('svelte-wysiwyg-editor: no uploadHandler provided.');
        if (fileInput) fileInput.value = '';
        return;
    }

    isUploading = true;
    try {
      const url = await uploadHandler(file);
      if (url) {
        dispatch('insertImage', { url });
        imageUrl = '';
        showImagePopover = false;
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      isUploading = false;
      if (fileInput) fileInput.value = '';
    }
  }

  function openGallery() {
      showImagePopover = false;
      dispatch('openGallery');
  }

  function toggleFullscreen() {
      dispatch('toggleFullscreen');
  }

  function cleanHtml() {
    dispatch('cleanHtml');
  }

  function handleClickOutside(event) {
    if (!event.target.closest('.popover-container')) {
      showLinkPopover = false;
      showImagePopover = false;
      showHeadingsDropdown = false;
    }
  }
</script>

<svelte:window on:click={handleClickOutside} />

<div class="toolbar">
    <!-- History -->
    <div class="toolbar-group">
      <button type="button" class="toolbar-btn" on:click={() => exec('undo')} title="Undo (Ctrl/Cmd+Z)">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
      </button>
      <button type="button" class="toolbar-btn" on:click={() => exec('redo')} title="Redo (Ctrl/Cmd+Shift+Z)">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 3.7"/></svg>
      </button>
    </div>

    <div class="divider"></div>

    <!-- Lists -->
    <div class="toolbar-group">
      <button type="button" class="toolbar-btn {activeStates.insertUnorderedList ? 'active' : ''}" on:click={() => exec('insertUnorderedList')} title="Bullet List">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>
      </button>
      <button type="button" class="toolbar-btn {activeStates.insertOrderedList ? 'active' : ''}" on:click={() => exec('insertOrderedList')} title="Numbered List">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="10" x2="21" y1="6" y2="6"/><line x1="10" x2="21" y1="12" y2="12"/><line x1="10" x2="21" y1="18" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>
      </button>
    </div>

    <div class="divider"></div>

    <!-- Blocks -->
    <div class="toolbar-group">
      <button type="button" class="toolbar-btn" on:click={() => exec('insertHorizontalRule')} title="Horizontal Rule">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" x2="19" y1="12" y2="12"/></svg>
      </button>
    </div>

    <div class="divider"></div>

    <!-- Insert -->
    <div class="toolbar-group relative popover-container">
      <button
        type="button"
        class="toolbar-btn {showImagePopover ? 'active' : ''}"
        on:click|stopPropagation={() => showImagePopover = !showImagePopover}
        title="Insert Image"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
      </button>

      {#if showImagePopover}
        <div class="popover flex-col items-start gap-2">
           <div class="flex items-center gap-2 w-full">
              <input
                type="text"
                bind:value={imageUrl}
                placeholder="Image URL..."
                class="popover-input"
                on:keydown={(e) => e.key === 'Enter' && insertImage()}
              />
              <button type="button" class="popover-btn" on:click={insertImage}>Add</button>
           </div>

           {#if uploadHandler}
             <div class="w-full flex items-center gap-2 my-1">
               <div class="h-px bg-gray-200 dark:bg-gray-600 flex-grow"></div>
               <span class="text-xs text-gray-400">OR</span>
               <div class="h-px bg-gray-200 dark:bg-gray-600 flex-grow"></div>
             </div>

             <label class="w-full flex items-center justify-center gap-2 p-2 border border-dashed border-gray-300 dark:border-gray-600 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400">
                {#if isUploading}
                    <span class="animate-spin">⏳</span> <span class="text-sm">Uploading...</span>
                {:else}
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                    <span class="text-sm">Upload Image</span>
                {/if}
                <input
                  type="file"
                  accept="image/*"
                  class="hidden"
                  bind:this={fileInput}
                  on:change={handleImageUpload}
                  disabled={isUploading}
                />
             </label>
           {/if}

           {#if enableGallery}
             <button
               type="button"
               class="w-full flex items-center justify-center gap-2 p-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400"
               on:click={openGallery}
             >
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
               <span class="text-sm">Choose from Gallery</span>
             </button>
           {/if}
        </div>
      {/if}
    </div>

    <div class="toolbar-group">
      <button
        type="button"
        class="toolbar-btn"
        on:click={() => dispatch('openMarkdown')}
        title="Insert Markdown"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 8l4 5 4-5"/><path d="M7 8v8"/><path d="M15 8v8"/></svg>
      </button>
      <button
        type="button"
        class="toolbar-btn {showHtml ? 'active' : ''}"
        on:click={() => dispatch('toggleHtml')}
        title="View Source"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
      </button>
    </div>

    <div class="spacer"></div>

    <!-- Utils -->
    <div class="toolbar-group">
      <button type="button" class="toolbar-btn" on:click={cleanHtml} title="Clean HTML">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8 19 13"/><path d="M15 9h0"/><path d="M17.8 6.2 19 5"/><path d="m3 21 9-9"/><path d="M12.2 6.2 11 5"/></svg>
      </button>
      <button type="button" class="toolbar-btn" on:click={toggleFullscreen} title="Toggle Fullscreen">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
      </button>
    </div>
</div>

<style>
  .toolbar {
    @apply flex items-center gap-1 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm sticky top-0 z-20 flex-wrap rounded-t-xl;
  }

  .toolbar-group {
    @apply flex items-center gap-0.5;
  }

  .divider {
    @apply w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1;
  }

  .spacer {
    @apply flex-grow;
  }

  .toolbar-btn {
    @apply p-1.5 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-colors;
  }

  .toolbar-btn.active {
    @apply bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400;
  }

  .popover {
    @apply absolute top-full left-0 mt-2 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg flex items-center gap-2 z-30 min-w-[250px];
  }

  .dropdown-menu {
    @apply absolute top-full left-0 mt-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-30 min-w-[150px] flex flex-col;
  }

  .dropdown-item {
    @apply px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors;
  }

  .dropdown-item.active {
    @apply bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400;
  }

  .popover-input {
    @apply flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-transparent focus:outline-none focus:border-blue-500;
  }

  .popover-btn {
    @apply px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors;
  }
</style>
