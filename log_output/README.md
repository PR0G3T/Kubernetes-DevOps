## Log output app

### Run locally

```bash
node index.js
```

### Build image

```bash
docker build -t pr0g3t/log-output:1.1 ./
```

### Kubernetes deploy

```bash
kubectl apply -f manifest/
kubectl logs deploy/log-output -f
```