import type { DefineComponent } from 'vue';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number | string;

/** Vue component rendered by the Vite integration or usable directly. */
export const Icon: DefineComponent<{
  name: { type: StringConstructor; required: true };
  prefix: { type: StringConstructor; default: string };
  label: { type: StringConstructor; default: undefined };
  size: { type: readonly [StringConstructor, NumberConstructor]; default: undefined };
}>;
