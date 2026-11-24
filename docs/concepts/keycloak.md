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
| Keycloak | 2 pods in different zones, namespace `keycloak` (`platform/keycloak/`) |
| Database | `keycloak-db`, its own Postgres with 3 servers, backed up like every [cluster](postgres.md) |
| Realm `hgd1` | From Git (`platform/keycloak-realm/hgd1.yaml`), applied by keycloak-config-cli on every change: settings, brute-force protection, password policy, groups `admins`, `family`, `friends` |
| Realm `master` | Only for administrators; its address is `http://localhost:8080` (`master.yaml`), so it only works through the port-forward |
| Public | Through the [tunnel](public-access.md); `/admin` and `/realms/master` answer 404 there |
| Theme | `flatwork` (`platform/keycloak/theme/`): the flatwork-saas design language, dark by default, light from the system |

## What lives where

| In Git (reviewed, with the app) | In the admin console |
| --- | --- |
| Realm settings, an app's client (ID, redirect addresses, roles), which group gets which role | People: accounts and which groups they're in |

There are no people in Git. An app's client is added to
`platform/keycloak-realm/hgd1.yaml` in the same change that publishes the
app; its secret as a sops Secret.

## The admin console

```sh
kubectl -n keycloak port-forward svc/keycloak-service 8080
```

Then <http://localhost:8080/admin/>, port 8080 exactly (the `master` realm's
address). Log in with your own admin account in `master`.

**First time only:** Keycloak starts with `temp-admin`, whose password is a
generated sops Secret:

```sh
kubectl -n keycloak get secret keycloak-bootstrap-admin -o jsonpath='{.data.password}' | base64 -d; echo
```

Make your own admin in `master` (role `admin`), log in with it, and delete
`temp-admin`. keycloak-config-cli uses its own machine login, not this one.

## Adding a person

Admin console → realm `hgd1` → Users → Add user, then Credentials (a
temporary password) and Groups. Mail isn't set up yet, so there are no
password-reset or verification emails
([#3](https://github.com/jurrebuunk/hgd1-k8s/issues/3),
[#4](https://github.com/jurrebuunk/hgd1-k8s/issues/4)): an admin sets new
passwords.

## Connecting an app

| Setting | Value |
| --- | --- |
| Issuer / discovery | `https://auth.buunk.org/realms/hgd1` (`/.well-known/openid-configuration`) |
| Client | One per app, in `hgd1.yaml`, confidential, standard flow |
| Redirect URI | The app's callback on its public hostname |
| Permissions | The app reads groups or roles from the token; check that it can |

Cloudreve can't use it yet: OIDC is a Pro feature there
([hgd1-cloudreve#1](https://github.com/jurrebuunk/hgd1-cloudreve/issues/1)).

## Tested

288 of 288 requests answered while a node with a Keycloak pod and a
database server restarted; a restore from S3 had both realms and the three
groups.

## Related

- [Public access](public-access.md) · [Postgres](postgres.md) · [Build an app](../how-to/build-an-app.md#logins)
