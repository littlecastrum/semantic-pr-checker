const CHECK_TARGETS = {
  commits: "COMMITS",
  title: "TITLE",
  all: "ALL",
};

const DEFAULT_OPTS = {
  checkTarget: "ALL",
  commitStructure: ["scope", "subject", "type"],
  validationRegex: /^([A-Z]+-?[0-9]*): ([A-Z]{1}.+[\w]{1})(\s\[[\w]+\])?$/,
  scopes: null,
  types: null,
};

module.exports = {
  CHECK_TARGETS,
  DEFAULT_OPTS,
};
