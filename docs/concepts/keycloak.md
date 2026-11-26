---
icon: lucide/key-round
---

# Keycloak

Logins for public apps: **`https://auth.buunk.org`**, realm `hgd1`, over
OpenID Connect. Apps never handle passwords themselves; people have one
account for every app.

!!! info "At a glance"

    **Status** <span class="status">Done</span> · **Version** 26.8.2 (the
    official operator) · **Issuer** `https://auth.buunk.org/realms/hgd1` ·
    **Admin console** port-forward only · **Theme** flatwork

## Overview

| Part | Detail |
| --- | --- |
| Keycloak | 2 pods in different zones, namespace `keycloak` |
| Database | `keycloak-db`, its own Postgres with 3 servers, backed up like every [cluster](postgres.md) |
| Realm `hgd1` | For people and apps: settings, brute-force protection, password policy, groups `admins`, `family`, `friends` |
| Realm `master` | Only for administrators; its address is `http://localhost:8080`, so it only works through the port-forward |
| Public | Through the [tunnel](public-access.md); `/` redirects to `/realms/hgd1/account/` (sign-in when logged out); `/admin` and `/realms/master` answer 404 |
| Theme | `flatwork`: the buunk-auth design, built with `@flatwork-ui/react`; dark by default, light/system configurable |

## How it works

### What lives where

| In Git (reviewed, with the app) | In the admin console |
| --- | --- |
| Realm settings, an app's client (ID, redirect addresses, roles), which group gets which role | People: accounts and which groups they're in |

There are no people in Git. keycloak-config-cli applies the realm files on
every change, with its own machine login.

### Connecting an app

| Setting | Value |
| --- | --- |
| Issuer / discovery | `https://auth.buunk.org/realms/hgd1` (`/.well-known/openid-configuration`) |
| Client | One per app, in `hgd1.yaml`, confidential, standard flow |
| Redirect URI | The app's callback on its public hostname |
| Permissions | The app reads groups or roles from the token; check that it can |

A client's secret is a sops Secret next to the realm
(`platform/keycloak-realm/client-<app>.sops.yaml`), put into the realm by
keycloak-config-cli with `$(env:…)`; the app repo has the same value.

### Apps using it

| App | Client | Roles → groups |
| --- | --- | --- |
| Cloudreve | `cloudreve` | `admins` → `cloudreve-admin` (Cloudreve's Admin group, not a Keycloak admin); `family`, `friends` → `cloudreve-user`; no role, no access |
| buunk-hub | `hub` | No roles of its own: it reads every client's roles (`resource_access` in the ID token) to show each person their apps; asks for `offline_access` for 30-day sessions |
| WARP (Cloudflare Zero Trust) | `cloudflare-zero-trust` | `admins`, `family` → `warp` (may enrol a device; not the admin network); groups go along as the claim `groups` for Gateway rules. See [Internal access](internal-access.md#signing-in-to-warp) |

Cloudreve's OIDC login is a Pro feature upstream; hgd1-cloudreve adds it with
a patch to the open-source version (its README: *Login through Keycloak*).
Someone who already had a Cloudreve account gets linked to it only when
their email is marked **verified** here (Users → the user → *Email
verified*).

### Mail

Not set up yet, so there are no password-reset or verification emails
([#3](https://github.com/jurrebuunk/hgd1-k8s/issues/3),
[#4](https://github.com/jurrebuunk/hgd1-k8s/issues/4)): an admin sets new
passwords.

## Configuration

| File | Owns |
| --- | --- |
| `infrastructure/keycloak-operator/` | The operator and its CRDs |
| `platform/keycloak/keycloak.yaml` | Keycloak: instances, hostname, theme |
| `platform/keycloak/root-redirect.yaml`, `root-redirect.conf` | Two small redirect pods: public `/` → account console, never the private admin URL |
| `platform/keycloak/database.yaml` | `keycloak-db` |
| `platform/keycloak/theme/` | Flatwork React source and generated Keycloak templates ([build, preview and deploy](https://github.com/jurrebuunk/hgd1-k8s/tree/main/platform/keycloak/theme#readme)) |
| `platform/keycloak/bootstrap-*.sops.yaml` | First admin and keycloak-config-cli's login |
| `platform/keycloak-realm/hgd1.yaml`, `master.yaml` | The realms, including the apps' clients and roles |
| `platform/keycloak-realm/client-*.sops.yaml` | The apps' client secrets |

## Operating

**Direct access:** open <https://auth.buunk.org/>. The tunnel sends only the
exact root to a fixed, non-cacheable 302 redirect to
`https://auth.buunk.org/realms/hgd1/account/`; logged-out visitors see the login
theme, logged-in visitors reach their account. All other realm traffic still
goes straight to Keycloak. Its admin hostname remains `http://localhost:8080`
for port-forward access; do not make it public to fix a root redirect.

When introducing this route, deploy and verify the redirect Service in
`platform` before enabling its tunnel route in `infrastructure`, so traffic
never points to a missing backend. Later config changes roll its hashed
ConfigMap automatically. Check `curl -I https://auth.buunk.org/` for the account
Location, then verify `/admin/` and `/realms/master/` still return 404.

**Theme changes:** edit `platform/keycloak/theme/src/`, then run `npm ci`,
`npm run typecheck`, `npm run build` and `npm test` from the theme directory.
Commit source and generated assets together and deploy through Flux as in
[Your first change](../get-started/first-change.md), reconciling `platform`.
The hashed theme ConfigMap rolls both pods automatically. The theme README
also describes a disposable Keycloak preview and real browser/OTP/reset tests.
No realm settings are changed by the theme: reset stays hidden until SMTP and
`resetPasswordAllowed` are configured; registration, providers and locale
switching also reflect actual realm configuration.

**Admin console:**

```sh
kubectl -n keycloak port-forward svc/keycloak-service 8080
```

Then <http://localhost:8080/admin/>, port 8080 exactly. Log in with your own
admin account in `master`.

**First time only:** Keycloak starts with `temp-admin`, whose password is a
generated sops Secret:

```sh
kubectl -n keycloak get secret keycloak-bootstrap-admin -o jsonpath='{.data.password}' | base64 -d; echo
```

Make your own admin in `master` (role `admin`), log in with it, and delete
`temp-admin`.

**Adding a person:** realm `hgd1` → Users → Add user, then Credentials (a
temporary password) and Groups.

## Troubleshooting

See [Troubleshooting → Keycloak](../operate/troubleshooting.md#keycloak).

## Tested

288 of 288 requests answered while a node with a Keycloak pod and a
database server restarted; a restore from S3 had both realms and the three
groups.

## Related

- [Public access](public-access.md) · [Postgres](postgres.md) · [Build an app](../how-to/build-an-app.md#logins)
