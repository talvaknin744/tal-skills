# Batch numeric optimization
Profiles on representative input attribute 75% of process CPU to scanning price and size fields of object records. Each batch contains 1 million observations and numeric aggregate results must match an independent reference within the agreed floating-point tolerance. Prices use float64; sizes are nonnegative integers and their supported range must be retained.
The draft converts every request with np.ascontiguousarray(..., dtype=np.int32), then calls this Cython function compiled with boundscheck=False and wraparound=False:

def total(double[::1] price, int[::1] size):
    cdef Py_ssize_t i, n = price.shape[0]
    cdef double result = 0
    with nogil:
        for i in range(n):
            result += price[i] * size[i]
    return result

One supported caller currently provides three prices and two sizes. Another supplies integer sizes larger than signed 32-bit range. The arrays may be views sharing a buffer with a concurrent ingestion worker. The proposal calls contiguous input thread-safe and assumes nogil proves parallel speedup. The deployed CPython build, NumPy version and BLAS thread count have not been recorded.
A linter proposal warns on every record-shaped container, adjacent atomic field, and modulo index, without profile, writer ownership, generated-code or target-layout evidence. No benchmark or correctness check has run for the draft.
