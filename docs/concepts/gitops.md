---
icon: lucide/git-branch
---

# GitOps

Everything on the cluster comes from Git. **Flux** runs inside k3s, pulls
this repo and the app repos, and makes the cluster match them; a change is a
commit, a rollback is a revert.

!!! info "At a glance"

    **Status** <span class="status">Done</span> · **Entry point**
    `clusters/hgd1/` · **Secrets** sops with age ([Manage secrets](../how-to/manage-secrets.md))
    · **Check** `flux get kustomizations`

## What runs where

What has to exist before Kubernetes works, or keep working when it's broken,
comes from Nix; what runs as pods comes from Git through Flux.

| From `nix-hgd1-cluster` (Nix) | From this repo (Flux) | From app repos (Flux) |
| --- | --- | --- |
| Hosts, network, Ceph, the S3 endpoint, host monitoring, `clusterd`/`labctl`, the VMs, k3s with flannel and CoreDNS | Flux, sops, metrics-server, local-path, `cloudflared`, cert-manager, CloudNativePG, k3s monitoring, Keycloak | Cloudreve, later `lab-console` and other apps |

!!! cluster "On the cluster docs: the cluster under this"

    The k3s VMs, zones, the kubeconfig, and the S3 endpoint and monitoring
    stores these components use.

    [k3s](https://jurrebuunk.github.io/nix-hgd1-cluster/concepts/k3s/){ .md-button }

## Layers

Flux applies the repo in layers; each waits until the one before is ready,
so an operator's CRDs exist before anything uses them.

| Layer | Folder | What |
| --- | --- | --- |
| `infrastructure` | `infrastructure/` | Controllers and operators, one folder each: metrics-server, local-path, cloudflared, cert-manager, CloudNativePG, monitoring, the Keycloak operator |
| `config` | `config/` | What needs their CRDs |
| `platform` | `platform/` | Shared services: Keycloak and its database |
| `keycloak-realm` | `platform/keycloak-realm/` | The realms, applied by keycloak-config-cli |
| `apps` | `apps/` | One pointer file per app, nothing else |

`components/` holds reusable pieces that apps include, such as
`components/postgres` ([Postgres](postgres.md)).

## What runs here

| Component | Version | Why |
| --- | --- | --- |
| metrics-server | chart 3.14.0 | `kubectl top`, autoscaling |
| local-path-provisioner | 3.13.3 | StorageClass `local-path` on each node's NVMe |
| cloudflared | 2026.10.7 | [Public access](public-access.md) |
| cert-manager | v1.21.3 | Certificates for the Postgres backup plugin |
| CloudNativePG | 1.30.1, Barman Cloud plugin 0.16.0 | [Postgres](postgres.md) |
| vmagent, kube-state-metrics, Vector | charts 0.51.0, 9.0.0, 0.61.0 | [Monitoring](monitoring.md) |
| Keycloak operator | 26.8.2 | [Keycloak](keycloak.md) |

Traefik and ServiceLB are disabled in k3s: public apps go through the tunnel,
LAN-only ingress comes later.

## One repo per app

Every app has its own repo, whether it is off-the-shelf (only manifests,
like `hgd1-cloudreve`) or my own software (code, CI and manifests). The app
repo has a `deploy/` folder that kustomize can build; this repo only points
Flux at it with one file in `apps/`:

```yaml
# apps/<app>.yaml
apiVersion: source.toolkit.fluxcd.io/v1
kind: GitRepository
metadata: { name: hgd1-<app>, namespace: flux-system }
spec:
  url: https://github.com/jurrebuunk/hgd1-<app>
  ref: { branch: main }
  interval: 1m
  include:              # components/ from this repo, for the app's kustomization
    - repository: { name: flux-system }
      fromPath: components
      toPath: components
---
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata: { name: <app>, namespace: flux-system }
spec:
  interval: 10m
  retryInterval: 1m
  timeout: 10m
  sourceRef: { kind: GitRepository, name: hgd1-<app> }
  path: ./deploy
  prune: true
  wait: true
  decryption: { provider: sops, secretRef: { name: sops-age } }
```

What stays in this repo for an app: its tunnel route
([Public access](public-access.md)) and its Keycloak client
([Keycloak](keycloak.md)), because those change the shared platform.

## Operating

```sh
flux get kustomizations                              # every layer Ready?
flux get sources git                                 # last commit Flux saw per repo
flux reconcile kustomization apps --with-source      # apply the latest commit now
flux suspend kustomization <name>                    # hold Flux off while fixing by hand
flux resume kustomization <name>
```

## Related

- [Build an app](../how-to/build-an-app.md) · [Manage secrets](../how-to/manage-secrets.md)
- [PLAN.md](https://github.com/jurrebuunk/hgd1-k8s/blob/main/PLAN.md): how it was built, step by step
