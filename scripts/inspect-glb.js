/**
 * One-off script to inspect a GLB's nodes/scenes for structure (e.g. Blender collections).
 * Run: node scripts/inspect-glb.js public/models/minigame.glb
 */
const fs = require('fs');
const path = require('path');

const glbPath = process.argv[2] || 'public/models/minigame.glb';
const buf = fs.readFileSync(path.resolve(process.cwd(), glbPath));

// GLB: 12-byte header, then Chunk0 (JSON)
const magic = buf.toString('utf8', 0, 4);
const version = buf.readUInt32LE(4);
const totalLength = buf.readUInt32LE(8);
const chunk0Length = buf.readUInt32LE(12);
const chunk0Type = buf.readUInt32LE(16);
const jsonStr = buf.toString('utf8', 20, 20 + chunk0Length);

if (magic !== 'glTF') {
  console.error('Not a valid GLB file');
  process.exit(1);
}

const gltf = JSON.parse(jsonStr);

function nodeTree(nodes, nodeIndex, indent = '') {
  if (nodeIndex == null || !nodes[nodeIndex]) return;
  const n = nodes[nodeIndex];
  const name = n.name || '(unnamed)';
  const mesh = n.mesh != null ? ` [mesh ${n.mesh}]` : '';
  const children = n.children || [];
  console.log(`${indent}${name}${mesh}`);
  children.forEach((ci) => nodeTree(nodes, ci, indent + '  '));
}

console.log('=== minigame.glb structure ===\n');
console.log('Scenes:', gltf.scenes?.length ?? 0);
gltf.scenes?.forEach((s, i) => {
  console.log(`\nScene[${i}] name: ${s.name ?? '(default)'}`);
  (s.nodes || []).forEach((nodeIndex) => nodeTree(gltf.nodes, nodeIndex));
});

console.log('\n--- All nodes (flat) ---');
gltf.nodes?.forEach((n, i) => {
  const name = n.name || '(unnamed)';
  const mesh = n.mesh != null ? ` mesh=${n.mesh}` : '';
  const children = (n.children || []).length;
  console.log(`  [${i}] ${name}${mesh} children=${children}`);
});

console.log('\n--- Node names containing "set", "start", "end", "collection", "minigame", "empty" ---');
gltf.nodes?.forEach((n, i) => {
  const name = (n.name || '').toLowerCase();
  if (name.includes('set') || name.includes('start') || name.includes('end') || name.includes('collection') || name.includes('minigame') || name.includes('empty')) {
    const children = (n.children || []).length;
    console.log(`  [${i}] ${n.name} children=${children} extras=${JSON.stringify(n.extras || {})}`);
  }
});

console.log('\n--- Nodes with non-empty .extras ---');
gltf.nodes?.forEach((n, i) => {
  if (n.extras && Object.keys(n.extras).length > 0) {
    console.log(`  [${i}] ${n.name} extras=${JSON.stringify(n.extras)}`);
  }
});

console.log('\n--- Scenes extras ---');
gltf.scenes?.forEach((s, i) => {
  if (s.extras && Object.keys(s.extras).length > 0) {
    console.log(`  Scene[${i}] extras=${JSON.stringify(s.extras)}`);
  }
});

// Full hierarchy: show which nodes have children (potential group nodes)
console.log('\n--- Nodes that have children (possible groups/collections) ---');
gltf.nodes?.forEach((n, i) => {
  const children = n.children || [];
  if (children.length > 0) {
    console.log(`  [${i}] "${n.name}" children=${children.length} -> [${children.join(', ')}]`);
  }
});

// Animations
console.log('\n--- Animations ---');
(gltf.animations || []).forEach((anim, i) => {
  console.log(`\nAnimation[${i}] name: ${anim.name || '(unnamed)'}`);
  (anim.channels || []).forEach((ch, j) => {
    const target = gltf.nodes?.[ch.target?.node] || {};
    const path = ch.target?.path || '?';
    console.log(`  channel ${j}: node "${target.name}" path="${path}"`);
  });
});

// Search entire JSON for minigame/start/set1/set2/set3
const jsonStr2 = JSON.stringify(gltf);
['minigame', 'start', 'set1', 'set2', 'set3'].forEach((key) => {
  if (jsonStr2.toLowerCase().includes(key.toLowerCase())) {
    console.log(`\n--- String "${key}" found in GLB JSON ---`);
    // Find where
    const idx = jsonStr2.toLowerCase().indexOf(key.toLowerCase());
    const snippet = jsonStr2.substring(Math.max(0, idx - 30), idx + key.length + 30);
    console.log(`  ...${snippet}...`);
  }
});
