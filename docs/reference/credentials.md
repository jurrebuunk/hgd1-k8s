---
icon: lucide/lock-keyhole
---

# Credentials

Where every secret of the cluster's platform and apps lives. This page never
holds a value, only its location. How to add or rotate them:
[Manage secrets](../how-to/manage-secrets.md).

!!! cluster "On the cluster docs: credentials"

    agenix secrets on the hosts, keys on the laptop, the kubeconfig and the
    password manager.

    [Credentials](https://jurrebuunk.github.io/nix-hgd1-cluster/reference/credentials/){ .md-button }

## Encrypted in Git (sops)

| File | Holds | In the cluster as |
| --- | --- | --- |
| `infrastructure/cloudflared/credentials.sops.yaml` | Tunnel `hgd1-apps` credentials | Secret `cloudflared/cloudflared-credentials` |
| `components/postgres/backup-s3.sops.yaml` | Key of S3 user `pg-backups` | Secret `pg-backup-s3` in each app namespace |
| `platform/keycloak/bootstrap-admin.sops.yaml` | `temp-admin`'s first password | Secret `keycloak/keycloak-bootstrap-admin` |
| `platform/keycloak/bootstrap-service.sops.yaml` | keycloak-config-cli's login | Secret in `keycloak` |
| `hgd1-cloudreve`: `deploy/s3-key.sops.yaml` | Key of S3 user `cloudreve` | Secret `cloudreve/cloudreve-s3` |
| `hgd1-cloudreve`: `deploy/system.sops.yaml` | Cloudreve's session secret and link salt | Secret `cloudreve/cloudreve-system` |

## Made by the cluster

| Credential | Where |
| --- | --- |
| Database passwords | Secret `<cluster>-app` per database (CloudNativePG) |
| People's accounts | Keycloak, `keycloak-db` |
| Cloudreve accounts | Cloudreve, `cloudreve-db` |

## Keys

| Key | Where |
| --- | --- |
| Cluster age key | Secret `flux-system/sops-age`; backup `secrets/flux-sops-age.age` in `nix-hgd1-cluster` (admins only) |
| My age key | Derived from `~/.ssh/id_ed25519` with `ssh-to-age` |
