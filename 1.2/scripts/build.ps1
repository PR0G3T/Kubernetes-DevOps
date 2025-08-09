param(
  [string]$Tag = "1.2"
)

docker build -t todo-app:$Tag .
