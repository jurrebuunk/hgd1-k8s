---
icon: lucide/route
---

# Routes and apps

Every public hostname (tunnel `hgd1-apps`,
`infrastructure/cloudflared/config.yaml`) and every app repo. Each hostname
has a proxied CNAME to `464b884a-410d-4066-8946-0532c41f1978.cfargotunnel.com`.

## Public hostnames

| Hostname | To | Notes |
| --- | --- | --- |
| `auth.buunk.org` | Keycloak (`keycloak-service.keycloak:8080`) | `/admin` and `/realms/master` answer 404 |
| `cloudreve.buunk.org` | Cloudreve (`cloudreve.cloudreve:80`) | |
| `files-s3.buunk.org` | Cloudreve's S3 gateway (`s3-gateway.cloudreve:80`) | Only `/cloudreve/…` (the bucket); everything else 404 |

## Apps

| App | Address | Repo | Pointer | Database | Bucket |
| --- | --- | --- | --- | --- | --- |
| Cloudreve 4.19.1 | <https://cloudreve.buunk.org> | [`hgd1-cloudreve`](https://github.com/jurrebuunk/hgd1-cloudreve) | `apps/cloudreve.yaml` | `cloudreve-db` (2) | `cloudreve` (512 GB) |

## Platform services

| Service | Address | Database |
| --- | --- | --- |
| Keycloak | <https://auth.buunk.org> | `keycloak-db` (3) |
