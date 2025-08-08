param(
  [string]$Image = "log-output:1.1"
)

kubectl apply -f k8s/deployment.yaml | Out-Null
kubectl set image deployment/log-output log-output=$Image --record | Out-Null
kubectl rollout status deployment/log-output
