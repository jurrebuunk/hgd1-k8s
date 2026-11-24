---
icon: lucide/lock-keyhole
---

# Manage secrets

Secrets for the cluster are **sops** files (`*.sops.yaml`): ordinary
Kubernetes Secrets whose `data`/`stringData` values are encrypted with age,
for two keys. Flux decrypts them when it applies them; the cluster never
sees them in plain text in Git.

| Key | Who | Where |
| --- | --- | --- |
| Cluster key | Flux | Secret `flux-system/sops-age`, put there once by hand; admin-only backup in `nix-hgd1-cluster` as `secrets/flux-sops-age.age` |
| My key | Me, to edit | Derived from `~/.ssh/id_ed25519` (`ssh-to-age`) |

Both public keys are in `.sops.yaml`, in this repo and in every app repo.

!!! cluster "On the cluster docs: credentials"

    Every other credential (agenix secrets on the hosts, keys on the
    laptop, the password manager), and where each one lives.

    [Credentials](https://jurrebuunk.github.io/nix-hgd1-cluster/reference/credentials/){ .md-button }

## Before you start

```sh
export SOPS_AGE_KEY_CMD="ssh-to-age -private-key -i ~/.ssh/id_ed25519"
```

`sops` and `ssh-to-age` are in the `nix-hgd1-cluster` dev shell, or
`nix shell nixpkgs#sops nixpkgs#ssh-to-age`.

## Edit a secret

```sh
sops infrastructure/cloudflared/credentials.sops.yaml   # opens $EDITOR, re-encrypts on save
```

Commit and push; Flux applies it.

## Add a secret

Write the Secret, encrypted before it ever touches the disk unencrypted
for long:

```sh
kubectl create secret generic notes-s3 -n notes \
  --from-literal=access-key="$KEY" --from-literal=secret-key="$SECRET" \
  --dry-run=client -o yaml > deploy/s3-key.sops.yaml
sops -e -i deploy/s3-key.sops.yaml
```

Then add the file to the folder's `kustomization.yaml`. Generated values
(`openssl rand -hex 32 | …`) are piped straight in, so they never appear on
screen.

An app repo needs its own `.sops.yaml` with the same two keys (copy it from
[hgd1-cloudreve](https://github.com/jurrebuunk/hgd1-cloudreve/blob/main/.sops.yaml)),
and `decryption` in its pointer file in `apps/`.

## Secrets in `components/`

Kustomize gives a component's Secret each app's namespace, which changes the
file. Files under `components/` are therefore encrypted with
`mac_only_encrypted`, so their integrity check covers only the encrypted
values (the first rule in `.sops.yaml`).

## Rotate

Generate a new value, `sops` the file, push. Pods read a Secret at start, so
restart the ones using it (`kubectl rollout restart deploy/<name> -n <ns>`).
For S3 keys: `labctl s3 user rotate-keys <user> --out <file>` gives a new
key and removes the old one at once, so the app is down until the Secret is
updated and its pods restarted; do both right after. Delete `<file>` when
it's in the Secret.

## Never in Git

- Plain-text values, even briefly in a commit that's reverted later.
- People's accounts or passwords: they're made in [Keycloak](../concepts/keycloak.md).
- The kubeconfig (cluster admin).
