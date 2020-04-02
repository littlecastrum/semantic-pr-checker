const { EOL } = require("os");
const { tryCatch, isValidString, errorMsg } = require("./utils");

function parse(commit) {
  if (!isValidString(commit)) {
    throw new TypeError(`expect \`commit\` to be non empty string`);
  }
  const [header] = commit.split(EOL);

  const regex = /^(\w+): (.+)$/i;

  if (!regex.test(header)) {
    throw new TypeError(errorMsg);
  }

  const [, scope, subject] = regex.exec(header).slice(1);

  return { scope, subject };
}

function check(commits, flat) {
  const result = []
    .concat(commits)
    .filter((x) => x !== null || x !== undefined)
    .reduce((acc, commit) => {
      const parsedCommit = parse(commit);

      return acc.concat(parsedCommit);
    }, []);

  return flat === true && result.length === 1 ? result[0] : result;
}

const validate = (commits, ret) => tryCatch(() => check(commits), ret);

module.exports = validate;
