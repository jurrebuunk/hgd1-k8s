# Egress components

What pods in a namespace may connect to. Without a policy a pod reaches
the whole site (`10.10.0.0/16`: metrics, logs, kubelets, …); with
`default` it reaches only the cluster and the internet, and the others add
one thing each. Use them from a kustomization that sets `namespace:`:

    components:
      - ../components/egress/default   # every namespace with pods
      - ../components/egress/s3        # if it talks to s3.lan.buunk.org
      - ../components/egress/kube-api  # if it talks to the Kubernetes API

NetworkPolicies add up: a pod may connect wherever any policy that selects
it allows. Postgres pods get their own (`components/postgres`).
