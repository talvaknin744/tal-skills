Fix this TypeScript export service so it honors the stream lifetime and flow-control
contract in `contract.md`. The current implementation can finish its returned
promise while the destination is still working, and cancellation or stream errors
can leave owned work running.

Keep the `exportRecords` interface. Modify `export.ts` and add `test_export.mjs` if
useful; treat `contract.md` and `verify.mjs` as supplied acceptance inputs. Run
`node verify.mjs` on the installed Node runtime. This is a local standard-library
task: no network, package installation, service deployment or remote account is
needed. Report the final checks, candidate changes and focused review result.
