import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeBookResponse, validateRecord } from '../../scripts/architecture/validate-records.mjs';

const identity = ({ title, author, edition }) => ({ title, author, edition });
const book = (title = 'Architecture in Practice', edition = '1st') => ({
  title,
  author: 'Example Author',
  edition,
  source_url: 'https://example.org/catalogue/book',
  locator: 'Catalogue entry, edition statement',
  fit: 'Supports evaluation of the service boundary.',
});
const request = (overrides = {}) => ({
  request_id: 'request-1', role: 'systems', question: 'Where should the service boundary be?',
  request_kind: 'initial', excluded_books: [], ...overrides,
});
const response = (req, books = [book()], overrides = {}) => ({
  request_id: req.request_id, role: req.role, request_kind: req.request_kind,
  status: 'selected', books, ...overrides,
});
const initial = () => {
  const req = request();
  return mergeBookResponse(req, response(req, [book('Boundaries'), book('Reliability')]));
};
const replacement = (current, overrides = {}) => request({
  request_id: 'request-2', request_kind: 'replacement', replaced_book_id: current.books[0].id,
  excluded_books: [identity(current.books[0])], ...overrides,
});
const unavailable = (req) => ({
  request_id: req.request_id, role: req.role, request_kind: req.request_kind,
  status: 'unavailable', reason: 'No relevant edition with verifiable identity was found.',
});

test('initial response accepts the useful number of books and assigns stable IDs', () => {
  for (const count of [1, 5]) {
    const req = request();
    const selected = response(req, Array.from({ length: count }, (_, i) => book(`Book ${i}`)));
    const accepted = mergeBookResponse(req, selected);
    assert.equal(validateRecord('accepted-books', accepted).valid, true);
    assert.deepEqual(accepted.books.map((entry) => entry.id), Array.from({ length: count }, (_, i) => `b${i + 1}`));
    assert.equal('id' in selected.books[0], false);
  }
});

test('response cardinality distinguishes initial selections from one-book replacements', () => {
  for (const count of [0]) {
    assert.equal(validateRecord('book-response', response(request(), Array.from({ length: count }, (_, i) => book(`Book ${i}`)))).valid, false);
  }
  const req = replacement(initial());
  assert.equal(validateRecord('book-response', response(req, [book('New')])).valid, true);
  for (const books of [[], [book('New'), book('Other')]]) {
    assert.equal(validateRecord('book-response', response(req, books)).valid, false);
  }
});

test('replacement merges into a separately valid full collection without renumbering', () => {
  const current = initial();
  const before = structuredClone(current);
  const req = replacement(current);
  const selected = response(req, [book('New boundaries')]);
  const accepted = mergeBookResponse(req, selected, current);
  assert.equal(validateRecord('book-response', selected).valid, true);
  assert.equal(validateRecord('accepted-books', accepted).valid, true);
  assert.equal(accepted.record_type, 'accepted_books');
  assert.equal(accepted.books.length, 2);
  assert.deepEqual(accepted.books.map((entry) => entry.id), ['b1', 'b2']);
  assert.equal(accepted.books[0].title, 'New boundaries');
  assert.deepEqual(accepted.books[1], current.books[1]);
  assert.deepEqual(current, before);
  accepted.books[0].title = 'Changed output';
  accepted.books[1].fit = 'Changed output';
  assert.equal(selected.books[0].title, 'New boundaries');
  assert.deepEqual(current, before);
});

test('request and response echo fields must match exactly', () => {
  const req = request();
  for (const [field, value] of [['request_id', 'another'], ['role', 'security'], ['request_kind', 'replacement']]) {
    assert.throws(() => mergeBookResponse(req, response(req, [book()], { [field]: value })), new RegExp(field));
  }
});

test('replacement requests identify and exclude the current rejected edition', () => {
  const current = initial();
  const req = replacement(current);
  const missingTarget = { ...req };
  delete missingTarget.replaced_book_id;
  assert.equal(validateRecord('book-request', missingTarget).valid, false);
  assert.equal(validateRecord('book-request', request({ replaced_book_id: 'b1' })).valid, false);
  assert.equal(validateRecord('book-request', { ...req, excluded_books: [] }).valid, false);
  assert.throws(() => mergeBookResponse(req, response(req), null), /requires an accepted collection/);
  const unknown = { ...req, replaced_book_id: 'b9' };
  assert.throws(() => mergeBookResponse(unknown, response(unknown), current), /target/);
  const notExcluded = { ...req, excluded_books: [identity(book('Other'))] };
  assert.throws(() => mergeBookResponse(notExcluded, response(notExcluded), current), /exclude the rejected target/);
});

