import test from 'node:test';
import assert from 'node:assert/strict';
import { personalPathHits } from '../scripts/check-paths.mjs';

const home = (prefix, username) => `/${prefix}/${username}/project`;
test('personal paths are rejected regardless of username punctuation or case', () => {
  for (const username of ['alice', 'Alice', 'alice.smith', 'alice-smith', 'alice_1']) {
    for (const prefix of ['Users', 'home']) assert.equal(personalPathHits(home(prefix, username)).length, 1);
  }
});
test('only deliberate placeholder and runtime homes are accepted', () => {
  for (const username of ['example', 'node', 'runner']) {
    for (const prefix of ['Users', 'home']) assert.deepEqual(personalPathHits(home(prefix, username)), []);
  }
  assert.equal(personalPathHits(`${home('Users', 'example')} ${home('Users', 'alice')}`).length, 1);
  assert.equal(personalPathHits(home('home', 'runner-personal')).length, 1);
});
test('diagnostics identify the line containing each private path', () => {
  assert.equal(personalPathHits(`safe\n${home('Users', 'alice')}\n`)[0].line, 2);
});
test('website paths are not mistaken for filesystem homes', () => {
  assert.deepEqual(personalPathHits('https://docs.confluent.io/home/sitemap.xml https://host/ja-jp/home/sitemap.xml'), []);
  assert.equal(personalPathHits(`"${home('Users', 'alice')}"`).length, 1);
});
