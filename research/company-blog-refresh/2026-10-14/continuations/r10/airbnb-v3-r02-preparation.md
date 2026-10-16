# Airbnb V3 r02 preparation, October 15, 2026

The separate candidate is frozen for offline review and has not launched. Actual V3 PID is null and activation is unobserved. Old r04, r05 and r06 candidates, raw evidence, reports and failed attempts remain preserved.

| Binding | SHA 256 |
| --- | --- |
| Airbnb candidate | `2fbf236792caff7111abc9e4f5369677945a22d6c3a9493f485880efd26b0233` |
| Exact 92 route queue | `dbd4b040201d4a3654d7c706e0a7165936cbffd72dae3f7f70162142e6bb9cdf` |
| Netflix r02 peer | `609cae8d479545e43ba84011684b3d7daab38a505e746f85235968bbb009c6a0` |
| Protocol JSON | `b4f094b4da414f8ef08d800f89a401b635cb5ac1e99db9c586eea49882e6188f` |
| Protocol prose | `da105e430eb76e5fe565bb74678107896b729e144080834ca97d049520fce18e` |
| Frozen preparation | `33f099e96b0d5f32e9c470ad852e0f638ba3c9a23e4ea8496813a425afed6437` |

The existing 51 guard outcomes pass. The unchanged 26 fault cases retain 24 passes and two changed boundary errors: the historical exception type and marker restoration guarantee differ from r02. Neither old case was weakened. Eight new focused cleanup cases pass, including real file and directory fsync ordering, precleanup failures, typed verified cleanup with actual marker presence, the same owner latch, local replacement review and real contention with the exact r02 peer source. All preparation HTTP counts are zero. Independent Airbnb review remains outstanding.

The shared protocol is `medium-shared-request-v3-r02`. Exact gate paths, fixed ordinary headers, 60 second start spacing and at most one request in flight are retained. A durable unfinished request marker precedes GET. Known denials are classified and stopped under the held request lock before object persistence. Exact response, ledger, FULL synchronous SQLite receipt, marker object and completion event are verified and durable before marker unlink. Any earlier failure remains unconfirmed. Foreign or inherited markers and circuits are never automatically cleared.

Only marker unlink or later phase sync errors receive `verified_completion_cleanup_uncertain`. That response is already confirmed, actual marker presence is recorded and the same process stops. If unlink occurred and circuit publication also failed, both shared controls can be absent. The exact peer contention case confirms that another owner can then proceed at the next slot from durable verified completion. This is an explicit shared cleanup limit, not an unknown response escape or a global fail closed guarantee. A replacement local owner requires coordinator review of retained cleanup evidence.

The queue still contains 69 October 1 HTTP 429 routes, 22 earlier metadata only HTTP 200 routes and one route with no retained request. Old verification bodies and Retry After or request headers remain unavailable. Four successful responses stay cached. No source expansion, username inference, automatic retries or redirects, arbitrary successful feed cap, new namespace or identity workaround is included. Bulk capture claims zero deliberate reading, and historical pagination and lifetime completeness remain unresolved.

The following command is recorded only. Root review and explicit network authorization are still required:

```sh
python3 /tmp/tal-skills-blog-crawl-resume-2026-10-15-r10/airbnb/collect_airbnb.py --run --queue-sha256 dbd4b040201d4a3654d7c706e0a7165936cbffd72dae3f7f70162142e6bb9cdf --historical-429-review-sha256 dbd4b040201d4a3654d7c706e0a7165936cbffd72dae3f7f70162142e6bb9cdf --method-sha256 2fbf236792caff7111abc9e4f5369677945a22d6c3a9493f485880efd26b0233
```
