# Remote smoke test report

## Scope

Validate the deployed environment at the actual public URLs instead of relying on local-only success.

- Frontend: https://jamie-s-m.github.io/LLP/
- Backend: https://language-learn-platform-api.onrender.com

## Commands executed

```powershell
Invoke-WebRequest -Uri 'https://language-learn-platform-api.onrender.com/api/health' -UseBasicParsing
Invoke-WebRequest -Uri 'https://jamie-s-m.github.io/LLP/' -UseBasicParsing
Invoke-WebRequest -Uri 'https://language-learn-platform-api.onrender.com/api/courses' -UseBasicParsing
```

## Results

### GET /api/health

Status: PASS

Response:

```json
{"success":true,"message":"API is running successfully"}
```

### Frontend load

Status: PASS

Evidence: the production page loads and returns the LinguaNest HTML shell with GitHub Pages asset references.

### GET /api/courses

Status: FAIL (content mismatch)

Evidence:

```json
{"success":true,"data":[{"_id":"6a86e4e3670d2c1d37d0fc67","title":"General English","description":"General English course dedicated for Essential English Grammar.","language":"English","level":"Beginner",...}]}
```

This returned a single public course rather than the expected seeded catalog. It proves the remote deployment is reachable, but the live database content is not yet aligned with the expected LinguaNest content library.

## Conclusion

The deployed environment passes the basic health and front-end reachability checks, but it does not yet satisfy the content and production readiness gate required for a green release.
