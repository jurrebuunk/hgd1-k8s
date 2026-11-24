---
icon: lucide/git-commit-horizontal
---

# Your first change

A guided first change: add a harmless label, push it, and watch Flux apply
it. It shows the loop you'll use for
every change: **edit, push, Flux applies, check**.

**Before you start:** [access](access.md) works and `flux get
kustomizations` is all `Ready`.

## 1. Make the change

Any small, harmless change works. For example, add a label to the
cloudflared Deployment in `infrastructure/cloudflared/deployment.yaml`:

```yaml
metadata:
  labels:
    hgd1.buunk.org/first-change: "yes"
```

## 2. Check it builds

```sh
kustomize build infrastructure/cloudflared >/dev/null && echo ok
```

(For an app repo: `cp -r ../hgd1-k8s/components . && kustomize build deploy`.)

## 3. Push

```sh
git commit -am "First change: a label on cloudflared"
git push
```

## 4. Watch Flux apply it

```sh
flux reconcile kustomization infrastructure --with-source   # or wait a few minutes
flux get kustomizations
kubectl -n cloudflared get deploy cloudflared --show-labels
```

The label is there, and `infrastructure` shows your commit as its applied
revision.

## 5. Undo it

Remove the label, commit, push. Flux removes it from the cluster too:
everything in Git is the truth, including deletions (`prune: true`).

!!! warning "Never `kubectl apply` or `kubectl edit` what Flux owns"

    Flux puts it back within minutes. To experiment by hand, `flux suspend
    kustomization <name>` first and `flux resume` after.
