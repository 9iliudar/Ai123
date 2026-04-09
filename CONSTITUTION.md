# Project Constitution

## Deployment Constitution

This project must use a single production deployment path:

- Source of truth: `GitHub`
- Deployment trigger: push to `main`
- Deployment platform: `Vercel`
- Required workflow: `GitHub -> Vercel automatic deployment`

The following rules are mandatory for any future model, agent, or contributor working on this repository:

1. Do not use `vercel --prod` or any other direct local-to-Vercel production deployment flow as the normal release process.
2. Do not treat a local working directory as a production release source.
3. Any production update must be represented by committed code in Git history and pushed to `origin/main`.
4. Vercel production must be updated by its Git integration after GitHub receives the new commit.
5. If a direct Vercel deployment is ever used for emergency recovery, it must be treated as an exception, documented immediately, and the repository must be brought back to Git-driven deployment as the canonical flow.

## Operational Intent

- Keep release history auditable.
- Ensure the deployed site always maps back to a Git commit.
- Avoid mixed deployment paths that make rollback and debugging harder.
