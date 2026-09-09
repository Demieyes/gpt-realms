import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const OUT = join(process.cwd(), 'public', 'assets', 'models');
await mkdir(OUT, { recursive: true });

const assets = [
  {
    name: 'wayfarer.glb',
    url: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/RobotExpressive/RobotExpressive.glb'
  },
  {
    name: 'ember-fox.glb',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Fox/glTF-Binary/Fox.glb'
  }
];

for (const asset of assets) {
  const response = await fetch(asset.url);
  if (!response.ok) throw new Error(`Failed to fetch ${asset.name}: HTTP ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength < 10000) throw new Error(`Downloaded ${asset.name} is unexpectedly small`);
  await writeFile(join(OUT, asset.name), bytes);
  console.log(`Fetched ${asset.name} (${Math.round(bytes.byteLength/1024)} KB)`);
}
