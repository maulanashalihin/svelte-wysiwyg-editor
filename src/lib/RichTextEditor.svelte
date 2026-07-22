<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import EditorToolbar from './Editor/EditorToolbar.svelte';
  import LinkBubble from './Editor/LinkBubble.svelte';
  import ImageBubble from './Editor/ImageBubble.svelte';
  import TextBubble from './Editor/TextBubble.svelte';
  import GalleryModal from './Editor/GalleryModal.svelte';
  import MarkdownImportModal from './Editor/MarkdownImportModal.svelte';

  const dispatch = createEventDispatcher();

  // Props
  export let value = '';
  export let placeholder = 'Write something amazing...';
  export let dir = 'ltr';
  export let minHeight = '300px';
  export let disabled = false;
  /**
   * Optional async image upload handler.
   * Signature: (file: File) => Promise<string>  // returns the uploaded image URL
   * If not provided, the "Upload Image" button is hidden in the toolbar.
   */
  export let uploadHandler = null;
  /**
   * Optional async gallery fetcher.
   * Signature: ({ page, limit }) => Promise<{ data: Array<{ url, name }>, meta: { total } }>
   * If not provided, the "Choose from Gallery" button is hidden and the modal shows a notice.
   */
  export let galleryFetcher = null;

  // Component state
  let editor;
  let mounted = false;
  let isFullscreen = false;
  let lastRange = null;
  let container;
  // Flag to distinguish internal input (from handleInput) vs external prop change.
  // Prevents the reactive sync from resetting editor.innerHTML (and losing the
  // caret position) when the value flows back from the parent after a dispatch.
  let internalUpdate = false;

  // Strip newlines from HTML source except inside <pre> blocks, where
  // whitespace is semantically significant. Naive /\n/g replacement breaks
  // code blocks pasted/typed by the user.
  function stripNewlines(html) {
    if (!html) return '';
    const parts = [];
    let lastIdx = 0;
    const preRegex = /<pre[^>]*>[\s\S]*?<\/pre>/gi;
    let match;
    while ((match = preRegex.exec(html)) !== null) {
      parts.push(html.slice(lastIdx, match.index).replace(/\n/g, ''));
      parts.push(match[0]);
      lastIdx = match.index + match[0].length;
    }
    parts.push(html.slice(lastIdx).replace(/\n/g, ''));
    return parts.join('');
  }

  // Link Bubble State
  let showLinkBubble = false;
  let bubblePosition = { top: 0, left: 0 };
  let activeLink = null;

  // Image Bubble State
  let showImageBubble = false;
  let imageBubblePosition = { top: 0, left: 0 };
  let activeImage = null;

  // Gallery State
  let showGalleryModal = false;

  // Markdown State
  let showMarkdownModal = false;

  // View Source State
  let showHtml = false;

  // Text Bubble State
  let showTextBubble = false;
  let textBubblePosition = { top: 0, left: 0 };

  // Word Count
  let wordCount = 0;
  let charCount = 0;

  // Active states for toolbar highlighting
  let activeStates = {
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    justifyLeft: false,
    justifyCenter: false,
    justifyRight: false,
    justifyFull: false,
    insertUnorderedList: false,
    insertOrderedList: false,
    h1: false,
    h2: false,
    h3: false,
    blockquote: false
  };

  // rAF throttle token for updateActiveStates. selectionchange fires very
  // frequently (every caret move) and the handler runs ~11 queryCommandState
  // calls, which makes the editor laggy on long documents. Coalescing to one
  // run per frame keeps the toolbar responsive without thrashing.
  let activeStatesRaf = 0;

  // Helper to update active states
  const updateActiveStates = () => {
    if (activeStatesRaf) return;
    activeStatesRaf = requestAnimationFrame(() => {
      activeStatesRaf = 0;
      _updateActiveStates();
    });
  };

  function _updateActiveStates() {
    if (!editor) return;

    // Check if we should update based on focus
    const activeEl = document.activeElement;
    if (activeEl && (
      activeEl.closest('.link-bubble') ||
      activeEl.closest('.image-bubble') ||
      activeEl.closest('.text-bubble') ||
      activeEl.closest('.toolbar')
    )) return;

    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);

      // Check if the selection is inside the editor
      if (editor.contains(range.commonAncestorContainer)) {
        lastRange = range;

        // Handle Link Bubble
        let node = range.commonAncestorContainer;
        if (node.nodeType === 3) node = node.parentNode; // Text node -> Element
        const anchor = node.closest('a');

        if (anchor && editor.contains(anchor)) {
             if (!activeEl || !activeEl.closest('.toolbar')) {
                 activeLink = anchor;
                 updateBubblePosition(anchor);
                 showLinkBubble = true;
                 showImageBubble = false;
                 showTextBubble = false;
             }
        } else {
             if (!activeEl || (!activeEl.closest('.toolbar') && !activeEl.closest('.link-bubble'))) {
                 showLinkBubble = false;
                 activeLink = null;

                 // Handle Text Bubble
                 if (!selection.isCollapsed && range.toString().trim().length > 0) {
                    const rect = range.getBoundingClientRect();
                    updateTextBubblePosition(rect);
                    showTextBubble = true;
                    showImageBubble = false;
                 } else {
                    showTextBubble = false;
                 }
             }
        }

        activeStates = {
          bold: document.queryCommandState('bold'),
          italic: document.queryCommandState('italic'),
          underline: document.queryCommandState('underline'),
          strikeThrough: document.queryCommandState('strikeThrough'),
          justifyLeft: document.queryCommandState('justifyLeft'),
          justifyCenter: document.queryCommandState('justifyCenter'),
          justifyRight: document.queryCommandState('justifyRight'),
          justifyFull: document.queryCommandState('justifyFull'),
          insertUnorderedList: document.queryCommandState('insertUnorderedList'),
          insertOrderedList: document.queryCommandState('insertOrderedList'),
          h1: document.queryCommandValue('formatBlock').toLowerCase() === 'h1',
          h2: document.queryCommandValue('formatBlock').toLowerCase() === 'h2',
          h3: document.queryCommandValue('formatBlock').toLowerCase() === 'h3',
          blockquote: document.queryCommandValue('formatBlock').toLowerCase() === 'blockquote',
          pre: document.queryCommandValue('formatBlock').toLowerCase() === 'pre'
        };
      }
    }
  };

  function updateBubblePosition(element, isImage = false) {
     if (!editor || !element || !container) return;

     const containerRect = container.getBoundingClientRect();
     const elementRect = element.getBoundingClientRect();

     // Calculate initial position relative to the main container
     let top = elementRect.bottom - containerRect.top + 8; // +8px gap
     let left = elementRect.left - containerRect.left + (elementRect.width / 2);

     // Smart positioning logic
     const bubbleWidth = isImage ? 300 : 320; // Estimated max width of bubble
     const containerWidth = containerRect.width;

     // Check left boundary
     if (left - (bubbleWidth / 2) < 10) {
         left = (bubbleWidth / 2) + 10;
     }

     // Check right boundary
     if (left + (bubbleWidth / 2) > containerWidth - 10) {
         left = containerWidth - (bubbleWidth / 2) - 10;
     }

     if (isImage) {
        imageBubblePosition = { top, left };
     } else {
        bubblePosition = { top, left };
     }
  }

  function updateTextBubblePosition(rect) {
     if (!editor || !container) return;

     const containerRect = container.getBoundingClientRect();

     // Default: Position above
     let placement = 'top';
     // Calculate relative to container
     // For top placement, we want the bubble's bottom to be at (rect.top - gap)
     // We will use translateY(-100%) in CSS for top placement
     let top = rect.top - containerRect.top - 10;
     let left = rect.left - containerRect.left + (rect.width / 2);

     // Smart positioning logic
     const bubbleWidth = 320;
     const containerWidth = containerRect.width;

     // Check top boundary relative to viewport
     // If too close to top (less than ~120px space), flip to bottom
     if (rect.top < 120) {
         placement = 'bottom';
         top = rect.bottom - containerRect.top + 10;
     }

     // Check left boundary
     if (left - (bubbleWidth / 2) < 10) {
         left = (bubbleWidth / 2) + 10;
     }

     // Check right boundary
     if (left + (bubbleWidth / 2) > containerWidth - 10) {
         left = containerWidth - (bubbleWidth / 2) - 10;
     }

     textBubblePosition = { top, left, placement };
  }

  function handleClick(event) {
      const img = event.target.closest('img');
      if (img && editor.contains(img)) {
          activeImage = img;
          updateBubblePosition(img, true);
          showImageBubble = true;
          showLinkBubble = false;
          showTextBubble = false;
          return;
      }

      if (!event.target.closest('.image-bubble') && !event.target.closest('.toolbar')) {
          showImageBubble = false;
          activeImage = null;
      }
  }

  // Image Handlers
  function updateImageAlign(event) {
      if (!activeImage) return;
      const align = event.detail.value;

      activeImage.classList.remove('float-left', 'mr-4', 'mb-2', 'float-right', 'ml-4', 'mx-auto', 'block');
      const figure = activeImage.closest('figure');
      if (figure) {
          figure.classList.remove('float-left', 'mr-4', 'mb-2', 'float-right', 'ml-4', 'mx-auto', 'block');
      }

      if (align === 'left') {
          if (figure) figure.classList.add('float-left', 'mr-4', 'mb-2');
          else activeImage.classList.add('float-left', 'mr-4', 'mb-2');
      } else if (align === 'right') {
           if (figure) figure.classList.add('float-right', 'ml-4', 'mb-2');
           else activeImage.classList.add('float-right', 'ml-4', 'mb-2');
      } else if (align === 'center') {
           if (figure) figure.classList.add('mx-auto', 'block');
           else activeImage.classList.add('mx-auto', 'block');
      }
      handleInput();
  }

  function updateImageSize(event) {
      if (!activeImage) return;
      const size = event.detail.value;
      activeImage.style.width = size;
      activeImage.style.height = 'auto';
      handleInput();
      updateBubblePosition(activeImage, true);
  }

  function toggleImageCaption() {
      if (!activeImage) return;
      const figure = activeImage.closest('figure');

      if (figure) {
          // Unwrap
          const parent = figure.parentNode;
          parent.insertBefore(activeImage, figure);
          parent.removeChild(figure);
      } else {
          // Wrap
          const figureEl = document.createElement('figure');
          figureEl.className = 'image-wrapper my-4';

          // Move classes to figure if float/center
          if (activeImage.classList.contains('float-left')) {
              figureEl.classList.add('float-left', 'mr-4', 'mb-2');
              activeImage.classList.remove('float-left', 'mr-4', 'mb-2');
          } else if (activeImage.classList.contains('float-right')) {
              figureEl.classList.add('float-right', 'ml-4', 'mb-2');
              activeImage.classList.remove('float-right', 'ml-4', 'mb-2');
          } else if (activeImage.classList.contains('mx-auto')) {
              figureEl.classList.add('mx-auto', 'block');
              activeImage.classList.remove('mx-auto', 'block');
          }

          activeImage.parentNode.insertBefore(figureEl, activeImage);
          figureEl.appendChild(activeImage);

          const caption = document.createElement('figcaption');
          caption.innerText = 'Write a caption...';
          caption.className = 'text-center text-sm text-gray-500 mt-2 italic';
          figureEl.appendChild(caption);
      }
      handleInput();
      setTimeout(() => updateBubblePosition(activeImage, true), 0);
  }

  function updateImageAlt(event) {
      if (!activeImage) return;
      activeImage.alt = event.detail.value;
      handleInput();
  }

  function updateImageLink(event) {
      if (!activeImage) return;
      const { url, openInNewTab } = event.detail.value;

      const parent = activeImage.parentNode;

      if (url) {
          // Add or Update Link
          if (parent && parent.tagName === 'A') {
              // Update existing link
              parent.href = url;
              parent.target = openInNewTab ? '_blank' : '_self';
              if (openInNewTab) parent.rel = 'noopener noreferrer';
              else parent.removeAttribute('rel');
          } else {
              // Wrap with new link
              const anchor = document.createElement('a');
              anchor.href = url;
              anchor.target = openInNewTab ? '_blank' : '_self';
              if (openInNewTab) anchor.rel = 'noopener noreferrer';

              activeImage.parentNode.insertBefore(anchor, activeImage);
              anchor.appendChild(activeImage);
          }
      } else {
          // Remove Link
          if (parent && parent.tagName === 'A') {
              // Unwrap
              const grandParent = parent.parentNode;
              grandParent.insertBefore(activeImage, parent);
              grandParent.removeChild(parent);
          }
      }

      handleInput();
      setTimeout(() => updateBubblePosition(activeImage, true), 0);
  }

  function removeImage() {
      if (!activeImage) return;
      const figure = activeImage.closest('figure');
      if (figure) {
          figure.remove();
      } else {
          activeImage.remove();
      }
      activeImage = null;
      showImageBubble = false;
      handleInput();
  }

  onMount(() => {
    if (editor) {
      editor.innerHTML = stripNewlines(value || '');
      mounted = true;
      document.addEventListener('selectionchange', updateActiveStates);
    }
  });

  onDestroy(() => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('selectionchange', updateActiveStates);
    }
    if (activeStatesRaf && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(activeStatesRaf);
      activeStatesRaf = 0;
    }
  });

  // Sync value when prop changes.
  // Two cases:
  //   1. Internal update (user typed → handleInput dispatched → parent echoed
  //      value back). We skip the innerHTML reset to preserve caret position.
  //   2. External update (tab switch, translation result, programmatic set).
  //      We force innerHTML refresh so the editor reflects the new content.
  $: if (mounted && editor) {
    if (internalUpdate) {
      internalUpdate = false;
    } else if (value !== editor.innerHTML) {
      const isEmpty = (value === '' || value == null) && (editor.innerHTML === '' || editor.innerHTML === '<br>');
      if (!isEmpty) {
        editor.innerHTML = stripNewlines(value || '');
        updateActiveStates();
      }
    }
  }

  // Handle content changes
  function handleInput() {
    if (editor) {
      const content = editor.innerHTML;
      // Mark as internal so the reactive sync doesn't reset innerHTML
      // (which would lose the caret) when the parent echoes value back.
      internalUpdate = true;
      value = stripNewlines(content);
      dispatch('change', { html: value });
      updateActiveStates();

      // Update bubble position if visible
      if (showLinkBubble && activeLink) {
         updateBubblePosition(activeLink);
      }
      if (showImageBubble && activeImage) {
         updateBubblePosition(activeImage, true);
      }
    }
  }

  // Execute command
  function execCommand(command, value = null) {
    if (disabled) return;

    // Restore selection if available
    if (lastRange) {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(lastRange);
    } else if (editor) {
      editor.focus();
    }

    document.execCommand(command, false, value);
    editor.focus();
    handleInput();
    updateActiveStates();
  }

  // Keyboard shortcuts for the contenteditable editor.
  // Native browser undo/redo in contenteditable is unreliable once we
  // touch editor.innerHTML (reactive sync, cleanHtml, toggleHtml all
  // reset the undo stack), so we map the shortcuts explicitly to
  // execCommand('undo'/'redo') which uses the browser's native stack
  // as long as we haven't blown it away with an innerHTML assignment.
  function handleKeydown(event) {
    if (disabled) return;
    const mod = event.metaKey || event.ctrlKey;
    if (!mod) return;
    const key = event.key.toLowerCase();

    // Undo: Cmd/Ctrl + Z
    if (key === 'z' && !event.shiftKey) {
      event.preventDefault();
      execCommand('undo');
      return;
    }
    // Redo: Cmd/Ctrl + Shift + Z  OR  Cmd/Ctrl + Y
    if ((key === 'z' && event.shiftKey) || key === 'y') {
      event.preventDefault();
      execCommand('redo');
      return;
    }
  }

  function handleToolbarExec(event) {
      execCommand(event.detail.command, event.detail.value);
  }

  function handleTextBubbleExec(event) {
      if (event.detail.command === 'insertLink') {
          handleInsertLink({ detail: event.detail.value });
      } else {
          execCommand(event.detail.command, event.detail.value);
      }
  }

  function handleInsertLink(event) {
      const { url, text, openInNewTab } = event.detail;
      const target = openInNewTab ? '_blank' : '_self';
      const linkText = text || url;
      const html = `<a href="${url}" target="${target}" rel="noopener noreferrer" class="text-blue-600 hover:underline">${linkText}</a>`;
      execCommand('insertHTML', html);
  }

  function handleInsertImage(event) {
      execCommand('insertImage', event.detail.url);
  }

  function handleRemoveLink(event) {
      const link = event.detail.link;
      if (link) {
          const range = document.createRange();
          range.selectNode(link);
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
          lastRange = range;
          execCommand('unlink');
          showLinkBubble = false;
          activeLink = null;
      }
  }

  function selectGalleryImage(event) {
      const img = `<img src="${event.detail.url}" alt="" class="mx-auto block" style="max-width: 100%; height: auto;" />`;
      execCommand('insertHTML', img);
      showGalleryModal = false;
  }

  function handleInsertMarkdown(event) {
      execCommand('insertHTML', event.detail.html);
  }

  function toggleHtml() {
    showHtml = !showHtml;
    if (!showHtml) {
        // Switching back to WYSIWYG
        // Wait for DOM update then focus
        setTimeout(() => {
            if (editor) {
                editor.innerHTML = value;
                updateActiveStates();
            }
        }, 0);
    }
  }

  // Toggle Fullscreen
  function toggleFullscreen() {
    isFullscreen = !isFullscreen;
  }

  // Handle Paste (Clean up)
  function handlePaste(event) {
    if (disabled) return;
    // Prevent default and insert cleaned content so that styles/classes
    // pasted from Word/Google Docs don't pollute the editor.
    event.preventDefault();
    const cl = (event.clipboardData || window.clipboardData);
    if (!cl) {
      setTimeout(handleInput, 0);
      return;
    }
    const html = cl.getData('text/html');
    const text = cl.getData('text/plain');
    // Save selection so we can restore caret after inserting.
    const selection = window.getSelection();
    let savedRange = null;
    if (selection && selection.rangeCount > 0 && editor && editor.contains(selection.anchorNode)) {
      savedRange = selection.getRangeAt(0).cloneRange();
    }
    if (html) {
      // Insert as HTML then clean the whole editor.
      document.execCommand('insertHTML', false, html);
    } else if (text) {
      // Plain text — escape and wrap line breaks.
      const escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\r?\n/g, '<br>');
      document.execCommand('insertHTML', false, escaped);
    }
    // Clean the editor contents (strips foreign classes/styles).
    cleanHtml();
    // Restore caret to end of inserted content if possible.
    if (savedRange && editor) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedRange);
    }
  }

  // Click outside handler
  function cleanHtml() {
    if (!editor) return;

    let html = editor.innerHTML;

    // Remove empty tags
    html = html.replace(/<(\w+)[^>]*>\s*<\/\1>/gi, '');

    // Remove tags that only contain whitespace or &nbsp;
    html = html.replace(/<(\w+)[^>]*>(?:&nbsp;|\s)*<\/\1>/gi, '');

    // Remove inline styles on non-img elements.
    // Images need their max-width/height/width styles to stay responsive,
    // so we preserve style attributes on <img> tags.
    html = html.replace(/style="([^"]*)"/gi, (match, styleContent) => {
      // Heuristic: if this style belongs to an img it will be handled below.
      // We can't easily tell from the style attr alone, so we preserve
      // image-related CSS properties and strip the rest.
      const allowedProps = ['max-width', 'width', 'height'];
      const props = styleContent.split(';').map(p => p.trim()).filter(Boolean);
      const kept = props.filter(p => {
        const prop = p.split(':')[0].trim().toLowerCase();
        return allowedProps.includes(prop);
      });
      return kept.length > 0 ? `style="${kept.join('; ')}"` : '';
    });

    // Remove class attributes that are not in our whitelist
    const allowedClasses = ['float-left', 'float-right', 'mx-auto', 'block', 'mr-4', 'ml-4', 'mb-2', 'my-4', 'text-center', 'text-sm', 'text-gray-500', 'mt-2', 'italic', 'text-blue-600', 'hover:underline', 'image-wrapper'];
    html = html.replace(/class="([^"]*)"/gi, (match, classes) => {
      const classList = classes.split(/\s+/).filter(cls => allowedClasses.includes(cls));
      return classList.length > 0 ? `class="${classList.join(' ')}"` : '';
    });

    // Remove empty class attributes
    html = html.replace(/\s*class=""\s*/gi, ' ');

    // Remove font tags
    html = html.replace(/<\/?font[^>]*>/gi, '');

    // Remove span tags without attributes
    html = html.replace(/<span>([^<]*)<\/span>/gi, '$1');

    // Remove multiple consecutive <br> tags (more than 2)
    html = html.replace(/(<br\s*\/?>\s*){3,}/gi, '<br><br>');

    // Remove trailing <br> tags
    html = html.replace(/(<br\s*\/?>\s*)+$/gi, '');

    // Clean up multiple spaces
    html = html.replace(/\s{2,}/g, ' ');

    // Remove empty paragraphs
    html = html.replace(/<p[^>]*>(?:&nbsp;|\s)*<\/p>/gi, '');

    // Apply cleaned HTML
    editor.innerHTML = html;
    handleInput();
  }

  function handleClickOutside(event) {
    if (!event.target.closest('.rich-text-editor-container')) {
          showLinkBubble = false;
          showImageBubble = false;
    }
  }
