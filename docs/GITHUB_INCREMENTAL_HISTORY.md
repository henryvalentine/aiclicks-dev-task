# GitHub repository setup and incremental commit history

The goal is a readable, truthful history, not a manufactured one. Several focused commits made during the implementation are reasonable; do not backdate commits or claim work occurred on dates when it did not.

## 1. Create an empty public repository

1. Sign in to GitHub and open <https://github.com/new>.
2. Repository name: `aiclicks-dev-task` (or another available name).
3. Description: `Full-stack AI brand mentions dashboard using Next.js, FastAPI and SQLite`.
4. Select **Public** because the exercise asks for a public repository.
5. Leave **Add a README**, `.gitignore` and license unchecked so the local project can be pushed without an initial merge conflict.
6. Click **Create repository** and copy the HTTPS URL, such as `https://github.com/YOUR_USERNAME/aiclicks-dev-task.git`.

Official GitHub guide: <https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github>.

## 2. Prepare the local working directory

Extract the final `aiclicks-dev-task` ZIP to a folder. Open a terminal in that directory and configure Git identity if needed:

```bash
git config --global user.name "Your Name"
git config --global user.email "YOUR_VERIFIED_GITHUB_EMAIL"
```

Never commit `.env` files, credentials, the generated SQLite file, `node_modules`, or build output. The existing `.gitignore` excludes these.

## 3. Commit 1: capture the supplied scaffold

If you are starting from the original scaffold and want the initial task files captured separately, use the original source in a separate working folder and initialize it first:

```bash
git init -b main
git add .gitignore README.md backend frontend seed_data.sql
git commit -m "Add supplied full-stack task scaffold"
```

Copy the finished implementation into this worktree before the next steps. Alternatively, if you are publishing the final ZIP as a new project with no source control history, initialize once and use the remaining meaningful commits; do not pretend the earlier stages happened on different dates.

## 4. Commit backend implementation

Stage the SQLite API, models, seed script, tests and dependency changes:

```bash
git add backend seed_data.sql
git diff --cached --check
git diff --cached --stat
git commit -m "Implement SQLite-backed mentions API"
```

The app deliberately seeds from the provided `seed_data.sql`; don't substitute a converted PostgreSQL dataset for this task.

## 5. Commit dashboard work

If frontend work is not already included in the prior snapshot, stage and commit it:

```bash
git add frontend
git diff --cached --check
git commit -m "Build responsive mentions dashboard and trend chart"
```

Run `npm ci` and `npm run build` first if the Node.js dependencies are available. If the build fails, make and commit the fix separately rather than claiming that the build passed.

## 6. Commit notes and deployment guidance

```bash
git add README.md NOTES.md .gitignore docs deploy
 git diff --cached --check
git commit -m "Document trade-offs and OCI deployment"
```

The notes explicitly state that SQLite is retained to meet the exercise specification and that PostgreSQL with persistent storage and tested backups is a possible future improvement for a longer-lived service.

## 7. Review and push

```bash
git status
git log --oneline --decorate --graph -10
git diff --check
git remote add origin https://github.com/YOUR_USERNAME/aiclicks-dev-task.git
git push -u origin main
```

If `origin` already exists, inspect it with `git remote -v` instead of adding it again. Authenticate using GitHub's browser/credential-manager flow; never put an access token in source files.

Open the repository page and confirm the source and commit history are visible. Share the live URL only after the deployed application passes smoke tests.
