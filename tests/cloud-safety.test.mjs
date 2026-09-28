import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('云端会话中的邮箱在插入登录面板前会转义',()=>{
  const source=fs.readFileSync(new URL('../cloud.js',import.meta.url),'utf8');
  assert.match(source,/const escapeCloudText=value=>String\(value\?\?''\)\.replace/);
  assert.match(source,/已登录：'\+escapeCloudText\(email\)\+'/);
  assert.doesNotMatch(source,/已登录：'\+email\+'/);
});
