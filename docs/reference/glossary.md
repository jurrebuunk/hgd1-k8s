---
icon: lucide/book-a
---

# Glossary

| Term | Meaning |
| --- | --- |
| **Flux** | Runs in the cluster, pulls Git and applies it ([GitOps](../concepts/gitops.md)) |
| **Kustomization (Flux)** | One folder of a repo that Flux applies, with an order and health checks |
| **kustomize** | Builds Kubernetes YAML from a folder (`kustomization.yaml`), with components and generators |
| **Component (kustomize)** | A reusable piece an app includes, such as `components/postgres` |
| **HelmRelease** | A Helm chart installed by Flux, version pinned |
| **sops / age** | Encrypts the values in YAML files; age is the key type ([Manage secrets](../how-to/manage-secrets.md)) |
| **CloudNativePG (CNPG)** | The operator that runs each app's Postgres ([Postgres](../concepts/postgres.md)) |
| **WAL** | Postgres's write-ahead log; shipped to S3 continuously for backups |
| **Cloudflare Tunnel** | An outbound connection that lets Cloudflare reach a Service ([Public access](../concepts/public-access.md)) |
| **Route** | "hostname (and path) → Service" in the tunnel's config |
| **OIDC** | OpenID Connect, the login protocol apps use with Keycloak |
| **Realm** | Keycloak's space of users, groups and app clients; `hgd1` for people, `master` for admins |
| **Zone** | `topology.kubernetes.io/zone`: the physical host a node runs on |
| **local-path** | StorageClass on a node's own NVMe; data stays on that node |

Cluster terms (VIP, OSD, RGW, VLAN, …): the
[cluster glossary](https://jurrebuunk.github.io/nix-hgd1-cluster/reference/glossary/).
