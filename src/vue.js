import { defineComponent, h } from 'vue';

/** A framework-neutral Vue renderer. The Vite plugin injects its generated CSS. */
export const Icon = defineComponent({
  name: 'Icon',
  inheritAttrs: false,
  props: {
    name: { type: String, required: true },
    prefix: { type: String, default: 'icon' },
    label: { type: String, default: undefined },
  },
  setup(props, { attrs }) {
    return () => h('span', {
      ...attrs,
      class: [attrs.class, `${props.prefix}:${props.name}`],
      role: props.label ? 'img' : undefined,
      'aria-label': props.label,
      'aria-hidden': props.label ? undefined : 'true',
    });
  },
});
