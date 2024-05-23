# GitHub Backup Action

This GitHub repository contains an action that allows you to backup/export a GitHub project given its URL to a JSON asset. The backup process can be triggered using GitHub Actions.

## Usage

To use this backup action, follow these steps:

1. Create a new workflow file in your project's `.github/workflows` directory, e.g., `.github/workflows/backup-workflow.yml`.
2. Add the following content to the workflow file:

```yaml
name: Backup Project

on:
  push:
    branches:
      - main

jobs:
  backup:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v2

      - name: Backup Project
        uses: your-username/github-backup-action@v1
        with:
          project-url: ${{ secrets.PROJECT_URL }}
          output-file: backup.json

      - name: Upload Backup
        uses: actions/upload-artifact@v2
        with:
          name: backup
          path: backup.json
```

3. Replace `your-username` with your GitHub username in the `uses` field of the `Backup Project` step.
4. Create a secret named `PROJECT_URL` in your repository's settings and set its value to the URL of the GitHub project you want to backup.
5. Commit and push the workflow file to your repository.

The backup workflow will now be triggered whenever there is a push to the `main` branch. It will checkout the repository, run the backup action, and upload the backup JSON file as an artifact.

## Action Details

The backup action is implemented in the `action/index.js` file. It exports a function `backupProject` that takes the GitHub project URL as input and performs the backup/export process. The backup is saved to the specified output file.

The action requires the following dependencies, which are listed in the `action/package.json` file:

- `axios`: A library for making HTTP requests.
- `fs-extra`: A library for working with the file system.

## Tests

The `tests/backup.test.js` file contains tests for the backup action. These tests ensure that the backup process works correctly and that the exported JSON file is valid.

## License

This project is licensed under the MIT License. See the `LICENSE` file for more information.

## Contributing

Contributions are welcome! If you have any suggestions, bug reports, or feature requests, please open an issue or submit a pull request.

## Contact

If you have any questions or need further assistance, feel free to contact the project maintainer at your-email@example.com.

This README file provides an overview of the project and instructions on how to use the backup action. For more detailed documentation, please refer to the code comments and the source code itself.