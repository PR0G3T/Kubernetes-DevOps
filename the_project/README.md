# Project - DBaaS vs DIY (Self-managed DB on Kubernetes)

## Summary
- **DBaaS**: Fast to start, managed SRE/on-call by provider, built-in HA/backup, higher recurring cost, less cluster control needed.
- **DIY on Kubernetes**: Lowest infra cost, full control and portability, but higher operational burden (ops toil), you own HA/backup/security, and upgrades.

## Initialization effort
- **DBaaS**
  - Pros: Minutes to provision; single command/API; built-in secure defaults (TLS, auth); network egress only from cluster.
  - Cons: Requires cloud account, IAM/service binding; VPC peering/private service connect setup may be needed for private access.
- **DIY (StatefulSet + operator)**
  - Pros: Works in any Kubernetes; can tailor storage classes, topology, resources.
  - Cons: Authoring manifests/operator CRDs; storage sizing/provisioning; headless Service, readiness, anti-affinity, PodDisruptionBudget.

## Cost model
- **DBaaS**
  - Pros: Clear, usage-based pricing; provider absorbs HA/storage/backup infra costs.
  - Cons: Higher monthly bill; egress charges for cross-zone/region; limited rightsizing levers beyond instance tiers.
- **DIY**
  - Pros: Pay only for cluster resources and persistent volumes; can use spot/preemptible nodes for lower cost; reuse existing logging/monitoring.
  - Cons: Ops time cost (SRE/dev time); extra storage classes/replication might negate savings; hidden costs during incidents and upgrades.

## Maintenance and operations
- **DBaaS**
  - Pros: Managed upgrades/patching; automated failover; built-in metrics/dashboards; support SLAs; easy snapshots/point-in-time restore (PITR).
  - Cons: Maintenance windows controlled by provider; version constraints; less tuning access; vendor-specific capabilities.
- **DIY**
  - Pros: Full control over versioning/upgrade cadence; fine-tuned config; portability across clouds/on-prem.
  - Cons: You own backup/restore drills, monitoring, alerting, disaster recovery docs, security hardening, incident response and capacity planning.

## Backups and restore
- **DBaaS**
  - Pros: Turnkey backups (scheduled snapshots, PITR); one-click restore to new instance; lifecycle retention policies.
  - Cons: Cross-region backups may add cost; restore timelines bounded by provider.
- **DIY**
  - Pros: Flexible tooling (Velero, operator-native backups, pgBackRest/xtrabackup); custom retention/encryption.
  - Cons: You must automate schedules, test restores regularly, store credentials and keys safely, and document runbooks.

## Security and compliance
- **DBaaS**
  - Pros: Built-in encryption at rest/in transit, IAM integration, audit features, compliance certs (SOC2/ISO/PCI) from provider.
  - Cons: Shared responsibility still applies; advanced features may be paid tiers; data residency tied to available regions.
- **DIY**
  - Pros: Choose exact ciphers/policies; isolate in private clusters; bring-your-own HSM/KMS; full audit control.
  - Cons: Must implement secrets management, TLS rotation, RBAC/NetworkPolicies, vulnerability patching, and compliance evidence.

## Availability, scaling, performance
- **DBaaS**
  - Pros: Easy HA (multi-AZ), read replicas, auto-failover; vertical/horizontal scaling flows; built-in observability.
  - Cons: Hard limits per plan; noisy neighbor risk on shared tiers; replica lag control limited.
- **DIY**
  - Pros: Tailor topology (sharding, synchronous replicas), storage IOPS classes, node pools with CPU/memory/io optimized shapes.
  - Cons: Complex failover; split brain prevention; tuning replication; more SRE playbooks.

## When to pick which
- **Choose DBaaS**: Small/medium teams, need fast time-to-market, strict uptime/compliance needs, limited DB expertise.
- **Choose DIY**: Strong platform team, portability or on-prem requirement, specialized tuning, strict cost control at scale.

## Practical note for this project
- Current exercises show DIY Postgres via StatefulSet for learning. For production, consider a DBaaS (e.g., Cloud SQL/Aurora) or a mature operator with tested backup/restore and SLOs.
