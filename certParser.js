const forge = require('node-forge')

function parseCert(certBase64) {
    const pem = Buffer.from(certBase64, 'base64').toString()
    const cert = forge.pki.certificateFromPem(pem)
    return {
        issuer: cert.issuer.attributes.map(attr => `${attr.name}=${attr.value}`).join(', '),
        subject: cert.subject.attributes.map(attr => `${attr.name}=${attr.value}`).join(', '),
        valid_from: cert.validity.notBefore,
        valid_to: cert.validity.notAfter,
        days_remaining: Math.floor((cert.validity.notAfter - new Date()) / (1000 * 60 * 60 * 24)),
    };
}

module.exports = { parseCert };