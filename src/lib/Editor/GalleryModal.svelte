<script>
  import { createEventDispatcher } from 'svelte';

  export let show = false;
  /**
   * Optional async gallery fetcher.
   * Signature: ({ page, limit }) => Promise<{ data: Array<{ url, name }>, meta: { total } }>
   * If not provided, the modal shows a placeholder message.
   */
  export let galleryFetcher = null;
  export let pageSize = 20;

  const dispatch = createEventDispatcher();

  let galleryImages = [];
  let galleryPage = 1;
  let galleryLoading = false;
  let galleryTotal = 0;
  let hasLoaded = false;
  let fetchError = '';

  $: if (show && !hasLoaded && !galleryLoading && galleryImages.length === 0) {
      loadGalleryImages(1);
  }

  async function loadGalleryImages(page = 1) {
    if (typeof galleryFetcher !== 'function') {
      fetchError = 'No galleryFetcher provided. Pass a galleryFetcher prop to enable the gallery.';
      return;
    }
    galleryLoading = true;
    fetchError = '';
    try {
      const result = await galleryFetcher({ page, limit: pageSize });
      const data = result.data || [];
      if (page === 1) {
        galleryImages = data;
      } else {
        galleryImages = [...galleryImages, ...data];
      }
      galleryTotal = result.meta?.total ?? data.length;
      galleryPage = page;
      hasLoaded = true;
    } catch (error) {
      console.error('Failed to load gallery images:', error);
      fetchError = error?.message || 'Failed to load gallery images.';
    } finally {
      galleryLoading = false;
    }
  }

  function selectImage(url) {
    dispatch('select', { url });
    show = false;
  }

  function close() {
    show = false;
  }
</script>

{#if show}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden">
        <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Select Image</h3>
          <button type="button" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" on:click={close}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-4">
          {#if fetchError}
             <div class="text-center py-10 text-amber-600 dark:text-amber-400 text-sm">
                {fetchError}
             </div>
          {:else if galleryLoading && galleryImages.length === 0}
             <div class="flex justify-center items-center h-40">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
             </div>
          {:else if galleryImages.length === 0}
             <div class="text-center py-10 text-gray-500 dark:text-gray-400">
                No images found. Upload one first!
             </div>
          {:else}
             <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {#each galleryImages as image}
                   <button
                     type="button"
                     class="relative aspect-square group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                     on:click={() => selectImage(image.url)}
                   >
                      <img src={image.url} alt={image.name} class="w-full h-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                      <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                         <span class="bg-white/90 text-gray-900 text-xs px-2 py-1 rounded shadow">Select</span>
                      </div>
                   </button>
                {/each}
             </div>

             {#if galleryImages.length < galleryTotal}
                <div class="mt-6 flex justify-center">
                   <button
                     type="button"
                     class="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                     on:click={() => loadGalleryImages(galleryPage + 1)}
                     disabled={galleryLoading}
                   >
                      {galleryLoading ? 'Loading...' : 'Load More'}
                   </button>
                </div>
             {/if}
          {/if}
        </div>
      </div>
    </div>
  {/if}
