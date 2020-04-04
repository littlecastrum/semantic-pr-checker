const { EOL } = require("os");
const { dedent } = require("./utils");

const errorMsg = dedent`
	expect \`commit\` to follow:
	<scope>: <description>
	[optional body]
	[optional footer]
`;

function parse(commit, regex) {
  if (typeof commit !== "string" || commit.length === 0) {
    throw new TypeError(`expect \`commit\` to be non empty string`);
  }
  const [header] = commit.split(EOL);

  if (!regex.test(header)) {
    throw new TypeError(errorMsg);
  }

  return regex.exec(header).slice(1);
}

const validate = (commit, regex) => {
  const result = {};

  try {
    result.value = parse(commit, regex);
  } catch (err) {
    result.error = err;
  }

  return result;
};

module.exports = validate;
