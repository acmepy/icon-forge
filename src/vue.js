import { defineComponent, h } from 'vue';
import { resolveSize } from './size.js';

/** A framework-neutral Vue renderer. The Vite plugin injects its generated CSS. */
export const Icon = defineComponent({
  name: 'Icon',
  inheritAttrs: false,
  props: {
    name: { type: String, required: true },
    prefix: { type: String, default: 'icon' },
    label: { type: String, default: undefined },
    size: { type: [String, Number], default: undefined },
  },
  setup(props, { attrs }) {
    return () => {
      const size = resolveSize(props.size);

      return h('span', {
        ...attrs,
        class: [attrs.class, `${props.prefix}:${props.name}`],
        style: [attrs.style, size ? { width: size, height: size } : undefined],
        role: props.label ? 'img' : undefined,
        'aria-label': props.label,
        'aria-hidden': props.label ? undefined : 'true',
      });
    };
  },
});
