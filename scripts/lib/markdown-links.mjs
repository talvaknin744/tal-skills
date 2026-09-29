// Code samples can contain link-shaped expressions such as Go's [i](ctx).
// Only prose links are installed-resource dependencies.
export function markdownTargets(markdown) {
  const prose = [];
  let fence;
  for (const line of markdown.split(/\r?\n/)) {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (fence) {
      if (marker && marker[1][0] === fence.character
          && marker[1].length >= fence.length && !marker[2].trim()) fence = undefined;
      continue;
    }
    if (marker && (marker[1][0] !== '`' || !marker[2].includes('`'))) {
      fence = { character: marker[1][0], length: marker[1].length };
      continue;
    }
    prose.push(line);
  }
  return [...prose.join('\n').matchAll(/!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)]
    .map(match => match[1]);
}
