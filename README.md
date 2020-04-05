# semantic-pr-checker

> A GitHub App built with [Probot](https://github.com/probot/probot) that Set semantic rules for your PR and verify they are enforced

## How it works

👮 Note! The default behavior of this bot is to police all commit messages,
to ensure that every PR has **just enough semantic information** to be 
able to trigger a release when appropriate. The goal is to gather this semantic
information in a way that doesn't make life harder for project contributors, 
especially newcomers who may not know how to amend their git commit history.

By default, only the PR title OR at least one 
commit messsage needs to have semantic prefix. If you wish to change this 
behavior, see [configuration](#configuration) section below.

| Scenario                                         | Status | Status Check Message                |
| ------------------------------------------------ | ------ | ----------------------------------- |
| PR title is [semantic][conventional commit type] | 💚     | `ready to be squashed`              |
| any commit is semantic                           | 💚     | `ready to be merged or rebased`     |
| nothing is semantic                              | 💛     | `add a semantic commit or PR title` |


## Installation

👉 [github.com/apps/semantic-pull-requests](https://github.com/apps/semantic-pull-requests)

## Configuration

By default, no configuration is necessary.

If you wish to override some 
behaviors, you can add a `semantic.yml` file to your `.github` directory with 
the following optional settings:

```yml
# Sets if the checker evaluates the PR Title, all commits or both
# valid values are COMMITS, TITLES, ALL. It defaults to ALL
checkTarget: ALL
```

```yml
# Set the structure of the commit, the default structure is `<scope> <subject> <type>
# the order of the values is important
commitStructure: ["scope", "subject", "type"]
```

```yml
# Set the validation and matching regex for your checker. It works in pair with the commit structure
# the default regex matches the follosing structure `<scope: all uppercase>-123: <subject: capitalized> [<type>]`
validationRegex: !!js/regexp '/^([A-Z]+-?[0-9]*): ([A-Z]{1}.+[\w]{1})(\s\[[\w]+\])?$/'
```

```yml
# You can define a list of valid scopes
scopes:
  - scope1
  - scope2
  ...
```

```yml
# By default no types are used but we recommend the ones specified in 
# commitizen/conventional-commit-types is used.
# See: https://github.com/commitizen/conventional-commit-types/blob/v2.3.0/index.json
types:
  - feat
  - fix
  - improvement
  - docs
  - style
  - refactor
  - perf
  - test
  - build
  - ci
  - chore
  - revert
```

## Contributing

If you have suggestions for how semantic-pr-checker could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[ISC](LICENSE) © 2020 Daniel Castrillo <littlecastrum@gmail.com>
