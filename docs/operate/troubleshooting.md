---
icon: lucide/life-buoy
---

# Troubleshooting

Find the symptom, follow the steps. Start with Flux: most problems show up
there first.

```sh
flux get kustomizations -A          # which layer or app isn't Ready, and why
kubectl get pods -A | grep -v Running
labctl logs --since 30m 'namespace:<ns>'
```

!!! cluster "On the cluster docs: troubleshooting"

    Nodes not ready, the k3s API, Ceph, the S3 endpoint and the monitoring
    stores.

    [Cluster troubleshooting](https://jurrebuunk.github.io/nix-hgd1-cluster/operate/troubleshooting/){ .md-button }

## Flux

| You see | Likely cause and fix |
| --- | --- |
| A Kustomization `False` with `dependency … not ready` | The layer before it failed; fix that one first |
| `decryption failed` / `MAC mismatch` | The file isn't encrypted for the cluster key, or a component Secret without `mac_only_encrypted` ([Manage secrets](../how-to/manage-secrets.md#secrets-in-components)) |
| `health check failed` after `timeout` | A Deployment or Cluster never got Ready: `kubectl -n <ns> describe` it |
| A change isn't applied | `flux get sources git`: did Flux see the commit? `flux reconcile kustomization <name> --with-source` |
| Something changed by hand is reverted | Flux owns it. Change Git, or `flux suspend` while debugging |

## Pods

| You see | Likely cause and fix |
| --- | --- |
| `Pending` with `didn't match pod topology spread constraints` | Not enough zones free (a host is down, or a node cordoned); expected until it's back |
| `Pending` on a `local-path` volume | The node holding that volume is down; it comes back with the node, or the copy takes over (Postgres) |
| `OOMKilled` | Raise the limit, carefully: a node has 4 GiB |
| A name like `foo.ns.svc.cluster.local` doesn't resolve | Pods use k3s's own resolver file without the `lan.buunk.org` search domain (OPNsense answers NOERROR for unknown names); check CoreDNS, not the router |

## Public access

| You see | Likely cause and fix |
| --- | --- |
| Cloudflare error 1033 | No cloudflared connected: `kubectl -n cloudflared get pods`, their logs |
| 404 from the tunnel | No route for that hostname or path (or the route blocks it on purpose); check `infrastructure/cloudflared/config.yaml` |
| Hostname doesn't resolve | Its proxied CNAME is missing ([Public access](../concepts/public-access.md#publishing-an-app)) |
| 502 | The Service has no ready endpoints, or the route points at the wrong port |
| 413 on upload | Over the 100 MB request limit; upload in chunks |

## Postgres

```sh
kubectl get clusters.postgresql.cnpg.io -A
kubectl -n <ns> describe cluster <name>
kubectl -n <ns> get backups
```

| You see | Likely cause |
| --- | --- |
| Cluster stuck `Setting up primary` | Its volume's node is down, or the backup bucket is unreachable (check the plugin pod in `cnpg-system`) |
| Backups failing | The `pg-backups` key or the S3 endpoint: `labctl s3 status` |

## Keycloak

| You see | Likely cause |
| --- | --- |
| Admin console won't log in | Use the port-forward on port **8080** exactly; the `master` realm's address is `http://localhost:8080` |
| Realm change not applied | The keycloak-config-cli Job: `kubectl -n keycloak logs job/<name>` |
| Theme error 500 | A broken `theme.properties` or template; Keycloak's log names the line |

## Web UI

| You see | Likely cause |
| --- | --- |
| Loads but shows no data | The pod can't reach `10.10.20.20:443` (router rule, [network firewall](https://jurrebuunk.github.io/hgd1-network/firewall/)), or its `operator` token is revoked |
