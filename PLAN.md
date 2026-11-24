# Plan

Where this repo is going, so I can pick it up from here. Steps 1–6 (Flux and
sops, metrics-server and local-path, the public tunnel, Postgres, monitoring,
Keycloak) run on the cluster since 2026-11-24.

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
  infrastructure.yaml   #   → ./infrastructure (controllers, operators)
  config.yaml           #   → ./config, dependsOn infrastructure
  platform.yaml         #   → ./platform (shared services: Keycloak), dependsOn config
  keycloak-realm.yaml   #   → ./platform/keycloak-realm, dependsOn platform
  apps.yaml             #   → ./apps, dependsOn platform
infrastructure/         # controllers, one folder each (HelmRepository + HelmRelease)
  metrics-server/  local-path/  cloudflared/  cert-manager/  cloudnative-pg/  monitoring/
components/             # reusable pieces for apps, e.g. postgres (defaults and backups)
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

- [x] metrics-server and local-path-provisioner from here, with the same
      StorageClass name `local-path` and the same data path on each node.
- [x] Then in `nix-hgd1-cluster`: `metrics-server` and `local-storage` in the
      k3s `disable` list, deploy, `labctl vm roll`.
- [x] Done when: `kubectl top nodes` works and a test volume on `local-path`
      binds, both from Flux.

### 3. Public access: Cloudflare Tunnel

