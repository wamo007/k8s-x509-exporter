const k8s = require('@kubernetes/client-node');

function loadKubeConfig() {
  const path = process.env.KUBECONFIG || `/root/.kube/config`;
  const kc = new k8s.KubeConfig();

  // EITHER load specific file…
  kc.loadFromFile(path);
  // …OR use defaults:
  // kc.loadFromDefault();

  // If the cluster URL is http://, the client requires skipTLSVerify=true.
  const cluster = kc.getCurrentCluster();
  if (!cluster) {
    throw new Error('No current context/cluster is set in kubeconfig');
  }

  if (cluster.server.startsWith('http://') && !cluster.skipTLSVerify) {
    // Dev-only: explicitly allow insecure HTTP to avoid the error.
    // Prefer fixing kubeconfig to use HTTPS.
    cluster.skipTLSVerify = true;
  }

  return kc;
}

const kc = loadKubeConfig();
const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

async function getTLSSecrets() {
try {
    const body = await k8sApi.listSecretForAllNamespaces();
    const items = body?.items ?? [];
    return items.filter(s => s?.type === 'kubernetes.io/tls' && s?.data?.['tls.crt']);
  } catch (err) {
    // Surface useful details
    if (err.response) {
      console.error('K8s API error:', err.response.statusCode, err.response.statusMessage);
      try { console.error('Details:', err.response.body); } catch {}
    } else {
      console.error('Unexpected error:', err);
    }
    throw err;
  }
}

module.exports = { getTLSSecrets };