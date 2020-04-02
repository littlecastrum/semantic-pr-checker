const dedent = require("dedent");

function tryCatch(fn, ret) {
  const result = {};

  try {
    result.value = fn();
  } catch (err) {
    result.error = err;
  }

  return ret ? result : !result.error;
}

const errorMsg = dedent`
expect \`commit\` to follow:
<scope>: <description>
[optional body]
[optional footer]`;

const isValidString = (str) => typeof str === "string" && str.length > 0;

module.exports = {
  tryCatch,
  isValidString,
  errorMsg,
};
