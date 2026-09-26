import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

assert.match(html, /data-language-toggle/, 'language control is required');
const translated = [...html.matchAll(/data-i18n="[^"]+"/g)];
assert.ok(translated.length >= 35, 'core content requires authored bilingual nodes');
for (const node of translated) {
  const start = Math.max(0, node.index - 220);
  const snippet = html.slice(start, node.index + 220);
  assert.match(snippet, /data-en="[^"]+"/, `${node[0]} needs English copy`);
  assert.match(snippet, /data-hi="[^"]+"/, `${node[0]} needs Hindi copy`);
}
console.log(`Bilingual content check passed: ${translated.length} authored nodes.`);
