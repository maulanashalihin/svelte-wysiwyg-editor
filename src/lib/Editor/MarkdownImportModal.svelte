<script>
  import { createEventDispatcher } from 'svelte';
  import { marked } from 'marked';

  export let show = false;

  const dispatch = createEventDispatcher();
  let markdown = '';

  function close() {
    show = false;
    markdown = '';
  }

  function insert() {
    if (!markdown.trim()) return;

    // Parse markdown to HTML
    // marked.parse might return a promise if async is enabled, but default is sync.
    // Let's assume sync for now.
    const html = marked.parse(markdown);

    dispatch('insert', { html });
    close();
  }
</script>

{#if show}
  <div class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true" on:click|self={close}>
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh] h-[500px]">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Import Markdown</h3>
        <button on:click={close} class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
        </button>
      </div>

      <!-- Content -->
      <div class="p-4 flex-1 overflow-hidden flex flex-col">
        <label for="markdown-input" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Paste Markdown Content
        </label>
        <textarea
          id="markdown-input"
          bind:value={markdown}
          class="flex-1 w-full focus:outline-none p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono text-sm"
          placeholder="# Heading&#10;&#10;Write your markdown here..."
        ></textarea>
      </div>

      <!-- Footer -->
      <div class="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
        <button on:click={close} class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600">
          Cancel
        </button>
        <button on:click={insert} disabled={!markdown.trim()} class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
          Insert
        </button>
      </div>
    </div>
  </div>
{/if}