</script>

<svelte:window on:click={handleClickOutside} />

<div bind:this={container} class="rich-text-editor-container {isFullscreen ? 'fullscreen' : ''}" class:disabled>
  <EditorToolbar
    {activeStates}
    {disabled}
    {lastRange}
    {showHtml}
    {uploadHandler}
    enableGallery={!!galleryFetcher}
    on:exec={handleToolbarExec}
    on:insertLink={handleInsertLink}
    on:insertImage={handleInsertImage}
    on:openGallery={() => showGalleryModal = true}
    on:openMarkdown={() => showMarkdownModal = true}
    on:toggleHtml={toggleHtml}
    on:toggleFullscreen={toggleFullscreen}
    on:cleanHtml={cleanHtml}
    on:closeBubble={() => showLinkBubble = false}
  />

  <!-- Editor Area -->
  {#if showHtml}
    <textarea
        class="editor w-full h-full font-mono text-sm p-4 outline-none resize-none bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200"
        style="min-height: {minHeight}; direction: ltr;"
        bind:value={value}
        on:input={(e) => dispatch('change', { html: value })}
    ></textarea>
  {:else}
  <div
    bind:this={editor}
    contenteditable={!disabled}
    class="editor swe-content focus:outline-none"
    style="min-height: {minHeight}; direction: {dir};"
    {dir}
    data-placeholder={placeholder}
    on:input={handleInput}
    on:paste={handlePaste}
    on:click={handleClick}
    on:keydown={handleKeydown}
  ></div>
  {/if}

  <!-- Link Bubble -->
  {#if !showHtml && showLinkBubble && activeLink}
     <LinkBubble
        {activeLink}
        position={bubblePosition}
        on:update={handleInput}
        on:remove={handleRemoveLink}
     />
  {/if}

  <!-- Text Bubble -->
  {#if !showHtml && showTextBubble}
      <TextBubble
        {activeStates}
        position={textBubblePosition}
        on:exec={handleTextBubbleExec}
      />
  {/if}

  <!-- Image Bubble -->
  {#if !showHtml && showImageBubble && activeImage}
     <ImageBubble
        {activeImage}
        position={imageBubblePosition}
        on:update={(e) => {
            if (e.detail.type === 'align') updateImageAlign(e);
            else if (e.detail.type === 'size') updateImageSize(e);
            else if (e.detail.type === 'caption') toggleImageCaption();
            else if (e.detail.type === 'alt') updateImageAlt(e);
            else if (e.detail.type === 'link') updateImageLink(e);
        }}
        on:remove={removeImage}
     />
  {/if}

  <!-- Gallery Modal -->
  <GalleryModal
    bind:show={showGalleryModal}
    {galleryFetcher}
    on:select={selectGalleryImage}
  />

  <!-- Markdown Modal -->
  <MarkdownImportModal
    bind:show={showMarkdownModal}
    on:insert={handleInsertMarkdown}
  />
</div>

<style>
  .rich-text-editor-container {
    @apply flex flex-col w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm transition-all duration-200 relative;
  }

  .rich-text-editor-container:focus-within {
    @apply border-gray-300 dark:border-gray-600;
  }

  .rich-text-editor-container.fullscreen {
    @apply fixed inset-0 z-50 rounded-none h-screen;
  }

  .rich-text-editor-container.disabled {
    @apply opacity-60 pointer-events-none bg-gray-50 dark:bg-gray-900;
  }

  /* Editor */
  .editor {
    @apply p-6 overflow-y-auto outline-none;
  }

  .editor[contenteditable]:empty:before {
    content: attr(data-placeholder);
    @apply text-gray-400 dark:text-gray-500 absolute cursor-text select-none;
  }

  /* WYSIWYG content typography (replaces @tailwindcss/typography prose).
     Self-contained so consumers don't need the typography plugin. */
  .swe-content {
    @apply text-gray-800 dark:text-gray-200 leading-relaxed;
  }
  .swe-content h1 { @apply text-3xl font-bold mt-6 mb-4; }
  .swe-content h2 { @apply text-2xl font-bold mt-6 mb-3; }
  .swe-content h3 { @apply text-xl font-semibold mt-5 mb-2; }
  .swe-content p  { @apply my-3; }
  .swe-content ul { @apply list-disc pl-6 my-3; }
  .swe-content ol { @apply list-decimal pl-6 my-3; }
  .swe-content li { @apply my-1; }
  .swe-content a  { @apply text-blue-600 underline hover:text-blue-700; }
  .swe-content blockquote {
    @apply border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-4 text-gray-600 dark:text-gray-400;
  }
  .swe-content pre {
    @apply bg-gray-100 dark:bg-gray-900 rounded p-4 overflow-x-auto my-4 text-sm font-mono;
  }
  .swe-content code {
    @apply bg-gray-100 dark:bg-gray-900 rounded px-1 py-0.5 text-sm font-mono;
  }
  .swe-content pre code { @apply bg-transparent p-0; }
  .swe-content img { @apply rounded my-4 max-w-full h-auto; }
  .swe-content hr  { @apply border-gray-200 dark:border-gray-700 my-6; }
  .swe-content figure { @apply my-4; }
  .swe-content figcaption { @apply text-center text-sm text-gray-500 mt-2 italic; }
</style>
