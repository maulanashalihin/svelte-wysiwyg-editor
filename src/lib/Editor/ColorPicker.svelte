<script>
  import { createEventDispatcher } from 'svelte';

  export let type = 'foreColor'; // foreColor or hiliteColor
  export let icon; // SVG icon content
  export let title;

  const dispatch = createEventDispatcher();
  let showPicker = false;

  const colors = [
    '#000000', '#444444', '#666666', '#999999', '#cccccc', '#eeeeee', '#f3f3f3', '#ffffff',
    '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#9900ff', '#ff00ff',
    '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#cfe2f3', '#d9d2e9', '#ead1dc',
    '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#9fc5e8', '#b4a7d6', '#d5a6bd',
    '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6fa8dc', '#8e7cc3', '#c27ba0',
    '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3d85c6', '#674ea7', '#a64d79',
    '#990000', '#b45f06', '#bf9000', '#38761d', '#134f5c', '#0b5394', '#351c75', '#741b47',
    '#660000', '#783f04', '#7f6000', '#274e13', '#0c343d', '#073763', '#20124d', '#4c1130'
  ];

  function selectColor(color) {
      dispatch('select', { color, type });
      showPicker = false;
  }

  function handleClickOutside(event) {
    if (!event.target.closest('.color-picker-container')) {
      showPicker = false;
    }
  }
</script>

<svelte:window on:click={handleClickOutside} />

<div class="relative color-picker-container">
  <button
    type="button"
    class="toolbar-btn {showPicker ? 'active' : ''}"
    on:click|stopPropagation={() => showPicker = !showPicker}
    {title}
  >
    {@html icon}
    <div class="h-1 w-4 mt-0.5 rounded-sm" style="background-color: {type === 'foreColor' ? 'black' : 'transparent'}; border: 1px solid #ddd;"></div>
  </button>

  {#if showPicker}
    <div class="popover grid grid-cols-8 gap-1 p-2 w-[180px]">
       {#each colors as color}
          <button
            type="button"
            class="w-4 h-4 rounded-sm border border-gray-200 hover:scale-110 transition-transform focus:outline-none focus:ring-1 focus:ring-blue-500"
            style="background-color: {color};"
            on:click={() => selectColor(color)}
            title={color}
          ></button>
       {/each}
       <button
          type="button"
          class="col-span-8 mt-1 text-xs text-center py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          on:click={() => selectColor('remove')}
       >
          Remove Color
       </button>
    </div>
  {/if}
</div>

<style>
  .popover {
    @apply absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-30;
  }
  .toolbar-btn {
    @apply p-1.5 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-colors flex flex-col items-center justify-center;
  }
  .toolbar-btn.active {
    @apply bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400;
  }
</style>
