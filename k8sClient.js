// k8sClient.js
const k8s = require('@kubernetes/client-node');
const fs = require('fs');
const path = process.env.KUBECONFIG || `/root/.kube/config`;

function loadKubeConfig() {
  
  const kc = new k8s.KubeConfig();

  if (fs.existsSync(path)) {
    kc.loadFromFile(path)

    const cluster = kc.getCurrentCluster();
    if (!cluster) {
      throw new Error('No current context/cluster is set in kubeconfig');
    }

    if (cluster.server.startsWith('http://') && !cluster.skipTLSVerify) {
      cluster.skipTLSVerify = true;
    }

    return kc;
  } else {
    console.warn('Config file not found')
    return null;
  }
}

const kc = loadKubeConfig();
const k8sApi = kc ? kc.makeApiClient(k8s.CoreV1Api) : null;

async function getTLSSecrets() {
  if (!k8sApi) {
    console.warn('[k8sClient] Skipping TLS secrets retrieval – no kubeconfig loaded.');
    return [];
  }

  try {
    const body = await k8sApi.listSecretForAllNamespaces();
    const items = body?.items ?? [];
    return items.filter(s => s?.type === 'kubernetes.io/tls' && s?.data?.['tls.crt']);
  } catch (err) {
    if (err?.response) {
      console.warn('[k8sClient] K8s API error:', err.response.statusCode, err.response.statusMessage);
      try { console.warn('[k8sClient] Details:', err.response.body); } catch {}
    } else {
      console.warn('[k8sClient] Unexpected error:', err?.message || err);
    }
    throw err;
  }
}

module.exports = { getTLSSecrets };