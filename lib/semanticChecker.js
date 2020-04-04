const commitParser = require("./commitParser");

const semanticChecker = (config) => (message, validScopes, validTypes) => {
  if (message && message.startsWith("Merge")) return true;

  const { commitStructure, validationRegex } = config;

  const { error, value } = commitParser(message, validationRegex);

  if (error) {
    process.env.NODE_ENV !== "test" && console.error(error);

    return false;
  }

  const { scope, type } = value.reduce(
    (acc, val, idx) => ({
      ...acc,
      [commitStructure[idx]]: val,
    }),
    {}
  );

  const isScopeValid =
    !validScopes || validScopes.some((vs) => scope.includes(vs));

  const isTypeValid =
    !type || !validTypes || validTypes.some((vt) => type.includes(vt));

  return isScopeValid && isTypeValid;
};

module.exports = semanticChecker;
