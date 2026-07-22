<script>
  import { createEventDispatcher } from 'svelte';
  import ColorPicker from './ColorPicker.svelte';

  export let activeStates = {};
  export let position = { top: 0, left: 0 };

  const dispatch = createEventDispatcher();

  let showHeadingsDropdown = false;
  let mode = 'main'; // main, link
  let linkUrl = '';
  let openInNewTab = false;

  function exec(command, value = null) {
      dispatch('exec', { command, value });
  }

  function formatBlock(tagName) {
      exec('formatBlock', tagName);
      showHeadingsDropdown = false;
  }

  function startLink() {
     mode = 'link';
     linkUrl = '';
     openInNewTab = false;
  }

  function saveLink() {
     if (linkUrl) {
        // Dispatch insertLink to be handled by parent
        // We'll mimic the parent's handleInsertLink payload
        dispatch('exec', {
            command: 'insertLink', // Custom command name
            value: { url: linkUrl, openInNewTab }
        });
        mode = 'main';
     }
  }

  function cancelLink() {
     mode = 'main';
  }

  function handleMouseDown(event) {
      if (event.target.tagName === 'INPUT') {
          return;
      }
      event.preventDefault();
  }
</script>

<div
  class="text-bubble w-[230px] justify-center flex flex-wrap {position.placement === 'bottom' ? 'bubble-bottom' : 'bubble-top'}"
  style="top: {position.top}px; left: {position.left}px;"
  on:mousedown={handleMouseDown}
  on:click|stopPropagation
