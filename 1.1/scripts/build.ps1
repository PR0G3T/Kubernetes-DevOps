param(
  [string]$Tag = "1.1"
)

npm install --no-audit --no-fund

docker build -t log-output:$Tag .
