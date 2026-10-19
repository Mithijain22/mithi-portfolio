// Original flat SVG objects. Colors come from CSS vars --o1/--o2/--o3 set by
// the .cw-a / .cw-b / .cw-c colorway classes, so one symbol serves all three.
const S = 'stroke:#0A0A0A;stroke-width:3;stroke-linejoin:round;stroke-linecap:round';

function dots(): string {
  // halftone-style dot grid, used as the "ink layer" of placeholder art
  let out = '';
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 10; c++) {
      const rad = 3 + ((r * 3 + c * 2) % 5) * 0.9;
      out += `<circle cx="${8 + c * 16 + (r % 2) * 8}" cy="${8 + r * 16}" r="${rad.toFixed(1)}"/>`;
    }
  }
  return out;
}

export const SPRITE = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
<symbol id="obj-note" viewBox="0 0 64 64"><path d="M10 10h44v34L44 54H10z" style="fill:var(--o1);${S}"/><path d="M44 54V44h10z" style="fill:var(--o2);${S}"/><path d="M18 22h28M18 31h28M18 40h14" style="fill:none;${S}"/></symbol>
<symbol id="obj-bell" viewBox="0 0 64 64"><path d="M32 8c-12 0-16 10-16 22v8l-6 8h44l-6-8v-8C48 18 44 8 32 8z" style="fill:var(--o2);${S}"/><circle cx="32" cy="53" r="5" style="fill:var(--o3);${S}"/></symbol>
<symbol id="obj-ticket" viewBox="0 0 64 64"><path d="M6 18h52v9a5 5 0 0 0 0 10v9H6v-9a5 5 0 0 0 0-10z" style="fill:var(--o3);${S}"/><path d="M44 18v28" style="fill:none;stroke-dasharray:3 4;${S}"/><rect x="14" y="26" width="20" height="12" style="fill:var(--o1);${S}"/></symbol>
<symbol id="obj-cursor" viewBox="0 0 64 64"><path d="M16 8v42l10-10 7 16 7-3-7-15h14z" style="fill:var(--o1);${S}"/></symbol>
<symbol id="art-dots" viewBox="0 0 160 96" preserveAspectRatio="xMidYMid slice"><g style="fill:var(--o2)">${dots()}</g></symbol>
<symbol id="lips" viewBox="0 0 64 64">
<g style="stroke:#FCE3D5;stroke-width:6;stroke-linejoin:round;fill:#F2502C">
<path d="M6 34C16 16 27 14 32 23c5-9 16-7 26 11-9-4-19-4-26-2-7-2-17-2-26 2z"/>
<path d="M6 34c10-2 19-2 26 0 7-2 16-2 26 0-6 16-16 21-26 21S12 50 6 34z"/></g>
<path d="M6 34c10-2 19-2 26 0 7-2 16-2 26 0" style="fill:none;stroke:#0A0A0A;stroke-width:3;stroke-linecap:round"/>
</symbol>
</defs></svg>`;

export const OBJECT_IDS = ['note', 'bell', 'ticket', 'cursor'] as const;
export const CW = ['a', 'b', 'c'] as const;

export const obj = (id: string, cw: string) =>
  `<svg class="obj cw-${cw}" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><use href="#obj-${id}"/></svg>`;

export const lips = (cls = 'lips') =>
  `<svg class="${cls}" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><use href="#lips"/></svg>`;
