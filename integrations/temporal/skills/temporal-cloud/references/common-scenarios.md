# Common Scenarios

Step-by-step walkthroughs for common Temporal Cloud setup and configuration tasks.

## API Key Connectivity

User is connecting to Temporal Cloud with an API key.

**Checklist:**
1. Use the full namespace name (`<name>.<account-id>`)
2. Use the Namespace Endpoint (`<ns>.<acct>.tmprl.cloud:7233`) for API-key-only Namespaces. For mixed-auth pre-release, use the regional endpoint supplied for API keys; verify the current Namespace configuration
3. Keep credentials in environment variables where possible
4. Verify with `temporal workflow list`

```bash
export TEMPORAL_NAMESPACE="my-ns.abc123"
export TEMPORAL_ADDRESS="my-ns.abc123.tmprl.cloud:7233"
export TEMPORAL_API_KEY="<api-key>"

temporal workflow list --limit 1 \
  --address "$TEMPORAL_ADDRESS" \
  --namespace "$TEMPORAL_NAMESPACE" \
  --api-key "$TEMPORAL_API_KEY"
```

## New Namespace Setup

User is setting up connection to a new namespace for the first time.

**Docs:** [Environment configuration](https://docs.temporal.io/develop/environment-configuration) - full SDK setup guide

**Checklist:**
1. Get namespace name (full format with account ID)
2. Generate or obtain certificates
3. Upload CA to namespace
4. Test connection with temporal CLI
5. Configure workers using [environment configuration docs](https://docs.temporal.io/develop/environment-configuration)

```bash
# 1. Verify namespace exists and get full name
tcld namespace list

# 2. Generate certs (if needed)
tcld generate-certificates certificate-authority-certificate \
  --organization mycompany \
  --validity-period 365d \
  --ca-certificate-file certs/ca.pem \
  --ca-key-file certs/ca.key
tcld generate-certificates end-entity-certificate \
  --organization mycompany \
  --validity-period 365d \
  --ca-certificate-file certs/ca.pem \
  --ca-key-file certs/ca.key \
  --certificate-file certs/client.pem \
  --key-file certs/client.key

# 3. Upload CA
tcld namespace accepted-client-ca add \
  --namespace my-ns.abc123 \
  --ca-certificate-file certs/ca.pem

# 4. Test connection
temporal workflow list --limit 1 \
  --address my-ns.abc123.tmprl.cloud:7233 \
  --namespace my-ns.abc123 \
  --tls-cert-path certs/client.pem \
  --tls-key-path certs/client.key
```

## Certificate Rotation

Rotate certs before expiry. If rotating CA, add new CA first, deploy new certs, then remove old CA.

```bash
# Check expiry
openssl x509 -enddate -noout -in client.pem

# Generate new leaf cert (same CA)
tcld generate-certificates end-entity-certificate \
  --organization mycompany \
  --validity-period 365d \
  --ca-certificate-file ca.pem \
  --ca-key-file ca.key \
  --certificate-file new-certs/client.pem \
  --key-file new-certs/client.key

# If rotating CA too:
# 1. Generate new CA
tcld generate-certificates certificate-authority-certificate \
  --organization mycompany \
  --validity-period 365d \
  --ca-certificate-file new-ca/ca.pem \
  --ca-key-file new-ca/ca.key

# 2. Add new CA to namespace (keep old one temporarily)
tcld namespace accepted-client-ca add \
  --namespace my-ns.abc123 \
  --ca-certificate-file new-ca/ca.pem

# 3. Deploy new certs to workers

# 4. Remove old CA
tcld namespace accepted-client-ca list --namespace my-ns.abc123
tcld namespace accepted-client-ca remove \
  --namespace my-ns.abc123 \
  --fp <old-ca-fingerprint>
```

## Switching from mTLS to API Keys

User wants to use API keys instead of certificates.

1. Inspect the Namespace authentication mode and confirm API-key support is enabled before changing clients. For mixed-auth pre-release, confirm access and the supported API-key endpoint; a new key alone does not change the Namespace's auth mode.
2. Create or reuse a service account with the minimum required role on the target Namespace. Verify those permissions separately from possession of an API key.
3. Inspect `tcld service-account create --help` and `tcld apikey create --help` for the installed version's required name, permission, and expiry flags. Create the key through the authorized secret-capture path; keep its value out of chat, argv, logs, and diffs.
4. Test the new identity and endpoint with a read-only Workflow list, then a representative permitted operation. The data-plane CLI can read `TEMPORAL_API_KEY` from a secure environment; `tcld` uses `TEMPORAL_CLOUD_API_KEY`.
5. Roll out the Worker configuration and verify polling and completion before retiring the old certificates. Preserve a rollback path until the new authentication path is verified.

Sources: [Namespace authentication and endpoints](https://docs.temporal.io/cloud/namespaces), [API keys and service accounts](https://docs.temporal.io/cloud/api-keys).
