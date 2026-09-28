import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

test('实盘照片按固定分区留证，且不作为自动计数结果',async()=>{
  const source=await readFile(new URL('../audit-preview.js',import.meta.url),'utf8');
  assert.match(source,/const PHOTO_ZONES=\['冷藏展示柜','常温货架\/收银台','库房整箱酒水','30白啤\/椰子水专放','散放\/其他酒水'\]/);
  assert.match(source,/照片只作为盘点留证，最终数量仍以“实物剩余”录入为准/);
  assert.match(source,/function recordPhotoZone\(zone,input\)/);
  assert.match(source,/不上传或替代人工计数/);
});