>
  {#if mode === 'main'}
    <!-- Headings -->
    <div class="bubble-group relative">
      <button
        type="button"
        class="bubble-btn flex items-center gap-1 w-auto px-2"
        on:click|stopPropagation={() => showHeadingsDropdown = !showHeadingsDropdown}
        title="Headings"
      >
        <span class="text-sm font-medium">
          {#if activeStates.h1}H1
          {:else if activeStates.h2}H2
          {:else if activeStates.h3}H3
          {:else}P{/if}
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </button>

      {#if showHeadingsDropdown}
        <div class="dropdown-menu">
          <button type="button" class="dropdown-item {activeStates.h1 ? 'active' : ''}" on:click={() => formatBlock('H1')}>
            <span class="text-xl font-bold">Heading 1</span>
          </button>
          <button type="button" class="dropdown-item {activeStates.h2 ? 'active' : ''}" on:click={() => formatBlock('H2')}>
            <span class="text-lg font-bold">Heading 2</span>
          </button>
          <button type="button" class="dropdown-item {activeStates.h3 ? 'active' : ''}" on:click={() => formatBlock('H3')}>
            <span class="text-base font-bold">Heading 3</span>
          </button>
          <button type="button" class="dropdown-item {!activeStates.h1 && !activeStates.h2 && !activeStates.h3 ? 'active' : ''}" on:click={() => formatBlock('P')}>
            <span class="text-sm">Paragraph</span>
          </button>
        </div>
      {/if}
    </div>

    <div class="bubble-divider"></div>

    <!-- Formatting -->
    <div class="bubble-group">
        <button type="button" class="bubble-btn {activeStates.bold ? 'active' : ''}" on:click={() => exec('bold')} title="Bold">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8"/></svg>
        </button>
        <button type="button" class="bubble-btn {activeStates.italic ? 'active' : ''}" on:click={() => exec('italic')} title="Italic">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" x2="10" y1="4" y2="4"/><line x1="14" x2="5" y1="20" y2="20"/><line x1="15" x2="9" y1="4" y2="20"/></svg>
        </button>
        <button type="button" class="bubble-btn {activeStates.underline ? 'active' : ''}" on:click={() => exec('underline')} title="Underline">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4v6a6 6 0 0 0 12 0V4"/><line x1="4" x2="20" y1="20" y2="20"/></svg>
        </button>
        <button type="button" class="bubble-btn {activeStates.strikeThrough ? 'active' : ''}" on:click={() => exec('strikeThrough')} title="Strikethrough">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4H9a3 3 0 0 0-2.83 4"/><path d="M14 12a4 4 0 0 1 0 8H6"/><line x1="4" x2="20" y1="12" y2="12"/></svg>
        </button>
        <button type="button" class="bubble-btn {activeStates.blockquote ? 'active' : ''}" on:click={() => formatBlock('blockquote')} title="Blockquote">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/></svg>
        </button>
    </div>

    <!-- <div class="bubble-divider"></div> -->

    <!-- Alignment -->
    <div class="bubble-group">
      <button type="button" class="bubble-btn {activeStates.justifyLeft ? 'active' : ''}" on:click={() => exec('justifyLeft')} title="Align Left">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="21" x2="3" y1="6" y2="6"/><line x1="15" x2="3" y1="12" y2="12"/><line x1="17" x2="3" y1="18" y2="18"/></svg>
      </button>
      <button type="button" class="bubble-btn {activeStates.justifyCenter ? 'active' : ''}" on:click={() => exec('justifyCenter')} title="Align Center">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="21" x2="3" y1="6" y2="6"/><line x1="19" x2="5" y1="12" y2="12"/><line x1="21" x2="3" y1="18" y2="18"/></svg>
      </button>
      <button type="button" class="bubble-btn {activeStates.justifyRight ? 'active' : ''}" on:click={() => exec('justifyRight')} title="Align Right">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="21" x2="3" y1="6" y2="6"/><line x1="21" x2="9" y1="12" y2="12"/><line x1="21" x2="7" y1="18" y2="18"/></svg>
      </button>
    </div>

    <div class="bubble-divider"></div>

    <!-- Link -->
    <div class="bubble-group">
        <button type="button" class="bubble-btn" on:click={startLink} title="Link">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        </button>
    </div>

    <div class="bubble-divider"></div>

    <!-- Colors & Clear -->
    <div class="bubble-group">
        <ColorPicker
          type="foreColor"
          title="Text Color"
          icon={`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16"/><path d="m6 16 6-14 6 14"/><path d="M8 12h8"/></svg>`}
          on:select={(e) => e.detail.color === 'remove' ? exec('removeFormat') : exec('foreColor', e.detail.color)}
        />

        <ColorPicker
          type="hiliteColor"
          title="Highlight Color"
          icon={`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 11-6 6v3h9l3-3"/><path d="m22 7-4.6 4.6a2 2 0 0 1-2.8 0l-4.2-4.2a2 2 0 0 1 0-2.8l2.4-2.4a2 2 0 0 1 2.8 0L22 7"/><line x1="12.9" x2="16" y1="4.1" y2="7.2"/></svg>`}
          on:select={(e) => e.detail.color === 'remove' ? exec('removeFormat') : exec('hiliteColor', e.detail.color)}
        />
    </div>

  {:else if mode === 'link'}
     <div class="flex items-center gap-2 p-1">
        <input
           type="text"
           bind:value={linkUrl}
           placeholder="https://"
           class="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
           autofocus
           on:keydown={(e) => e.key === 'Enter' && saveLink()}
        />
        <label class="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
           <input type="checkbox" bind:checked={openInNewTab} class="rounded text-blue-600 focus:ring-blue-500 w-3 h-3" />
           New Tab
        </label>
        <button type="button" class="bubble-btn text-blue-600 hover:bg-blue-50" on:click={saveLink}>
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </button>
        <button type="button" class="bubble-btn text-gray-500 hover:bg-gray-100" on:click={cancelLink}>
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
        </button>
     </div>
  {/if}
</div>

<style>
  .text-bubble {
    @apply absolute z-40 flex items-center gap-1 p-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl;
    /* Base transform is handled by placement classes */
  }

  .bubble-top {
    transform: translateX(-50%) translateY(-100%);
    animation: fadeInTop 0.2s ease-out;
  }

  .bubble-bottom {
    transform: translateX(-50%);
    animation: fadeInBottom 0.2s ease-out;
  }

  .bubble-group {
    @apply flex items-center gap-0.5;
  }

  .bubble-divider {
    @apply w-px h-5 bg-gray-200 dark:bg-gray-600 mx-1;
  }

  .bubble-btn {
    @apply p-1.5 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-colors;
  }

  .bubble-btn.active {
    @apply bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400;
  }

  .bubble-select {
    @apply bg-transparent text-sm border-none focus:ring-0 p-1 text-gray-700 dark:text-gray-300 font-medium cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded;
  }

  .dropdown-menu {
    @apply absolute top-full left-0 mt-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-30 min-w-[150px] flex flex-col;
  }

  .dropdown-item {
    @apply px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-800 dark:text-gray-200;
  }

  .dropdown-item.active {
    @apply bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400;
  }

  @keyframes fadeInTop {
    from { opacity: 0; transform: translateX(-50%) translateY(-90%); }
    to { opacity: 1; transform: translateX(-50%) translateY(-100%); }
  }

  @keyframes fadeInBottom {
    from { opacity: 0; transform: translateX(-50%) translateY(10px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
</style>
