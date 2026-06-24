# Deploying The Brew Lab to Google Cloud

## Read this first — what you can deploy today
The backend currently runs in the **`demo` profile**: in-memory data, mock
Cognito/Razorpay, in-memory event bus. Deploying now gives you a **live, hosted
demo** — a real running API with Swagger and the KDS WebSocket, reachable over the
internet — **not** a production system. Real persistence/auth/payments arrive with
milestones M1–M4 (`live` profile). Everything below is safe to run today; the
"path to production" is in §8.

## Target architecture on GCP (region: `asia-south1` / Mumbai, for DPDP)
| Component | GCP service (now) | Notes |
| --- | --- | --- |
| `brew-backend` (NestJS container) | **Cloud Run** | scales to zero; pay-per-request |
| POS / Admin / Flutter web (static) | **Firebase Hosting** (or keep GitHub Pages) | demo mode needs no backend |
| KOT print agent | runs **in-store**, not in cloud | polls the backend |
| (prod, later) Postgres / Redis / objects / events / auth | Cloud SQL / Memorystore / Cloud Storage / Pub/Sub / Identity Platform | M1–M4 |

---

## 0. Prerequisites
- Install the **gcloud CLI** and run `gcloud init` (sign in, pick your project).
- **Billing enabled** on the project.
- Have **Docker** only if you want to build locally; otherwise Cloud Build does it.
- Note your **PROJECT_ID** (`gcloud config get-value project`).

## 1. Select the project & enable APIs
```bash
gcloud config set project YOUR_PROJECT_ID
gcloud config set run/region asia-south1
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com
```

## 2. Create an Artifact Registry repo (one-time)
```bash
gcloud artifacts repositories create brew \
  --repository-format=docker \
  --location=asia-south1 \
  --description="The Brew Lab images"
```

## 3. Build & deploy the backend (one command)
From the **repo root** (the config handles the monorepo Docker build context):
```bash
gcloud builds submit --config cloudbuild.yaml \
  --substitutions=_REGION=asia-south1,_REPO=brew,_SERVICE=brew-backend,_PROFILE=demo,_TAG=latest
```
This builds the image, pushes it to Artifact Registry, and deploys to Cloud Run
(`--allow-unauthenticated`, scale-to-zero). The output ends with a **Service URL**.

> First run may prompt to grant the Cloud Build service account the Cloud Run
> Admin + Service Account User roles — accept, or grant them once in the console.

## 4. Verify it's live
```bash
SERVICE_URL=$(gcloud run services describe brew-backend --region asia-south1 --format='value(status.url)')
echo "$SERVICE_URL"
# Open the API docs in a browser:
echo "$SERVICE_URL/docs"
# Smoke-test an endpoint (dev auth accepts any bearer token):
curl -s -H "Authorization: Bearer demo" "$SERVICE_URL/v1/stores/store_1/menu" | head
```
You can also point the §12 demo script at it:
```bash
BREW_API="$SERVICE_URL" node scripts/demo-flow.mjs
```

## 5. (Optional) Deploy the web apps
The POS/Admin/Flutter web apps run **self-contained in demo mode** and need no
backend — the simplest hosting is the existing GitHub Pages demo. To instead point
them at your Cloud Run backend (note: full live wiring is milestone M7, so many
flows are still mocked server-side):
```bash
# POS, pointed at the live API:
VITE_DEMO=false VITE_API_BASE_URL="$SERVICE_URL" pnpm --filter brew-pos-web build
# Flutter web:
flutter build web --dart-define=apiBaseUrl="$SERVICE_URL"
```
Then host the built `dist/` (POS/Admin) or `build/web` (Flutter) on **Firebase
Hosting**:
```bash
npm i -g firebase-tools && firebase login
firebase init hosting        # point public dir at the built output
firebase deploy --only hosting
```

## 6. Security note (demo is public)
In the `demo` profile the auth guard accepts **any** bearer token, so an
`--allow-unauthenticated` service is an open API. That's fine for a throwaway demo
with no real data — **do not put real PII in it**. For a private demo, redeploy
with `--no-allow-unauthenticated` and reach it via
`gcloud run services proxy brew-backend --region asia-south1`, or grant specific
identities the `roles/run.invoker` role.

## 7. (Optional) Automated CD with GitHub Actions — keyless (WIF)
`.github/workflows/deploy-gcp.yml` deploys on push to `main` using **Workload
Identity Federation** (no service-account keys in GitHub). One-time setup:
```bash
PROJECT_ID=$(gcloud config get-value project)
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')

# Deploy service account + roles
gcloud iam service-accounts create brew-deployer --display-name="GitHub deployer"
SA="brew-deployer@${PROJECT_ID}.iam.gserviceaccount.com"
for ROLE in roles/run.admin roles/cloudbuild.builds.editor \
            roles/artifactregistry.writer roles/iam.serviceAccountUser \
            roles/storage.admin; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:$SA" --role="$ROLE"
done

# WIF pool + provider trusting this GitHub repo
gcloud iam workload-identity-pools create github --location=global --display-name="GitHub"
gcloud iam workload-identity-pools providers create-oidc github \
  --location=global --workload-identity-pool=github \
  --display-name="GitHub OIDC" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository=='abhilashyes/cafe-system'"
gcloud iam service-accounts add-iam-policy-binding "$SA" \
  --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github/attribute.repository/abhilashyes/cafe-system"
```
Then set these **GitHub repository variables** (Settings → Secrets and variables →
Actions → Variables):
- `GCP_PROJECT_ID` = your project id
- `GCP_DEPLOY_SA` = `brew-deployer@<project>.iam.gserviceaccount.com`
- `GCP_WIF_PROVIDER` = `projects/<PROJECT_NUMBER>/locations/global/workloadIdentityPools/github/providers/github`

The workflow is a no-op until `GCP_PROJECT_ID` is set, so it's safe to merge now.

## 8. Path to production (later milestones)
Switching the deployed service to `BREW_PROFILE=live` requires the real backends,
which land milestone by milestone — each is added behind the existing ports, so
the demo keeps working throughout:
| Milestone | Adds on GCP |
| --- | --- |
| **M1** | Cloud SQL (PostgreSQL) + Memorystore (Redis) + Firestore (cart/session) |
| **M2** | Identity Platform / Firebase Auth (phone OTP, MFA) — replaces Cognito mock |
| **M3** | Pub/Sub event transport — replaces in-memory bus |
| **M4** | Razorpay live keys in **Secret Manager** |
| **M8** | Terraform retargeted to GCP, Cloud Logging/Monitoring/Trace, budgets/alerts |

For production you'd also: front Cloud Run with a custom domain + Google-managed
TLS, put **Cloud Armor** (WAF) on it, set `--min-instances=1` to avoid cold
starts, and connect Cloud SQL via the built-in connector.
