# Plan

Where this repo is going, so I can pick it up from here. Nothing is built yet.

## Goal

Everything a new app needs already in the cluster: load balancer IPs,
ingress, certificates, storage, Postgres, secrets and monitoring. An app then
only brings its own manifests.

## What the cluster already gives this repo

From `nix-hgd1-cluster`: k3s 1.35, three servers + two agents with zone labels
(`topology.kubernetes.io/zone` = host), API at `https://k8s.lan.buunk.org:6443`,
`local-path`, the ConfigMap `kube-system/hgd1-ceph` (FSID, monitors, S3
endpoint), the S3 endpoint `https://s3.lan.buunk.org`, and monitoring stores at
`mon.lan.buunk.org`. Traefik and ServiceLB are disabled in k3s on purpose.

## Components

| Component | Purpose |
| --- | --- |
| **Flux** + **sops/age** | GitOps; secrets encrypted in Git with my age key |
| **MetalLB** | Load balancer IPs `10.10.40.200–249` (users VLAN may reach them on 80/443) |
| **Traefik** or **Envoy Gateway** | Ingress / Gateway API (not ingress-nginx, which is retired) |
| **cert-manager** | Certificates through Cloudflare DNS-01 |
| **ceph-csi** (RBD, later CephFS) | StorageClass `ceph-bulk`, from the `hgd1-ceph` ConfigMap |
| **CloudNativePG** | One reusable Postgres template: 3 instances, zone spread, backups to S3 |
| **vmagent** + **Vector** | k3s metrics and logs to `mon.lan.buunk.org` (needs an OPNsense rule K8S → `10.10.20.10` 8428/9428) |
| **cloudflared** (later) | Public hostnames, e.g. `lab.buunk.org`, once Keycloak exists |
| **Keycloak** (later) | OIDC for the web UI, `clusterd` and apps |

## Rules for apps (from the handbook)

Databases replicate themselves on `local-path`; files go to S3; disks that
don't replicate use Ceph RBD; never a single non-replicated volume on
`local-path`.

## Delivery

Flux bootstraps from this repo and also points at app repos (for example
`lab-console/deploy`), with image automation for images in GHCR. Nothing is
pushed into the cluster from GitHub.

## Order

1. Flux bootstrap + sops/age.
2. MetalLB, ingress, cert-manager.
3. ceph-csi, then CloudNativePG.
4. vmagent + Vector to the existing monitoring.
5. `lab-console` via Flux.

## Not yet

CI and the directory layout are intentionally not set up yet.
