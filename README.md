# icon-forge

`icon-forge` finds the Iconify icons referenced by an application and emits only those icons as local CSS. It makes no runtime API request and has no dependency on a UI framework: its classes work in plain HTML, Bootstrap, Basecoat, vue-skin, or custom CSS.

For Vite + Vue it also enables this without changing `main.js` or `app.js`:

```vue
<Icon name="mdi:plus" />
```

## Install

```bash
npm install -D @acmepy/icon-forge
```

The default API mode needs no additional Iconify package. The optional local mode is documented below.

## Vite + Vue

Add the plugin once, after the Vue plugin, in `vite.config.js`:

```js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { iconForge } from '@acmepy/icon-forge/vite';

export default defineConfig({
  plugins: [vue(), iconForge()],
});
```

Then use a literal Iconify name in any Vue SFC. The Vite plugin imports the Vue component and generated CSS automatically.

```vue
<template>
  <button class="button-primary">
    <Icon name="mdi:plus" />
    Create item
  </button>

  <Icon name="ph:gear-six" label="Settings" />
</template>
```

`Icon` renders a `span`, inherits `currentColor`, and is decorative by default (`aria-hidden="true"`). Passing `label` makes it an accessible image.

### Vite configuration

```js
iconForge({
  prefix: 'app-icon',        // default: 'icon'
  component: 'AppIcon',      // default: 'Icon'
  source: ['src', 'shared'], // default: ['src']
  iconSource: 'api',         // default: requests only detected icons
  cacheDir: '.icon-forge/cache',
})
```

With that configuration, use `<AppIcon name="mdi:plus" />`. The plugin watches the configured source folders in development and regenerates the virtual stylesheet when files change.

## Vue without the Vite plugin

Use the CLI once to create a stylesheet, import it in your application, and import the component normally:

```js
// src/main.js
import { createApp } from 'vue';
import { Icon } from '@acmepy/icon-forge/vue';
import './icon-forge.css';
import App from './App.vue';

createApp(App).component('Icon', Icon).mount('#app');
```

```vue
<template>
  <Icon name="mdi:delete" />
</template>
```

If the CLI was run with `--prefix app-icon`, pass the same prefix: `<Icon prefix="app-icon" name="mdi:delete" />`.

## Framework-neutral HTML classes

Classes are an alternative to the Vue component and work anywhere:

```html
<!-- Bootstrap, Basecoat, plain HTML, etc. -->
<button class="btn btn-primary">
  <i class="icon:mdi:plus"></i>
  Create item
</button>
```

Colons are valid in HTML class names. To target one in CSS, escape them:

```css
.icon\:mdi\:plus { margin-right: .35rem; }
```

## CLI

The CLI scans `src` by default and writes `src/icon-forge.css` by default.

```bash
npx icon-forge build
```

Import the generated file from your usual style or JavaScript entry point:

```js
import './icon-forge.css';
```

Specify a class prefix and output location when needed:

```bash
npx icon-forge build --prefix app-icon --css src/styles/icons.css
```

### Icon data sources

The default source is the public Iconify API. It downloads only the icon names detected in the project, stores them in `.icon-forge/cache`, and embeds them in the generated stylesheet. The deployed application remains fully local and makes no Iconify request.

For an offline or isolated build, install Iconify's complete local JSON collection and select the local source:

```bash
npm install -D @iconify/json
npx icon-forge build --icon-source local
```

This mode downloads the full Iconify collection, so it is substantially larger than API mode. It is useful when builds must run without network access and a pre-populated API cache is not appropriate.

Use the API cache without network access after it has been populated:

```bash
npx icon-forge build --offline
```

For a different project directory:

```bash
npx icon-forge build --root ../my-app --css src/styles/icons.css
```

The supported commands are `build` (the default) and `generate`; they are equivalent in this version.

## Icon discovery

Only literal references are detected:

```vue
<Icon name="mdi:plus" />
<i class="icon:mdi:plus"></i>
```

Dynamic references are deliberately not included yet:

```vue
<!-- Not detected -->
<Icon :name="currentIcon" />
```

Use literal names until an explicit manifest is introduced in a later release. This keeps output deterministic and minimal.

## Run the included example

```bash
cd examples/vue-app
npm install
npm run dev
```

Vite prints the local URL, normally `http://localhost:5173`.

## Design boundaries

- No runtime Iconify API calls.
- No dependency on Framework7, Bootstrap, Basecoat, or another component library.
- Vite and Vue are optional peer dependencies.
- Iconify aliases and transformations are resolved by `@iconify/utils`.