- [x] A tunnel `hgd1-apps` (`464b884a-410d-4066-8946-0532c41f1978`,
      separate from `hgd1-admin`, the hosts' WARP tunnel); its credentials
      sops-encrypted in `infrastructure/cloudflared/`.
- [x] `cloudflared` with three replicas, one per zone, at most one down at a
      time.
- [x] Its routes ("hostname → Service") in Git
      (`infrastructure/cloudflared/config.yaml`); a change rolls cloudflared.
- [x] DNS: one proxied CNAME per hostname → `<tunnel id>.cfargotunnel.com`.
      A wildcard `*.buunk.org` isn't possible (it has MX records). Made by
      hand for now; external-dns is
      [#1](https://github.com/jurrebuunk/hgd1-k8s/issues/1).
- [x] Cloudflare terminates TLS: no cert-manager, load balancer IPs or
      ingress controller for public apps.
- [x] Done when: `https://test.buunk.org` answers from the internet and
      stays up while one node is drained. Tested 2026-11-24: 247 of 247
      requests succeeded while `hgd1-k8m01` was drained and restarted.

**Publishing an app:** a route in `infrastructure/cloudflared/config.yaml`
(`hostname: x.buunk.org`, `service: http://<svc>.<ns>.svc.cluster.local:<port>`)
and its CNAME.

### 4. Postgres: CloudNativePG

Every app that needs Postgres gets **its own small cluster** (a primary plus
copies) in its own namespace, as CloudNativePG recommends; there is no shared
database server.

- [x] cert-manager (for the backup plugin's TLS), the CloudNativePG operator
      (1.30.1) and its Barman Cloud plugin, from Flux.
- [x] Backups to the bucket `pg-backups` (user and bucket made with
      `labctl s3`; the key sops-encrypted in `components/postgres/`), one
      folder per cluster:

    | Setting | Value | Why |
    | --- | --- | --- |
    | WAL upload (`archive_timeout`) | 5 min | At most that much lost; an idle database uploads nothing |
    | Compression | zstd | Less written to S3 |
    | Full copy | weekly (Sunday 03:00), and one at creation | The continuous WAL covers the days between |
    | Retention | 14 days | Old backups are deleted automatically |

- [x] `components/postgres`: an app's `Cluster` (name, instances, size,
      bootstrap) gets the rest from it: servers in different zones on
      `local-path`, the backups above, metrics scraping, modest resources.
      CloudNativePG makes the database, the user and the Secret
      `<cluster>-app` (with `uri`, `host`, `username`, `password`, …).
- [x] Done when: a test database survives deleting its primary, and a new
      cluster restores from the S3 backup. Tested 2026-11-24: the copy took
      over in 7 s with all rows; a cluster restored only from S3 had every
      row, including one written just before. The test and its backups are
      removed.
- [x] Wear: the S3 side is cheap (Ceph's HDDs spin all the time anyway);
      Postgres itself writes to the NVMe of the hosts it runs on. Watch
      `labctl disk list` (WEAR) once databases run.

**An app's database** (in the app's folder, with `components: [../../components/postgres]`
in its `kustomization.yaml`):

```yaml
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata: { name: notes-db }
spec:
  instances: 2           # 3 for apps everyone depends on (Keycloak)
  storage: { size: 2Gi }
  bootstrap: { initdb: { database: notes, owner: notes } }
```

The app reads `notes-db-app` (key `uri`) and connects to `notes-db-rw`. A
Helm chart's own built-in Postgres is never used: turn it off and point the
chart at the Cluster.

### 5. Monitoring inside k3s

- [x] vmagent (kubelets, cAdvisor, pods and services with
      `prometheus.io/scrape`) and kube-state-metrics, written to all three
      hosts' VictoriaMetrics with `cluster=hgd1-k8s`.
- [x] Vector on every node: pod logs to the hosts' VictoriaLogs, `host` =
      node, `unit` = container, plus `namespace` and `pod`.
- [x] Both go over the storage network to each host's storage IP, like the
      VMs' own logs; no router rule (the hosts accept 8428 and 9428 on
      `br-stor`, `nix-hgd1-cluster`).
- [x] Done when: `labctl logs --unit cloudflared` shows the tunnel's lines and
      `labctl metrics query 'kube_pod_info{cluster="hgd1-k8s"}'` the pods.
      Tested 2026-11-24, every target up.
- [ ] Pods reach more than they need on the storage network:
      [#2](https://github.com/jurrebuunk/hgd1-k8s/issues/2).

### 6. Keycloak

- [x] The official operator (26.8.2) from Keycloak's release manifests;
      Keycloak in a `platform` layer (after `config`, before `apps`).
- [x] Keycloak with 2 pods on different hosts, on its own Postgres with 3
      servers (`keycloak-db`, backed up like every cluster).
- [x] Public at `https://auth.buunk.org` through the tunnel; Cloudflare
      terminates TLS. The admin console and the `master` realm are **not
      public** (the tunnel answers 404); use
      `kubectl -n keycloak port-forward svc/keycloak-service 8080` and
      `http://localhost:8080/admin/` (port 8080 exactly).
- [x] The realm `hgd1` from Git (`platform/keycloak-realm/hgd1.yaml`, applied
      by keycloak-config-cli on every change): settings, brute-force
      protection, password policy, groups `admins`, `family`, `friends`.
- [x] **No people in Git.** Accounts and group membership are made in the
      admin console. The first login is `temp-admin`, generated into a sops
      Secret: read it with
      `kubectl -n keycloak get secret keycloak-bootstrap-admin -o jsonpath='{.data.password}' | base64 -d`,
      make your own admin in the `master` realm, then delete `temp-admin`.
      keycloak-config-cli uses its own generated machine login.
- [x] Done when: logins at `auth.buunk.org` work from the internet and stay
      up while a node restarts, and the database restores from S3. Tested
      2026-11-24: 288 of 288 requests answered while `hgd1-k8m02` (a
      Keycloak pod and a database server) restarted; a restore had both
      realms and the 3 groups.
- [ ] Mail for password resets: [#3](https://github.com/jurrebuunk/hgd1-k8s/issues/3).

**What lives where:** realm settings, clients, roles and which group gets
which role are code (reviewed, in the app's commit); who is in which group
is managed in the admin console.

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
| 3 | Cloudflare | The tunnel `hgd1-apps` (done) and a DNS token for external-dns (#1) |
| 4, 7 | `labctl` | S3 users and buckets (needs the RGW cap for `clusterd`) |
| 5 | `nix-hgd1-cluster` | The hosts accept 8428 and 9428 on the storage bridge (done; no router rule needed) |

## Later

- Local ingress for services only on the LAN: MetalLB (`10.10.40.200–249`),
  Traefik with Gateway API, cert-manager with DNS-01, `*.apps.lan.buunk.org`.
- Forgejo, public and mirrored to GitHub.

## Not planned

- **ceph-csi:** apps keep their state in Postgres on `local-path` or in S3,
  so there is no Ceph block storage for pods.
