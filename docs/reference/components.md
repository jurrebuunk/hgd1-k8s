---
icon: lucide/boxes
---

# Components

Everything this repo runs, with its exact version. Versions are pinned in
the files listed; update one at a time.

| Component | Version | Namespace | File | Why |
| --- | --- | --- | --- | --- |
| Flux | from `flux bootstrap` | `flux-system` | `clusters/hgd1/flux-system/` | [GitOps](../concepts/gitops.md) |
| metrics-server | chart 3.14.0 (v0.9.0) | `kube-system` | `infrastructure/metrics-server/` | `kubectl top`, autoscaling |
| local-path-provisioner | 3.13.3 | `local-path-storage` | `infrastructure/local-path/` | StorageClass `local-path` on each node's NVMe |
| cloudflared | 2026.10.7 | `cloudflared` | `infrastructure/cloudflared/` | [Public access](../concepts/public-access.md) |
| cert-manager | v1.21.3 | `cert-manager` | `infrastructure/cert-manager/` | Certificates for the Postgres backup plugin |
| CloudNativePG | chart 0.29.1 (operator 1.30.1) | `cnpg-system` | `infrastructure/cloudnative-pg/` | [Postgres](../concepts/postgres.md) |
| Barman Cloud plugin | chart 0.9.0 (plugin 0.16.0) | `cnpg-system` | `infrastructure/cloudnative-pg/` | Postgres backups to S3 |
| vmagent | chart 0.51.0 | `monitoring` | `infrastructure/monitoring/` | [Monitoring](../concepts/monitoring.md) |
| kube-state-metrics | chart 9.0.0 | `monitoring` | `infrastructure/monitoring/` | Object state metrics |
| Vector | chart 0.61.0 | `monitoring` | `infrastructure/monitoring/` | Pod logs |
| Keycloak operator | 26.8.2 | `keycloak` | `infrastructure/keycloak-operator/` | [Keycloak](../concepts/keycloak.md) |
| keycloak-config-cli | 6.5.1-26 | `keycloak` | `platform/keycloak-realm/job.yaml` | Applies the realms |

**Network policies** (what pods may connect to) are in the same folders as
each component (`networkpolicy.yaml`, and `components/egress` through each
folder's `kustomization.yaml`); Flux's own are patched in
`clusters/hgd1/flux-system/kustomization.yaml`.

Not here on purpose: Traefik and ServiceLB (disabled in k3s; public apps use
the tunnel), ceph-csi (no Ceph block storage for pods). CoreDNS comes with
k3s from `nix-hgd1-cluster`.
