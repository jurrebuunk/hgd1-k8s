# Plan

Where this repo is going, so I can pick it up from here. Step 1 (Flux and
sops) runs on the cluster since 2026-11-24.

## Goal

Public applications on the hgd1 k3s cluster, deployed by pushing to Git.
The first one is **Cloudreve** (files in S3, login through Keycloak). An app
only brings its own manifests; this repo provides what every app needs:
GitOps, secrets, public access, Postgres, login and monitoring.

## What runs where

The rule: what has to exist before Kubernetes works, or must keep working
when it's broken, comes from Nix; what runs as pods comes from here.

| From `nix-hgd1-cluster` (Nix) | From this repo (Flux) | From app repos (Flux) |
| --- | --- | --- |
| Hosts, network, Ceph, the S3 endpoint, host monitoring, `clusterd`/`labctl`, the VMs, k3s with flannel and **CoreDNS** (Flux needs DNS to start) | Flux, sops, metrics-server, local-path, `cloudflared`, CloudNativePG, k3s monitoring, Keycloak | Cloudreve, `lab-console`, later apps |

## What the cluster already gives this repo

From `nix-hgd1-cluster`: k3s 1.35, three servers + two agents with zone
labels (`topology.kubernetes.io/zone` = host), API at
`https://k8s.lan.buunk.org:6443` (over WARP), the S3 endpoint
`https://s3.lan.buunk.org` (S3 users and buckets through `labctl s3`), and
monitoring stores at `mon.lan.buunk.org`. Pods reach the internet and
`*.lan.buunk.org`. Traefik and ServiceLB are disabled in k3s on purpose.

## Layout

```
clusters/hgd1/          # entry point: Flux itself and three Kustomizations
  flux-system/          #   written by flux bootstrap
  infrastructure.yaml   #   → ./infrastructure
  config.yaml           #   → ./config, dependsOn infrastructure
  apps.yaml             #   → ./apps, dependsOn config
infrastructure/         # controllers, one folder each (HelmRepository + HelmRelease)
  metrics-server/  local-path/  cloudflared/  cloudnative-pg/  monitoring/  keycloak/
config/                 # what needs their CRDs: Postgres template, tunnel routes
apps/                   # one file per app, pointing Flux at the app's repo
.sops.yaml              # which files are encrypted, for which age key
```

Secrets are encrypted with sops and age before they're committed; the
cluster holds the age private key, put there once by hand.

## Steps

Each step ends with something to check.

### 1. Flux and secrets

- [x] An age key for the cluster; its public key in `.sops.yaml`, the private
      key as a Secret in `flux-system` (once, by hand).
- [x] `flux bootstrap github --owner jurrebuunk --repository hgd1-k8s --path clusters/hgd1`.
- [x] Done when: `flux check` passes and a sops-encrypted test secret shows up
      decrypted in the cluster.

### 2. Take over the k3s add-ons

- [ ] metrics-server and local-path-provisioner from here, with the same
      StorageClass name `local-path` and the same data path on each node.
- [ ] Then in `nix-hgd1-cluster`: `metrics-server` and `local-storage` in the
      k3s `disable` list, deploy, `labctl vm roll`.
- [ ] Done when: `kubectl top nodes` works and a test volume on `local-path`
      binds, both from Flux.

### 3. Public access: Cloudflare Tunnel

- [ ] A tunnel `hgd1-apps` (separate from `hgd1-admin`, the hosts' WARP
      tunnel); its credentials sops-encrypted here.
- [ ] `cloudflared` with three replicas, one per zone.
- [ ] Its routes ("hostname → Service") in Git, so publishing an app is a
      commit.
- [ ] DNS: a wildcard `*.buunk.org` → the tunnel; explicit records (like
      everything under `lan.buunk.org`) still win.
- [ ] Cloudflare terminates TLS: no cert-manager, load balancer IPs or ingress
      controller for public apps.
- [ ] Done when: a test page at `test.buunk.org` answers from the internet and
      stays up while one node is drained.

### 4. Postgres: CloudNativePG

- [ ] The operator, and one template: 3 instances, one per zone, on
      `local-path`.
- [ ] Backups to the bucket `pg-backups` (user and bucket made once with
      `labctl s3`; the key sops-encrypted here), set in the template:

    | Setting | Value | Why |
    | --- | --- | --- |
    | WAL upload (`archive_timeout`) | 5 min (15 min if fewer uploads matter more) | At most that much lost; an idle database uploads nothing |
    | Compression | zstd | Less written to S3 |
    | Full copy | weekly | The continuous WAL covers the days between |
    | Retention | 14 days | Old backups are deleted automatically |

- [ ] Wear: the S3 side is cheap (Ceph's HDDs spin all the time anyway and
      don't wear from writes); Postgres itself writes to the NVMe of three
      hosts. Watch `labctl disk list` (WEAR) once databases run.
- [ ] Done when: a test database survives deleting its primary, and a new
      cluster restores from the S3 backup.

### 5. Monitoring inside k3s

- [ ] vmagent and Vector, sending pod metrics and logs to `mon.lan.buunk.org`.
- [ ] Done when: `labctl logs` and `labctl metrics` show pod data.

### 6. Keycloak

- [ ] On a Postgres from the template, public at `auth.buunk.org` through
      the tunnel.
- [ ] A realm `hgd1` for my users; one OIDC client per app.
- [ ] Done when: I can log in at `auth.buunk.org`.

### 7. Cloudreve, the first public app

- [ ] Cloudreve at `files.buunk.org` (name to confirm) through the tunnel.
- [ ] Database on a Postgres from the template.
- [ ] Files in an S3 bucket of its own (`labctl s3 user create cloudreve`,
      `labctl s3 bucket create cloudreve --owner cloudreve`), key
      sops-encrypted.
- [ ] Login through Keycloak (OIDC client `cloudreve`).
- [ ] The S3 endpoint is internal only, so uploads and downloads go through
      Cloudreve (its proxy/relay setting), never straight from the browser to
      `s3.lan.buunk.org`. To check: Cloudreve's S3 policy and OIDC settings
      in the version I deploy.
- [ ] Its manifests in an app repo (or `apps/cloudreve/` to start), deployed
      by Flux.
- [ ] Done when: from outside the network I log in with Keycloak, upload a
      file, and see it in `labctl s3 bucket show cloudreve`.

### 8. More apps

- [ ] `lab-console` behind Keycloak, and whatever comes next: each app repo
      brings its manifests, `apps/` points Flux at it, images from GHCR roll
      out through Flux's image automation.

## Needed from other repos

| Step | Where | What |
| --- | --- | --- |
| 2 | `nix-hgd1-cluster` | `metrics-server` and `local-storage` disabled in k3s |
| 3 | Cloudflare | The tunnel `hgd1-apps` and the wildcard record |
| 4, 7 | `labctl` | S3 users and buckets (needs the RGW cap for `clusterd`) |
| 5 | `hgd1-network` | Firewall: k8s VLAN → `10.10.20.10` on 8428 and 9428 |

## Later

- Local ingress for services only on the LAN: MetalLB (`10.10.40.200–249`),
  Traefik with Gateway API, cert-manager with DNS-01, `*.apps.lan.buunk.org`.
- Forgejo, public and mirrored to GitHub.

## Not planned

- **ceph-csi:** apps keep their state in Postgres on `local-path` or in S3,
  so there is no Ceph block storage for pods.
