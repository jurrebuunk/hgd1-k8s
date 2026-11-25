---
icon: lucide/log-in
---

# Get access

Everything here goes through the Kubernetes API at
`https://k8s.lan.buunk.org:6443`, which is only reachable on the site
network or over WARP.

## 1. Kubeconfig

From the cluster repo's dev shell:

```sh
git clone https://github.com/jurrebuunk/nix-hgd1-cluster
cd nix-hgd1-cluster && nix develop
warp-cli connect
warp-cli vnet 84c40b26-4fac-4131-a48a-9db3ca63267c   # hgd1-admin: the site, kubectl
kubeconfig                         # writes ~/.kube/hgd1.yaml (cluster admin, mode 600)
export KUBECONFIG=~/.kube/hgd1.yaml
kubectl get nodes -L topology.kubernetes.io/zone
```

Five nodes `Ready`, each with a zone (its host). The kubeconfig is cluster
admin: never commit or share it.

!!! cluster "On the cluster docs: getting access"

    WARP enrolment, SSH to the hosts and VMs, and what `kubeconfig` does.

    [Get access](https://jurrebuunk.github.io/nix-hgd1-cluster/get-started/access/){ .md-button }

## 2. Flux

```sh
flux check                         # controllers healthy
flux get kustomizations            # every layer Ready
```

## 3. Secrets

To read or edit `*.sops.yaml` files:

```sh
export SOPS_AGE_KEY_CMD="ssh-to-age -private-key -i ~/.ssh/id_ed25519"
sops -d config/sops-test.sops.yaml   # decrypts: your key works
```

If it fails with "no key could decrypt", your key isn't in `.sops.yaml` yet:
add its age public key (`ssh-to-age < ~/.ssh/id_ed25519.pub`) and re-encrypt
every file (`sops updatekeys <file>`), from a machine whose key already
works.

## 4. Admin consoles

Not public; through a port-forward:

| Console | Command | Then |
| --- | --- | --- |
| Keycloak | `kubectl -n keycloak port-forward svc/keycloak-service 8080` | <http://localhost:8080/admin/> |
| Cloudreve | `kubectl -n cloudreve port-forward svc/cloudreve 5212:80` | <http://localhost:5212> (or just <https://cloudreve.buunk.org>) |
