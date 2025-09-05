// File: frontend/src/components/HTMLPreserver.tsx
// Custom TipTap extension to preserve HTML inline styles (especially colors)
// Based on the successful implementation from tiptap-test

import { Extension } from '@tiptap/core';

export const HTMLPreserver = Extension.create({
  name: 'htmlPreserver',
  
  addGlobalAttributes() {
    return [
      {
        types: ['heading', 'paragraph', 'textStyle', 'bold'],
        attributes: {
          style: {
            default: null,
            parseHTML: element => {
              const style = element.getAttribute('style');
              return style || null;
            },
            renderHTML: attributes => {
              if (!attributes.style) return {};
              return { style: attributes.style };
            },
          },
          color: {
            default: null,
            parseHTML: element => {
              const style = element.getAttribute('style');
              if (style) {
                const colorMatch = style.match(/color:\s*([^;]+)/);
                return colorMatch ? colorMatch[1].trim() : null;
              }
              return null;
            },
            renderHTML: attributes => {
              if (!attributes.color) return {};
              return { style: `color: ${attributes.color}` };
            },
          },
        },
      },
    ];
  },
});

export default HTMLPreserver;