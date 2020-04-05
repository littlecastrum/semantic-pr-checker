function dedent(strings) {
  const raw = typeof strings === "string" ? [strings] : strings.raw;

  let result = raw.reduce((acc, char, idx) => {
    const argsLen = arguments.length;

    acc += char.replace(/\\\n[ \t]*/g, "").replace(/\\`/g, "`");
    if (idx < (argsLen <= 1 ? 0 : argsLen - 1)) {
      acc += argsLen <= idx + 1 ? undefined : arguments[idx + 1];
    }

    return acc;
  }, "");

  const lines = result.split("\n");

  let mindent = null;

  lines.forEach(function (l) {
    const m = l.match(/^(\s+)\S+/);

    if (m) {
      const indent = m[1].length;

      if (!mindent) {
        mindent = indent;
      } else {
        mindent = Math.min(mindent, indent);
      }
    }
  });

  if (mindent !== null) {
    (() => {
      const m = mindent;
      const whitespaceCharacters = [" ", "\t"];

      result = lines
        .map((line) => {
          return whitespaceCharacters.includes(line[0]) ? line.slice(m) : line;
        })
        .join("\n");
    })();
  }

  return result.trim().replace(/\\n/g, "\n");
}

module.exports = {
  dedent,
};
