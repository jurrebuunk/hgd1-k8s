---
icon: lucide/folder-git-2
---

# Tour of the repo

`hgd1-k8s` holds the platform every app uses; each app has its own repo.

```text
clusters/hgd1/          entry point: Flux itself and one Kustomization per layer
  flux-system/            written by flux bootstrap
  infrastructure.yaml     → ./infrastructure
  config.yaml             → ./config            (after infrastructure)
  platform.yaml           → ./platform          (after config)
  keycloak-realm.yaml     → ./platform/keycloak-realm (after platform)
  apps.yaml               → ./apps              (after platform)
infrastructure/         controllers and operators, one folder each
  metrics-server/ local-path/ cloudflared/ cert-manager/
  cloudnative-pg/ monitoring/ keycloak-operator/
config/                 what needs their CRDs
platform/               shared services: keycloak/ and keycloak-realm/
components/             pieces apps include: postgres/
apps/                   one pointer file per app repo, nothing else
docs/                   these docs
.sops.yaml              which files are encrypted, for which age keys
PLAN.md                 how it was built, step by step
```

## Conventions

- **One folder per component** in `infrastructure/`, with a `HelmRepository`
  and `HelmRelease`, or the upstream manifests; versions pinned exactly.
- **Secrets** are `*.sops.yaml` files next to what uses them
  ([Manage secrets](../how-to/manage-secrets.md)).
- **No people in Git**: accounts are made in Keycloak.
- **Apps never live here.** An app has its own repo with a `deploy/` folder;
  `apps/` gets one pointer file ([GitOps](../concepts/gitops.md#one-repo-per-app)).
- **Deferred work** becomes a GitHub issue on this repo.
- Commit messages say what changed and why; one change per commit.

## App repos

| Repo | What |
| --- | --- |
| [`hgd1-cloudreve`](https://github.com/jurrebuunk/hgd1-cloudreve) | Cloudreve: Deployment, database, bucket gateway, secrets |
