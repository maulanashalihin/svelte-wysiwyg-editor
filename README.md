# svelte-wysiwyg-editor

A dependency-light WYSIWYG rich text editor for **Svelte 4 & 5**. Built on the native `contenteditable` + `document.execCommand` API — no ProseMirror, no TipTap, no heavy framework. Just Svelte + the browser.

## Features

- **Formatting**: bold, italic, underline, strikethrough, headings (H1–H3), blockquote, paragraph
- **Lists**: ordered & unordered
- **Alignment**: left, center, right, justify
- **Colors**: text color & highlight color pickers
- **Links**: insert/edit/remove via toolbar popover or inline text bubble
- **Images**: insert by URL, upload via configurable handler, or pick from a configurable gallery
- **Image controls**: alignment, size (S/M/L), caption toggle, alt text, link wrapping, remove
- **Markdown import**: paste markdown, converted to HTML via `marked`
- **HTML source view**: toggle raw HTML editing
- **Fullscreen mode**
- **Paste cleanup**: strips foreign styles/classes from Word/Google Docs paste
- **HTML cleanup**: whitelist-based class/style sanitizer
- **RTL support**: `dir` prop
- **Keyboard shortcuts**: Ctrl/Cmd+Z (undo), Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y (redo)
- **Dark mode**: Tailwind `dark:` variants throughout

## Install

```bash
npm install svelte-wysiwyg-editor
# or
pnpm add svelte-wysiwyg-editor
# or
yarn add svelte-wysiwyg-editor
```

### Peer requirements

- `svelte` ^4.0.0 || ^5.0.0
- **Tailwind CSS** ^3.0.0 (the component uses `@apply` and utility classes heavily)

If your project doesn't use Tailwind, the editor will still render but unstyled. See [Tailwind setup](#tailwind-setup) below.

## Usage

### Basic

```svelte
<script>
  import { RichTextEditor } from 'svelte-wysiwyg-editor';

  let html = '';
</script>

<RichTextEditor bind:value={html} on:change={(e) => html = e.detail.html} />
```

### With image upload

Pass an `uploadHandler` — an async function that receives a `File` and returns the uploaded image URL:

```svelte
<script>
  import { RichTextEditor } from 'svelte-wysiwyg-editor';

  let html = '';

  async function uploadImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    return data.url; // must return the public URL string
  }
</script>

<RichTextEditor bind:value={html} {uploadHandler} />
```

When `uploadHandler` is provided, the "Upload Image" button appears in the image popover. When omitted, only "Insert by URL" is available.

### With image gallery

Pass a `galleryFetcher` — an async function that receives `{ page, limit }` and returns `{ data: Array<{ url, name }>, meta: { total } }`:

```svelte
<script>
  import { RichTextEditor } from 'svelte-wysiwyg-editor';

  let html = '';

  async function fetchGallery({ page, limit }) {
    const res = await fetch(`/api/gallery?page=${page}&limit=${limit}`);
    return await res.json(); // { data: [{ url, name }], meta: { total } }
  }
</script>

<RichTextEditor bind:value={html} {galleryFetcher} />
```

When `galleryFetcher` is provided, the "Choose from Gallery" button appears and opens the gallery modal with pagination.

### RTL

```svelte
<RichTextEditor bind:value={html} dir="rtl" placeholder="اكتب هنا..." />
```

### Disabled

```svelte
<RichTextEditor bind:value={html} disabled />
```

## Props

| Prop             | Type       | Default                    | Description                                                                 |
|------------------|------------|----------------------------|-----------------------------------------------------------------------------|
| `value`          | `string`   | `''`                       | HTML content (two-way bindable)                                             |
| `placeholder`    | `string`   | `'Write something amazing...'` | Placeholder shown when empty                                            |
| `dir`            | `string`   | `'ltr'`                    | Text direction: `'ltr'` or `'rtl'`                                          |
| `minHeight`      | `string`   | `'300px'`                  | CSS min-height of the editor area                                           |
| `disabled`       | `boolean`  | `false`                    | Disable editing                                                             |
| `uploadHandler`  | `function` | `null`                     | `async (file: File) => Promise<string>` — returns uploaded image URL       |
| `galleryFetcher` | `function` | `null`                     | `async ({ page, limit }) => Promise<{ data, meta }>` — gallery listing     |

## Events

| Event    | Detail           | Description                                  |
|----------|------------------|----------------------------------------------|
| `change` | `{ html: string }` | Fired on every content change (input, format, paste, etc.) |

```svelte
<RichTextEditor on:change={(e) => console.log(e.detail.html)} />
```

## Tailwind setup

This component uses Tailwind `@apply` in its `<style>` blocks and utility classes in templates. For the styles to compile, your Tailwind config must scan the package's `.svelte` files:

```js
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{svelte,js,ts}',
    './node_modules/svelte-wysiwyg-editor/**/*.{svelte,js}',
  ],
  // ...
};
```

The editor area uses `@tailwindcss/typography` (`prose` classes). Install it if you want the WYSIWYG content styled like an article:

```bash
npm install @tailwindcss/typography
```

```js
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{svelte,js,ts}',
    './node_modules/svelte-wysiwyg-editor/**/*.{svelte,js}',
  ],
  plugins: [require('@tailwindcss/typography')],
};
```

## How it works

The editor uses the browser's native `contenteditable` + `document.execCommand` API. This keeps the bundle tiny (no ProseMirror/TipTap) and the behavior familiar. `execCommand` is technically deprecated but still works in all major browsers and is the pragmatic choice for a lightweight editor.

Content is sanitized on paste and via the "Clean HTML" toolbar button using a class/property whitelist so that foreign styles from Word/Google Docs don't pollute the output.

## License

MIT © Maulana Shalihin
