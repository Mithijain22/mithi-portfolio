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
<symbol id="lips" viewBox="0 0 200 200">
<path id="lips-mouth" d="M18 92C38 52 82 44 100 70C118 44 162 52 182 92C164 132 132 142 100 142C68 142 36 132 18 92Z" style="fill:#FCE3D5;stroke:#FCE3D5;stroke-width:16;stroke-linejoin:round"/>
<path id="lips-tongue" d="M70 112C66 152 82 184 100 186C118 184 134 152 130 112C120 122 108 124 100 124C92 124 80 122 70 112Z" style="fill:#FCE3D5;stroke:#FCE3D5;stroke-width:16;stroke-linejoin:round"/>
<use href="#lips-tongue" style="fill:#F2502C;stroke:#0A0A0A;stroke-width:5;stroke-linejoin:round"/>
<path d="M100 126V172" style="stroke:#BD2E0B;stroke-width:5;stroke-linecap:round;fill:none"/>
<path d="M83 134C80 150 86 164 93 171" style="stroke:#FCE3D5;stroke-width:6;stroke-linecap:round;fill:none"/>
<use href="#lips-mouth" style="fill:#F2502C;stroke:#0A0A0A;stroke-width:5;stroke-linejoin:round"/>
<path d="M38 92C60 76 86 80 100 90C114 80 140 76 162 92C146 114 126 120 100 120C74 120 54 114 38 92Z" style="fill:#0A0A0A"/>
<path d="M52 90C70 82 88 86 100 93C112 86 130 82 148 90C138 100 120 103 100 103C80 103 62 100 52 90Z" style="fill:#FCE3D5;stroke:#0A0A0A;stroke-width:3;stroke-linejoin:round"/>
<path d="M76 88V100M88 92V102M112 92V102M124 88V100" style="stroke:#0A0A0A;stroke-width:2.5;stroke-linecap:round"/>
<path d="M44 84C56 66 74 60 90 66" style="stroke:#FCE3D5;stroke-width:6;stroke-linecap:round;fill:none"/>
<path d="M156 84C146 70 134 64 124 64" style="stroke:#FCE3D5;stroke-width:5;stroke-linecap:round;fill:none"/>
</symbol>
</defs></svg>`;

export const OBJECT_IDS = ['note', 'bell', 'ticket', 'cursor'] as const;
export const CW = ['a', 'b', 'c'] as const;

export const obj = (id: string, cw: string) =>
  `<svg class="obj cw-${cw}" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><use href="#obj-${id}"/></svg>`;

export const lips = (cls = 'lips') =>
  `<svg class="${cls}" viewBox="0 0 200 200" aria-hidden="true" focusable="false"><use href="#lips"/></svg>`;
