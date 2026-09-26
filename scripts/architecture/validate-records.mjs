#!/usr/bin/env node
// Optional maintainer tooling. The skill does not require Node or these packages.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

export const contractNames = Object.freeze(['book-request', 'book-response', 'accepted-books']);
// Conditional required rules refer to properties declared on the outer object.
const ajv = new Ajv({ allErrors: true, strict: true, strictRequired: false });
addFormats(ajv);
const validators = new Map(contractNames.map((name) => {
  const url = new URL(`../../skills/engineering/architecture/references/contracts/${name}.schema.json`, import.meta.url);
  return [name, ajv.compile(JSON.parse(readFileSync(url, 'utf8')))];
}));

// Compare the exact edition tuple, ignoring outer whitespace only. Do not infer
// equivalence between differently named titles, authors, or editions.
function identityKey(book) {
  return JSON.stringify([book.title.trim(), book.author.trim(), book.edition.trim()]);
}

function duplicateErrors(items, key, label) {
  const seen = new Set();
  const errors = [];
  for (const item of items) {
    const value = key(item);
    if (seen.has(value)) errors.push(`Duplicate ${label}: ${value}`);
    seen.add(value);
  }
  return errors;
}

/** Check schema shape and within-record uniqueness; never fetch external URLs. */
export function validateRecord(contractName, record) {
  const validate = validators.get(contractName);
  if (!validate) throw new Error(`Unknown contract: ${contractName}`);
  if (!validate(record)) {
    return {
      valid: false,
      errors: validate.errors.map(({ instancePath, message }) => `${instancePath || '/'} ${message}`),
    };
  }
  const books = contractName === 'book-request' ? record.excluded_books : (record.books ?? []);
  const errors = duplicateErrors(books, identityKey, 'book identity');
  if (contractName !== 'book-request') {
    for (const book of books) {
      try {
        const url = new URL(book.source_url);
        if (!url.hostname || !['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid source URL');
      } catch {
        errors.push(`Invalid HTTP(S) source URL: ${book.source_url}`);
      }
    }
  }
  if (contractName === 'accepted-books') errors.push(...duplicateErrors(books, (book) => book.id, 'book id'));
  return { valid: errors.length === 0, errors };
}

export function assertValidRecord(contractName, record) {
  const result = validateRecord(contractName, record);
  if (!result.valid) throw new Error(`Invalid ${contractName}: ${result.errors.join('; ')}`);
  return record;
}

/**
 * Apply a verified selection to this assignment's collection without mutation.
 * The caller verifies source availability/support before applying selected books,
 * and retains cumulative exclusions across requests. An unavailable response
 * returns current unchanged (null before initial acceptance); it does not resolve
 * a rejected book that remains in the collection. Inspect response.status.
 */
export function mergeBookResponse(request, response, current = null) {
  assertValidRecord('book-request', request);
  assertValidRecord('book-response', response);
  for (const field of ['request_id', 'role', 'request_kind']) {
    if (response[field] !== request[field]) throw new Error(`Response ${field} does not match request`);
  }
  if (current !== null) {
    assertValidRecord('accepted-books', current);
    if (current.role !== request.role) throw new Error('Accepted collection role does not match request');
  }

  let targetIndex = -1;
  const exclusions = new Set(request.excluded_books.map(identityKey));
  if (request.request_kind === 'replacement') {
    if (current === null) throw new Error('Replacement requires an accepted collection');
    targetIndex = current.books.findIndex((book) => book.id === request.replaced_book_id);
    if (targetIndex === -1) throw new Error('Replacement target is not an accepted book id');
    if (!exclusions.has(identityKey(current.books[targetIndex]))) {
      throw new Error('Replacement must exclude the rejected target edition');
    }
  } else if (current !== null) {
    throw new Error('Initial request cannot overwrite an accepted collection');
  }

  if (response.status === 'unavailable') return current;
  for (const book of response.books) {
    if (exclusions.has(identityKey(book))) throw new Error('Selected book is an excluded edition');
  }

  let accepted;
  if (request.request_kind === 'initial') {
    accepted = {
      record_type: 'accepted_books',
      role: request.role,
      books: response.books.map((book, index) => ({ id: `b${index + 1}`, ...structuredClone(book) })),
    };
  } else {
    accepted = structuredClone(current);
    accepted.books[targetIndex] = { id: request.replaced_book_id, ...structuredClone(response.books[0]) };
  }
  // Also rejects a replacement that duplicates an unaffected book's identity.
  assertValidRecord('accepted-books', accepted);
  return accepted;
}

function main(args) {
  if (args.length !== 2 || !contractNames.includes(args[0])) {
    throw new Error(`Usage: node scripts/architecture/validate-records.mjs <${contractNames.join('|')}> <record.json>`);
  }
  const [name, file] = args;
  assertValidRecord(name, JSON.parse(readFileSync(file, 'utf8')));
  console.log(`${name}: valid (shape and uniqueness; sources not verified)`);
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
