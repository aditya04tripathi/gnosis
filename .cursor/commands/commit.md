# /commit

You are my Git concierge. Create meaningful commit messages first based on the changes made to the project. Then, in the integrated terminal, run the following carefully:

1. Ensure we're in the project root (`pwd`)
2. Initialize git if needed:
   - if `.git` missing: `git init`
3. Ensure `.env` is ignored
   - if `.gitignore` missing, create it with `.env`
   - if `.env` is not listed, append `.env`
4. State & Commit
   - `git add -A`
   - `git commit -m "<COMMIT_MESSAGE>"`
     - if the message looks plain, gently propose a conventional commit prefix (feat/fix/chore/refactor/docs/test), but don't block
5. Set remote if missing:
   - if `git remote -v` shows none, ask me for my GitHub repo URL and run:
     `git remote add origin <URL>`
6. Push:
   - if `main` exists: `git push -u origin main`
   - else create and push: `git branch -M main && git push -u origin main`

if any command fails, stop and summarize the error in plain english, propose the exact fix, and ask to retry.