test('repeated exclusions and unaffected identities cannot be selected again', () => {
  const current = initial();
  const req = replacement(current);
  assert.throws(() => mergeBookResponse(req, response(req, [book('Boundaries')]), current), /excluded edition/);
  assert.throws(() => mergeBookResponse(req, response(req, [book('Reliability')]), current), /Duplicate book identity/);
  const next = mergeBookResponse(req, response(req, [book('New boundaries')]), current);
  const retry = replacement(next, {
    request_id: 'request-3',
    excluded_books: [...req.excluded_books, identity(next.books[0])],
  });
  assert.throws(() => mergeBookResponse(retry, response(retry, [book('Boundaries')]), next), /excluded edition/);
  const final = mergeBookResponse(retry, response(retry, [book('Third boundaries')]), next);
  assert.deepEqual(final.books.map((entry) => entry.id), ['b1', 'b2']);
});

test('duplicates are rejected even when fit, source, or outer whitespace differs', () => {
  const req = request();
  const duplicate = { ...book(), fit: 'Another explanation', source_url: 'https://example.org/other' };
  assert.equal(validateRecord('book-response', response(req, [book(), duplicate])).valid, false);
  assert.equal(validateRecord('book-response', response(req, [book(), book(' Architecture in Practice ')])).valid, false);
  assert.equal(validateRecord('book-request', request({ excluded_books: [identity(book()), identity(book())] })).valid, false);
  const current = initial();
  current.books[1].id = current.books[0].id;
  assert.equal(validateRecord('accepted-books', current).valid, false);
});

test('unavailable status leaves state unchanged and forbids selected books', () => {
  const first = request();
  assert.equal(mergeBookResponse(first, unavailable(first)), null);
  const current = initial();
  const before = structuredClone(current);
  const req = replacement(current);
  assert.strictEqual(mergeBookResponse(req, unavailable(req), current), current);
  assert.deepEqual(current, before);
  assert.equal(validateRecord('book-response', { ...unavailable(req), books: [] }).valid, false);
  assert.equal(validateRecord('book-response', { ...unavailable(req), reason: ' ' }).valid, false);
  assert.equal(validateRecord('book-response', response(req, [book()], { reason: 'Unused reason' })).valid, false);
});

test('HTTP(S) URLs and nonblank evidence are required; extra training claims and IDs are rejected', () => {
  const req = request();
  for (const source_url of ['not a url', 'https://', 'https://@', 'https://:443', 'ftp://example.org/book', 'file:///book', 'https://example.org/bad url']) {
    assert.equal(validateRecord('book-response', response(req, [{ ...book(), source_url }])).valid, false, source_url);
  }
  for (const field of ['title', 'author', 'edition', 'locator', 'fit']) {
    assert.equal(validateRecord('book-response', response(req, [{ ...book(), [field]: ' ' }])).valid, false, field);
  }
  assert.equal(validateRecord('book-response', response(req, [{ ...book(), id: 'b1' }])).valid, false);
  assert.equal(validateRecord('book-response', response(req, [{ ...book(), training_set_membership: true }])).valid, false);
});

test('accepted collection must belong to the request role and cannot be overwritten by initial selection', () => {
  const current = initial();
  const req = replacement(current, { role: 'security' });
  assert.throws(() => mergeBookResponse(req, response(req), current), /collection role/);
  const first = request();
  assert.throws(() => mergeBookResponse(first, response(first), current), /cannot overwrite/);
});

test('rejected merges do not mutate request, response, or collection', () => {
  const current = initial();
  const req = replacement(current);
  const selected = response(req, [book('Reliability')]);
  const before = structuredClone({ req, selected, current });
  assert.throws(() => mergeBookResponse(req, selected, current), /Duplicate/);
  assert.deepEqual({ req, selected, current }, before);
});
