---
icon: lucide/shield-check
---

# Publish an internal app

Make a Service reachable at `https://<name>.buunk.org` over WARP only.
Background: [Internal access](../concepts/internal-access.md). The example
is `whoami` (`platform/whoami/`).

**Before you start:** the app runs and its Service answers inside the cluster.

## 1. Ingress and certificate (app repo)

Next to the app's Service, with `components/egress/default` as for any app:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: notes
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-staging   # letsencrypt once it works
spec:
  ingressClassName: internal
  tls:
    - hosts: [notes.buunk.org]
      secretName: notes-tls
  rules:
    - host: notes.buunk.org
      http:
        paths:
          - path: /
            pathType: Prefix
            backend: { service: { name: notes, port: { number: 80 } } }
```

## 2. The name inside the cluster (hgd1-k8s)

One line in `infrastructure/coredns/coredns-custom.yaml`:

```text
rewrite name exact notes.buunk.org traefik-internal.traefik-internal.svc.cluster.local answer auto
```

## 3. The hostname route (Cloudflare)

Zero Trust → Networks → Tunnels → `hgd1-internal` → Routes → Add route →
Private hostname `notes.buunk.org`. **No DNS record**: that would make it
public.

## 4. Who may use it

Already allowed for me (rule 1100). For someone else, an allow rule above
2100 with the hostname and their identity, e.g. SNI `notes.buunk.org` and
their email.

## 5. Check

On WARP:

```sh
getent hosts notes.buunk.org                                       # 172.64.x.x
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' http://notes.buunk.org/   # 301 https://…
curl -sI https://notes.buunk.org/ | grep -i strict-transport       # max-age=31536000
```

Without WARP (a phone on mobile data) the name must not resolve. Then switch
the issuer to `letsencrypt` and add it to [Routes and apps](../reference/routes.md).
