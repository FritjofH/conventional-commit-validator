# conventional-commit-validator

This GitHub Action ensures that either all commit messages or the pull request title adhere to the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) standard, and by extension our own set of types. It labels the PR accordingly with the types as well as scopes used.

## Features

- **Validation**: Checks that either all commit messages or the PR title follow the Conventional Commits standard.
- **Labeling**: Automatically adds labels to the PR based on commit types and scopes.

## Inputs

| Name               | Description                                                      | Required | Default                                             |
|--------------------|------------------------------------------------------------------|----------|-----------------------------------------------------|
| `GITHUB_TOKEN`     | GitHub token to access API.                                      | Yes      | N/A                                                 |
| `task_types`       | Comma-separated list of allowed commit types.                    | No       | `feat,fix,docs,test,ci,refactor,perf,chore,revert,build,style` |
| `add_label`        | Whether to add commit type labels to the PR.                     | No       | `true`                                              |
| `add_scope_label`  | Whether to add scope-based labels.                               | No       | `true`                                              |

## Usage

To utilize this action in your workflow, add the following job to your `.github/workflows/` YAML file:

```yaml
jobs:
  validate-commits-or-pr-title:
    runs-on: ubuntu-latest
    steps:
      - uses: FritjofH/conventional-commit-validator@main
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Building the Action

This action is built using Node.js. Before committing changes, ensure you compile the source code:

1. **Install Dependencies**:

   ```bash
   npm install
   ```

2. **Build**:

   ```bash
   npm run build
   ```


This compiles the source code into a single file located in the `dist` directory, ensuring all dependencies are bundled.