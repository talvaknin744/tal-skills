# Diagnostic output

A local command writes debug.json for developers to read. It serializes the same object {"healthy":true,"attempts":3} using JSON.stringify with an indentation argument of 2. The proposal changes that indentation argument to 4. Nothing parses the raw bytes for a signature or hash. The object, property names, order, and values stay the same. This task asks only about JSON whitespace, and there are no network consumers.
