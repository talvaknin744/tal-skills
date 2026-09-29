# Local label correction

A Python command-line tool prints this message after counting selected files:

```python
print(f"File count: {count}")
```

The requested wording is `Files selected: {count}`. The interpolation expression
stays unchanged. No program parses this output. There is only one supported
English label, no planned localization or alternate renderer, and no object
construction, state transition, or interface redesign in the request.

This note is a review artifact; leave it unchanged.
