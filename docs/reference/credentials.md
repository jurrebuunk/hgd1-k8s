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
| `config/cert-manager/cloudflare-dns-token.sops.yaml` | Cloudflare API token, DNS edit on `buunk.org`, for Let's Encrypt DNS-01; the same token as `nix-hgd1-cluster`'s `s3-acme-cloudflare.age` | Secret `cert-manager/cloudflare-dns-token` |
| `platform/keycloak-realm/client-cloudflare-zero-trust.sops.yaml` | Secret of the Keycloak client `cloudflare-zero-trust`; the same value is in Cloudflare's login method "buunk (Keycloak)" | Secret `keycloak/keycloak-client-cloudflare-zero-trust`, read by keycloak-config-cli |
| `platform/keycloak-realm/client-cloudreve.sops.yaml` | Secret of the Keycloak client `cloudreve` | Secret `keycloak/keycloak-client-cloudreve`, read by keycloak-config-cli |
| `hgd1-cloudreve`: `deploy/oidc.sops.yaml` | The same client secret, for Cloudreve | Secret `cloudreve/cloudreve-oidc` |
| `hgd1-cloudreve`: `deploy/s3-key.sops.yaml` | Key of S3 user `cloudreve` | Secret `cloudreve/cloudreve-s3` |
| `hgd1-cloudreve`: `deploy/system.sops.yaml` | Cloudreve's session secret and link salt | Secret `cloudreve/cloudreve-system` |

## Made by the cluster

| Credential | Where |
| --- | --- |
| Database passwords | Secret `<cluster>-app` per database (CloudNativePG) |
| People's accounts | Keycloak, `keycloak-db` |
| Cloudreve accounts | Cloudreve, `cloudreve-db`; people sign in through Keycloak, a local admin keeps a password |

## Keys

| Key | Where |
| --- | --- |
| Cluster age key | Secret `flux-system/sops-age`; backup `secrets/flux-sops-age.age` in `nix-hgd1-cluster` (admins only) |
| My age key | Derived from `~/.ssh/id_ed25519` with `ssh-to-age` |
