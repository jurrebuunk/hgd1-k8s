---
icon: lucide/database
---

# Add a database

Give an app its own Postgres cluster, with failover and backups to S3.
Background: [Postgres](../concepts/postgres.md).

## 1. The Cluster

In the app repo's `deploy/`:

```yaml
# deploy/database.yaml
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata: { name: notes-db }
spec:
  instances: 2           # 1: no copy (S3 only); 3: apps everyone needs (Keycloak)
  storage: { size: 2Gi }
  bootstrap: { initdb: { database: notes, owner: notes } }
```

```yaml
# deploy/kustomization.yaml
resources: [database.yaml]
components: [../components/postgres]
```

## 2. Connect the app

```yaml
env:
  - name: DATABASE_URL
    valueFrom: { secretKeyRef: { name: notes-db-app, key: uri } }
```

The Secret `notes-db-app` also has `host`, `port`, `dbname`, `username` and
`password` for apps that want them separately. If the app logs its
configuration at start, give it a config file instead of environment
variables, so the password doesn't end up in the logs.

**Helm charts:** turn off the chart's own Postgres (`postgresql.enabled:
false`) and point its external-database settings at `notes-db-rw` and the
Secret.

## 3. Check

```sh
kubectl -n notes get cluster notes-db           # Cluster in healthy state, 2 ready
kubectl -n notes get backups                    # the first full backup completed
```

## Restore from S3

Into a new cluster (same namespace, new name):

```yaml
spec:
  bootstrap:
    recovery: { source: notes-db }
  externalClusters:
    - name: notes-db
      plugin:
        name: barman-cloud.cloudnative-pg.io
        parameters: { barmanObjectName: pg-backups, serverName: notes-db }
```

Then point the app at the new cluster's Secret.

## Start over

To recreate a database from scratch (for example after a password leaked):

1. `flux suspend kustomization <app>`
2. Delete the app's Deployment, the `Cluster` and its `ScheduledBackup`.
3. Delete `s3://pg-backups/<cluster>/`.
4. `flux resume kustomization <app>`: Flux creates it all again, with a new
   password.

Removing an app removes its database; its backups stay in S3 for 14 days.
