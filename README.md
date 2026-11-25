# hgd1-k8s

The base components of the hgd1 k3s cluster (nodes `hgd1-k8m01..03` and
`hgd1-k8w01..02`), managed with GitOps, so apps can be deployed easily on top.
The nodes themselves are built by
[nix-hgd1-cluster](https://github.com/jurrebuunk/nix-hgd1-cluster).

**Status:** Flux runs and applies this repo (`clusters/hgd1`): public apps
through a tunnel, internal apps over WARP, Postgres, Keycloak, monitoring;
what's next is in [PLAN.md](PLAN.md). Docs: https://jurrebuunk.github.io/hgd1-k8s/

```sh
warp-cli vnet 84c40b26-4fac-4131-a48a-9db3ca63267c   # WARP on hgd1-admin: the site
export KUBECONFIG=~/.kube/hgd1.yaml        # from nix-hgd1-cluster: kubeconfig
flux get kustomizations                    # infrastructure → config → platform → apps, Ready?
flux reconcile kustomization apps --with-source   # apply the latest commit now
```

Secrets are sops files (`*.sops.yaml`), encrypted for the cluster's age key
and mine; edit one with
`SOPS_AGE_KEY_CMD="ssh-to-age -private-key -i ~/.ssh/id_ed25519" sops <file>`.
