## The Project (todo app)

### Run locally

```bash
PORT=3000 node todo-app/index.js
```

### Build image

```bash
docker build -t pr0g3t/todo-app:1.2 ./todo-app
```

### Kubernetes deploy

```bash
kubectl apply -f todo-app/manifests/
```


