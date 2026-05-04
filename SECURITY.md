# Security Policy

StructureX is a portfolio/demo infrastructure intelligence project. Security reports are welcome and should be handled responsibly.

## Do Not Publicly Disclose Active Vulnerabilities

If you find a vulnerability, do not open a public issue with exploit details, secrets, private data, or instructions that could harm users or infrastructure owners. Contact the maintainer privately through GitHub profile contact methods where available.

## In Scope

- authentication/session handling in the demo frontend
- serverless API route behavior
- accidental exposure of secrets or sensitive files
- unsafe data handling in upload, analysis, or map workflows
- repository configuration issues that could expose private data

## Out of Scope

- denial-of-service testing
- social engineering
- physical attacks
- spam, phishing, or credential attacks
- attacks against third-party services such as Vercel, MapTiler, Open-Meteo, Google, or CDN providers
- automated scanning that disrupts the live deployment

## Safe Testing Rules

- Use only test accounts and non-sensitive synthetic data.
- Do not access, modify, delete, or exfiltrate data that is not yours.
- Do not bypass rate limits or deployment protection except on your own authorized fork.
- Stop testing immediately if you encounter private data, secrets, or service instability.

## Secrets and Sensitive Data

Never commit API keys, credentials, private infrastructure data, production datasets, personal data, or emergency plans. If a secret is exposed, rotate it immediately and remove it from future history where practical.

## Engineering Safety

Security issues that could produce unsafe infrastructure conclusions, falsified risk scores, misleading emergency guidance, or unauthorized critical-infrastructure disclosure should be treated as high severity.
