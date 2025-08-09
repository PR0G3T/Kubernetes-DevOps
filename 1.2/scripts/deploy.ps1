param(
  [string]$Image = "todo-app:1.2"
)

kubectl apply -f k8s/deployment.yaml | Out-Null
kubectl set image deployment/todo-app todo-app=$Image --record | Out-Null
kubectl rollout status deployment/todo-app
