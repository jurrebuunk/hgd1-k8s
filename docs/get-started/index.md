---
icon: lucide/rocket
---

# Get started

Three short steps take you from nothing to a change on the cluster. Do them
in order the first time.

<div class="grid cards" markdown>

-   :lucide-log-in:{ .lg .middle } **1. Get access**

    ---

    A kubeconfig, the `flux` CLI and the sops key.

    [:octicons-arrow-right-24: Get access](access.md)

-   :lucide-git-commit-horizontal:{ .lg .middle } **2. Your first change**

    ---

    Change something small, push it, and watch Flux apply it.

    [:octicons-arrow-right-24: First change](first-change.md)

-   :lucide-folder-git-2:{ .lg .middle } **3. Tour of the repo**

    ---

    Where everything is, and the conventions to follow.

    [:octicons-arrow-right-24: Repository](repository.md)

</div>

## What you need

- WARP connected (or a cable into the site network): the Kubernetes API is
  only on the LAN.
- The `nix-hgd1-cluster` dev shell for `kubeconfig`, `kubectl`, `flux`,
  `sops` and `ssh-to-age`, or those tools from anywhere else.
- Push access to [`hgd1-k8s`](https://github.com/jurrebuunk/hgd1-k8s) (and the
  app repo you work on).
- Your SSH key `~/.ssh/id_ed25519` listed in `.sops.yaml` (through
  `ssh-to-age`), to edit secrets.

## Then read

- [GitOps](../concepts/gitops.md): how Flux applies this repo, once.
- [Health check](../operate/index.md): the check you'll run most.
