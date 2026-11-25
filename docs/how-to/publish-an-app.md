---
icon: lucide/globe
---

# Publish an app

Put a Service on the internet at `<name>.buunk.org` through the tunnel.
Background: [Public access](../concepts/public-access.md).

**Before you start:** the app runs and its Service answers inside the
cluster (`kubectl -n <ns> port-forward svc/<svc> 8080:<port>`). If it has
users, decide how they log in first ([Keycloak](../concepts/keycloak.md)).

## 1. Add the route

In `infrastructure/cloudflared/config.yaml`, above the final
`http_status:404`:

```yaml
- hostname: notes.buunk.org
  service: http://notes.notes.svc.cluster.local:80
```

To hide part of an app (an admin page), add a blocking route **above** it:

```yaml
- hostname: notes.buunk.org
  path: ^/admin(/.*)?$
  service: http_status:404
```

Commit and push; cloudflared rolls by itself.

## 2. Add the DNS record

A **proxied** CNAME in the `buunk.org` zone (Cloudflare dashboard → DNS, or
the API):

| Type | Name | Target | Proxy |
| --- | --- | --- | --- |
| CNAME | `notes` | `464b884a-410d-4066-8946-0532c41f1978.cfargotunnel.com` | Proxied |

## 3. Check from outside

```sh
curl -sI -A "Mozilla/5.0" https://notes.buunk.org/ | head -1
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' http://notes.buunk.org/   # 301 https://notes.buunk.org/
curl -sI https://notes.buunk.org/ | grep -i strict-transport                        # max-age=31536000
```

HTTP to HTTPS and HSTS come from the zone settings
([Public access → HTTPS only](../concepts/public-access.md#https-only)); the app needs nothing for them.

From outside the network too (a phone without WARP). Then add it to
[Routes and apps](../reference/routes.md).

## Large uploads

Cloudflare allows 100 MB per request: configure the app to upload in chunks
(25 MB works). If browsers upload straight to S3, publish **only that
bucket** through a small gateway, as `files-s3.buunk.org` does in
[hgd1-cloudreve](https://github.com/jurrebuunk/hgd1-cloudreve#readme); never
publish `s3.lan.buunk.org` itself.

## Removing an app

Delete its route and its DNS record, in that order.
