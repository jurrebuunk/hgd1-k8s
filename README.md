# hgd1-k8s

The base components of the hgd1 k3s cluster (nodes `hgd1-k8m01..03` and
`hgd1-k8w01..02`), managed with GitOps, so apps can be deployed easily on top.
The nodes themselves are built by
[nix-hgd1-cluster](https://github.com/jurrebuunk/nix-hgd1-cluster).

**Status:** Flux runs and applies this repo (`clusters/hgd1`); the
components come step by step, see [PLAN.md](PLAN.md).

```sh
export KUBECONFIG=~/.kube/hgd1.yaml        # from nix-hgd1-cluster: kubeconfig
flux get kustomizations                    # infrastructure → config → apps, Ready?
flux reconcile kustomization apps --with-source   # apply the latest commit now
```

Secrets are sops files (`*.sops.yaml`), encrypted for the cluster's age key
and mine; edit one with
`SOPS_AGE_KEY_CMD="ssh-to-age -private-key -i ~/.ssh/id_ed25519" sops <file>`.
