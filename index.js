const express = require('express')
const client = require('prom-client')
const { getTLSSecrets } = require ('./k8sClient')
const { parseCert } = require('./certParser')
// process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; 
const app = express()
app.use(express.json())

const register = new client.Registry()
client.collectDefaultMetrics({ register })

const certExpiryGauge = new client.Gauge({
    name: 'k8s_tls_cert_days_remaining',
    help: 'Days remaining until the TLS certificate expires',
    labelNames: ['namespace', 'secret_name', 'issuer', 'subject'],
})
register.registerMetric(certExpiryGauge)

async function updateMetrics() {
    const secrets = await getTLSSecrets()
    for (const secret of secrets) {
        try {
            const certInfo = parseCert(secret.data['tls.crt'])
            certExpiryGauge.set({
                namespace: secret.metadata.namespace,
                secret_name: secret.metadata.name,
                issuer: certInfo.issuer,
                subject: certInfo.subject,
            }, certInfo.days_remaining)
        } catch (err) {
            console.error(`Failed to parse cert from ${secret.metadata.namespace}/${secret.metadata.name}`, err)
        }
    }
}

setInterval(updateMetrics, 10 * 60 * 1000)
updateMetrics()

app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType)
    res.end(await register.metrics())
})

const port = process.env.PORT || 9101
app.listen(port, '0.0.0.0', () => console.log(`x509 exporter on ${port}`))