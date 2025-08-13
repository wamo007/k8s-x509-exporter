# Kubernetes x509 Certificate Exporter (Node.js)

A lightweight **Prometheus exporter** that scans Kubernetes Secrets of type `kubernetes.io/tls`, parses their `tls.crt` certificates, and exposes metrics such as the number of days until expiration.

## Features
- Lists TLS secrets across all namespaces
- Parses X.509 certificates to extract:
  - Issuer
  - Subject
  - Expiry date
  - Days remaining until expiry
- Exposes Prometheus metrics on `/metrics`
- Docker-ready deployment

## How It Works
The exporter:
1. Connects to the Kubernetes API using a kubeconfig file or in-cluster ServiceAccount.
2. Lists all secrets and filters by `type: kubernetes.io/tls`.
3. Decodes `data["tls.crt"]` and parses it with [node-forge](https://github.com/digitalbazaar/forge).
4. Pushes metrics to a Prometheus registry.

## Metrics Exposed

| Metric | Description | Labels |
| ------ | ----------- | ------ |
| `k8s_tls_cert_days_remaining` | Days until TLS certificate expires | `namespace`, `secret_name`, `issuer`, `subject` |

Example output:
```
# HELP k8s_tls_cert_days_remaining Days remaining until the TLS certificate expires
# TYPE k8s_tls_cert_days_remaining gauge
k8s_tls_cert_days_remaining{namespace="default",secret_name="my-tls",issuer="CN=Let's Encrypt",subject="CN=my.example.com"} 25
```

## Requirements
- Node.js 18+ (if running locally)
- Kubernetes cluster access
- Prometheus (to scrape metrics)
- Docker (if running containerized)

## Running Locally

```bash
# Install dependencies
npm install

# Point to your kubeconfig
export KUBECONFIG=$HOME/.kube/config

# Start the exporter
npm start
```

Metrics will be available at:
```
http://localhost:9101/metrics
```

## License
MIT