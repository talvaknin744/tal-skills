# Release proposal

Set revision 8 as the Deployment image and replace A, B, then C. A worker is
drained when readiness is false; the PDB and 85-second handler wait cover its
exports. Keep the receive loop unchanged.

Increase the business failure limit from three to six for the rollout. A failed
checkpoint RPC has not committed, so the replacement restarts its previous
batch. The new-job smoke test proves compatibility; either revision can be used
for rollback. Release the version-2 input/layout dependencies when three new
pods are Ready, then declare all accepted jobs preserved.
