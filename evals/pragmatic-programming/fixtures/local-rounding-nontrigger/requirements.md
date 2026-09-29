# Total rounding

The helper should round the final order total to two decimal places. It currently
rounds each line before summing. For [0.334, 0.334, 0.334], the expected result is
1.00 and the current result is 0.99. Keep the established use of Python's round.
Only explain the smallest correction; broader design and numeric-type changes
are outside this request. Leave the fixture files unchanged.
