const commitParser = require("./commitParser");

function isSemanticMessage(message, validScopes) {
  const isMergeCommit = message && message.startsWith("Merge");

  if (isMergeCommit) return true;

  const { error, value: commits } = commitParser(message, true);

  if (error) {
    process.env.NODE_ENV !== "test" && console.error(error);

    return false;
  }

  const [result] = commits;
  const { scope } = result;
  const isScopeValid = !validScopes || validScopes.includes(scope);

  return isScopeValid;
}

module.exports = isSemanticMessage;
