---
icon: lucide/git-branch
---

# GitOps

Everything on the cluster comes from Git. **Flux** runs inside k3s, pulls
this repo and the app repos, and makes the cluster match them; a change is a
commit, a rollback is a revert.

!!! cluster "On the cluster docs: the cluster under this"

    The k3s VMs, zones, the kubeconfig, and the S3 endpoint and monitoring
    stores these components use.

    [k3s](https://jurrebuunk.github.io/nix-hgd1-cluster/concepts/k3s/){ .md-button }

!!! info "At a glance"

    **Status** <span class="status">Done</span> · **Entry point**
    `clusters/hgd1/` · **Secrets** sops with age · **Components**
    [Components](../reference/components.md) · **Check** `flux get kustomizations`

## Overview

What has to exist before Kubernetes works, or keep working when it's broken,
comes from Nix; what runs as pods comes from Git through Flux.

| From `nix-hgd1-cluster` (Nix) | From this repo (Flux) | From app repos (Flux) |
| --- | --- | --- |
| Hosts, network, Ceph, the S3 endpoint, host monitoring, `clusterd`/`labctl`, the VMs, k3s with flannel and CoreDNS | Flux, sops, metrics-server, local-path, `cloudflared`, cert-manager, CloudNativePG, k3s monitoring, Keycloak | Cloudreve, later `lab-console` and other apps |

## How it works

### Layers

Flux applies the repo in layers; each waits until the one before is ready,
so an operator's CRDs exist before anything uses them.

| Layer | Folder | What |
| --- | --- | --- |
| `infrastructure` | `infrastructure/` | Controllers and operators, one folder each |
| `config` | `config/` | What needs their CRDs |
| `platform` | `platform/` | Shared services: Keycloak and its database |
| `keycloak-realm` | `platform/keycloak-realm/` | The realms, applied by keycloak-config-cli |
| `apps` | `apps/` | One pointer file per app, nothing else |

`components/` holds reusable pieces that apps include, such as
`components/postgres` ([Postgres](postgres.md)).

### Secrets

`*.sops.yaml` files are Secrets with encrypted values; Flux decrypts them
with the cluster's age key (Secret `flux-system/sops-age`) when it applies
them. See [Manage secrets](../how-to/manage-secrets.md).

### One repo per app

Every app has its own repo, off-the-shelf (only manifests, like
`hgd1-cloudreve`) or my own software (code, CI and manifests). The app repo
has a `deploy/` folder that kustomize can build; this repo points Flux at it
with one file in `apps/`, which also brings `components/` along:

```yaml
# apps/<app>.yaml
apiVersion: source.toolkit.fluxcd.io/v1
kind: GitRepository
metadata: { name: hgd1-<app>, namespace: flux-system }
spec:
  url: https://github.com/jurrebuunk/hgd1-<app>
  ref: { branch: main }
  interval: 1m
  include:
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

What stays in this repo for an app: its tunnel route and its Keycloak
client, because those change the shared platform.

## Configuration

| File | Owns |
| --- | --- |
| `clusters/hgd1/*.yaml` | The layers: path, order, decryption, health checks |
| `clusters/hgd1/flux-system/` | Flux itself (from `flux bootstrap`) |
| `apps/*.yaml` | Which app repos Flux deploys |
| `.sops.yaml` | Which files are encrypted, for which keys |

## Operating

```sh
flux get kustomizations                              # every layer Ready?
flux get sources git                                 # last commit Flux saw per repo
flux reconcile kustomization apps --with-source      # apply the latest commit now
flux suspend kustomization <name>                    # hold Flux off while fixing by hand
flux resume kustomization <name>
```

## Troubleshooting

See [Troubleshooting → Flux](../operate/troubleshooting.md#flux).

## Related

- [Build an app](../how-to/build-an-app.md) · [Manage secrets](../how-to/manage-secrets.md) · [Components](../reference/components.md)
