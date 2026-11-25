---
icon: lucide/heart-pulse
---

# Operate

Running the cluster's platform day to day. Commands run on the laptop with
WARP connected on `hgd1-admin` and `KUBECONFIG=~/.kube/hgd1.yaml`.

## Health check

```sh
flux get kustomizations -A                                 # every layer and app Ready
kubectl get pods -A | grep -v -E 'Running|Completed'       # nothing stuck
kubectl get clusters.postgresql.cnpg.io -A                 # every database healthy
kubectl get backups -A --sort-by=.metadata.creationTimestamp | tail -5   # recent backups completed
kubectl -n cloudflared get pods -o wide                    # three tunnel pods, three hosts
```

**Healthy means:**

- [x] every Kustomization `Ready` on the latest commit;
- [x] no pods in `Pending`, `CrashLoopBackOff` or `Error`;
- [x] every Postgres `Cluster in healthy state`, with this week's full backup;
- [x] three cloudflared pods, and the apps answer from outside
      ([Routes and apps](../reference/routes.md));
- [x] pod logs arriving: `labctl logs --since 10m 'namespace:keycloak'`.

The machines underneath (nodes, Ceph, S3, monitoring stores) are checked on
the cluster docs.

!!! cluster "On the cluster docs: health check"

    `labctl health`: hosts, VMs, nodes, Ceph, VIPs, disks, S3 and the
    monitoring.

    [Cluster health check](https://jurrebuunk.github.io/nix-hgd1-cluster/operate/){ .md-button }

## Ground rules

1. **Everything goes through Git.** Flux reverts changes made by hand; use
   `flux suspend` while debugging.
2. **Look before you delete.** A deleted `Cluster` or PVC takes its data
   with it; S3 backups stay 14 days.
3. **Secrets never in Git unencrypted, chat or logs.**
4. **No people in Git**: accounts in Keycloak's admin console.

## Runbooks

<div class="grid cards" markdown>

- :lucide-life-buoy: [**Troubleshooting**](troubleshooting.md): find the fix by symptom
- :lucide-database: [**Restore a database**](../how-to/add-a-database.md#restore-from-s3): from the S3 backups

</div>

## Schedule

| How often | What |
| --- | --- |
| Weekly | The health check above |
| Monthly | Update chart and image versions (one at a time, read the release notes); `labctl disk list` for NVMe wear from Postgres |
| Every few months | Restore a database into a scratch cluster as a test |
| Yearly | Rotate the S3 keys of apps and `pg-backups`; the tunnel credentials |

## State outside Git

| What | Where |
| --- | --- |
| Databases | Postgres clusters on `local-path`, backups in `s3://pg-backups/` |
| App files | Their S3 buckets (Cloudreve: `cloudreve`) |
| Keycloak accounts | `keycloak-db` |
| Flux's age key | Secret `flux-system/sops-age`; backup `secrets/flux-sops-age.age` in `nix-hgd1-cluster` |
