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
| `auth.buunk.org` | Keycloak (`keycloak-service.keycloak:8080`) | Exact `/` and `/realms/hgd1/account…` → 302 to `https://hub.buunk.org/` through `keycloak-root-redirect.keycloak:8080`; `/admin` and `/realms/master` answer 404 |
| `cloudreve.buunk.org` | Cloudreve (`cloudreve.cloudreve:80`) | |
| `files-s3.buunk.org` | Cloudreve's S3 gateway (`s3-gateway.cloudreve:80`) | Only `/cloudreve/…` (the bucket); everything else 404 |
| `hub.buunk.org` | buunk-hub (`hub.hub:80`) | Everything behind its own Keycloak sign-in except `/healthz` (and `/avatars/…` later) |

## Internal hostnames

Over WARP only (tunnel `hgd1-internal`, a hostname route each, no DNS
record), HTTPS through the internal Traefik
([Internal access](../concepts/internal-access.md)).

| Hostname | To | Who | Notes |
| --- | --- | --- | --- |
| `mail.buunk.org` | Cypht (`cypht.cypht:80`) | me | Webmail for Migadu mailboxes; sign in with the mailbox password |
| `whoami.buunk.org` | `whoami.whoami:80` (`platform/whoami/`) | me | Test app; goes once a real internal app exists |

## Apps

| App | Address | Repo | Pointer | Database | Bucket |
| --- | --- | --- | --- | --- | --- |
| Cloudreve 4.19.1 | <https://cloudreve.buunk.org> | [`hgd1-cloudreve`](https://github.com/jurrebuunk/hgd1-cloudreve) | `apps/cloudreve.yaml` | `cloudreve-db` (2) | `cloudreve` (512 GB) |
| Cypht 2.15.0 | <https://mail.buunk.org> (WARP) | [`hgd1-cypht`](https://github.com/jurrebuunk/hgd1-cypht) | `apps/cypht.yaml` | `cypht-db` (2) | |
| buunk-hub | <https://hub.buunk.org> | [`buunk-hub`](https://github.com/jurrebuunk/buunk-hub) | `apps/hub.yaml` | `hub-db` (2) | `hub-avatars` (later) |

## Platform services

| Service | Address | Database |
| --- | --- | --- |
| Keycloak | <https://auth.buunk.org> | `keycloak-db` (3) |
