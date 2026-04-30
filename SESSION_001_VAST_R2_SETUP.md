# Session 001 — Vast.ai + Cloudflare R2 Setup

**For:** Claude Code working in Cursor IDE
**Operator:** Scotch (Joshua McClure)
**Repo:** `/Users/joshuamcclure/Desktop/living-eamon`
**Master document:** `INFRASTRUCTURE.md` (Part 1)
**This session:** First execution of Part 1

---

## Current State (Before This Session)

- ✅ Civitai membership subscription cancelled (account preserved)
- ❌ Vast.ai account not yet created
- ❌ Cloudflare R2 bucket not yet created
- ❌ rclone not yet installed
- ❌ Vast.ai CLI not yet installed
- ❌ Dedicated SSH key for Vast.ai not yet created
- ❌ `.env.infrastructure` does not yet exist

## Goal of This Session

Complete all remaining items in Part 1 of `INFRASTRUCTURE.md` so that the next session (Session 002) can spin up a ComfyUI instance on Vast.ai for generation work.

**Out of scope for this session:**

- ❌ Spinning up any Vast.ai instance
- ❌ Generating any images
- ❌ Training any LoRA
- ❌ Curating the LoRA training dataset

This session is purely setup. No GPU time is rented. Total cost: $25 prepaid credit on Vast.ai (sits in account balance, unspent).

---

## Session Structure

This session has two distinct halves:

**Half 1 — Browser work** (Scotch does this; Claude Code waits)
**Half 2 — Terminal work** (Claude Code executes; Scotch verifies)

The handoff between halves is explicit. Claude Code does **not** proceed to Half 2 until Scotch confirms Half 1 is complete and provides the required credentials.

---

## HALF 1 — Browser Work (Scotch)

Claude Code: while Scotch is doing this, take no actions. Wait for explicit handoff.

### Step 1.A — Vast.ai Account Setup

1. Open https://vast.ai in browser
2. Click **Sign Up** (top right)
3. Register with email or Google SSO
4. Verify email if email signup
5. Once logged in, click **Billing** in left sidebar
6. Click **Add Credit**
7. Deposit **$25** via credit card
   - Vast.ai is infrastructure, not a content platform
   - Credit card processing here has no relationship to the Civitai/Visa adult-content issue
8. Confirm credit appears in account balance
9. Navigate to **Account** → **API Key**
10. Click **Generate API Key** (or **Show** if one exists)
11. **Copy the API key to a safe place** — needed in Half 2
12. Navigate to **Billing** → **Spending Limits** (or **Settings**)
13. Set daily spending alert: **$10**
14. Set monthly spending alert: **$100**
15. Save

**Important during signup:**

- Do not accept any "verified datacenter customer" tier upgrades
- Do not enroll in any special programs
- Take only the basic account tier

### Step 1.B — Cloudflare R2 Bucket Setup

1. If no Cloudflare account exists, sign up at https://cloudflare.com
2. In Cloudflare dashboard, navigate to **R2 Object Storage**
3. Enable R2 if prompted (requires payment method on file; Living Eamon's storage will likely fit the free tier)
4. Click **Create Bucket**
5. Bucket name: `living-eamon-art`
6. Location: **Automatic**
7. Click **Create Bucket**
8. Open the new bucket → **Settings** tab
9. Confirm **R2.dev subdomain** is **disabled** (no public access needed)
10. Return to R2 main page → **Manage R2 API Tokens**
11. Click **Create API Token**
12. Token name: `living-eamon-claude-code`
13. Permissions: **Object Read & Write**
14. Specify bucket: `living-eamon-art` (scoped, not account-wide)
15. TTL: leave as default
16. Click **Create API Token**
17. **Copy these four values immediately — they are shown only once:**
    - Access Key ID
    - Secret Access Key
    - Endpoint URL (format: `https://<account-id>.r2.cloudflarestorage.com`)
    - Account ID

### Handoff to Half 2

When Steps 1.A and 1.B are complete, Scotch provides Claude Code with the following five values:

```
VAST_API_KEY=<paste here>
R2_ACCESS_KEY_ID=<paste here>
R2_SECRET_ACCESS_KEY=<paste here>
R2_ENDPOINT=<paste here>
R2_ACCOUNT_ID=<paste here>
```

Claude Code does not proceed until all five are provided.

---

## HALF 2 — Terminal Work (Claude Code)

Claude Code executes the following phases in order. **After each phase, report results to Scotch and wait for "continue" before proceeding to the next phase.**

### Phase 2.1 — Create `.env.infrastructure` and update `.gitignore`

Working directory: `/Users/joshuamcclure/Desktop/living-eamon`

```bash
cd /Users/joshuamcclure/Desktop/living-eamon

# Create env file with restricted permissions
touch .env.infrastructure
chmod 600 .env.infrastructure
```

Write the five credentials provided by Scotch into `.env.infrastructure`. The file should look exactly like this (with real values substituted):

```
# Living Eamon Infrastructure Credentials
# This file is gitignored. Never commit.

# Vast.ai
VAST_API_KEY=<value from Scotch>

# Cloudflare R2
R2_ACCESS_KEY_ID=<value from Scotch>
R2_SECRET_ACCESS_KEY=<value from Scotch>
R2_ENDPOINT=<value from Scotch>
R2_BUCKET=living-eamon-art
R2_ACCOUNT_ID=<value from Scotch>
```

Confirm `.env.infrastructure` is gitignored:

```bash
grep -q "^.env.infrastructure$" .gitignore || echo ".env.infrastructure" >> .gitignore
```

**Verification:**

```bash
test -f .env.infrastructure && echo "FILE EXISTS" || echo "MISSING"
[ "$(stat -f %A .env.infrastructure)" = "600" ] && echo "PERMS OK" || echo "PERMS WRONG"
grep -c "^VAST_API_KEY=" .env.infrastructure  # expect 1
grep -c "^R2_" .env.infrastructure  # expect 5
grep "^.env.infrastructure$" .gitignore  # expect the line printed
```

Report verification results to Scotch. Wait for "continue".

---

### Phase 2.2 — Install rclone and configure R2 remote

```bash
# Install via Homebrew
brew install rclone

# Verify install
rclone --version
```

Expected: `rclone v1.x.x` plus build details.

Create rclone config directory:

```bash
mkdir -p ~/.config/rclone
```

Read credentials from `.env.infrastructure` and write rclone config. Use `set -a; source .env.infrastructure; set +a` to load env vars, then write the config:

```bash
set -a
source .env.infrastructure
set +a

cat > ~/.config/rclone/rclone.conf <<EOF
[r2-living-eamon]
type = s3
provider = Cloudflare
access_key_id = ${R2_ACCESS_KEY_ID}
secret_access_key = ${R2_SECRET_ACCESS_KEY}
endpoint = ${R2_ENDPOINT}
acl = private
EOF

chmod 600 ~/.config/rclone/rclone.conf
```

**Verification — round-trip a test file through R2:**

```bash
# List buckets (should show living-eamon-art)
rclone lsd r2-living-eamon:

# Upload, list, delete a test file
echo "rclone connectivity test" > /tmp/rclone-test.txt
rclone copy /tmp/rclone-test.txt r2-living-eamon:living-eamon-art/test/
rclone ls r2-living-eamon:living-eamon-art/test/
rclone delete r2-living-eamon:living-eamon-art/test/rclone-test.txt
rm /tmp/rclone-test.txt

# Confirm test directory is empty
rclone ls r2-living-eamon:living-eamon-art/test/
```

If listing showed `living-eamon-art`, the copy/list/delete cycle ran without error, and the final list returned no results: rclone is configured. Report to Scotch. Wait for "continue".

---

### Phase 2.3 — Install Vast.ai CLI and authenticate

```bash
# Install
pip3 install --user vastai

# Check whether the CLI is on PATH
which vastai
```

If `which vastai` returns a path, skip ahead to authentication. If it returns nothing:

```bash
# Find the user-level Python bin directory
PYTHON_USER_BIN="$(python3 -m site --user-base)/bin"
echo "User Python bin: $PYTHON_USER_BIN"

# Add to PATH in ~/.zshrc if not already there
grep -q "site --user-base" ~/.zshrc || \
  echo 'export PATH="$(python3 -m site --user-base)/bin:$PATH"' >> ~/.zshrc

# Source it for this session
export PATH="$PYTHON_USER_BIN:$PATH"

# Verify
which vastai
```

Authenticate:

```bash
set -a
source .env.infrastructure
set +a

vastai set api-key "$VAST_API_KEY"
```

**Verification:**

```bash
# Should return empty list, no error
vastai show instances

# Should return offers (sanity check)
vastai search offers 'gpu_name=RTX_4090 num_gpus=1' --limit 3
```

If `show instances` returns cleanly (empty is fine; no auth errors) and `search offers` returns at least one result: Vast.ai CLI is working. Report to Scotch. Wait for "continue".

---

### Phase 2.4 — Generate dedicated SSH key and configure SSH

```bash
# Generate ed25519 key, no passphrase (Claude Code needs non-interactive use)
ssh-keygen -t ed25519 -f ~/.ssh/vast_living_eamon -C "vast-living-eamon" -N ""

# Lock down permissions
chmod 600 ~/.ssh/vast_living_eamon
chmod 644 ~/.ssh/vast_living_eamon.pub
```

Register the public key with Vast.ai:

```bash
vastai create ssh-key "$(cat ~/.ssh/vast_living_eamon.pub)"

# Confirm registration
vastai show ssh-keys
```

Update `~/.ssh/config` to use this key for Vast.ai hosts:

```bash
# Append config block (only if not already present)
if ! grep -q "vast_living_eamon" ~/.ssh/config 2>/dev/null; then
cat >> ~/.ssh/config <<'EOF'

# Vast.ai instances — Living Eamon
Host *.vast.ai vast-*
  IdentityFile ~/.ssh/vast_living_eamon
  IdentitiesOnly yes
  StrictHostKeyChecking accept-new
  ServerAliveInterval 30
EOF
fi

chmod 600 ~/.ssh/config
```

**Verification:**

```bash
test -f ~/.ssh/vast_living_eamon && echo "PRIVATE KEY EXISTS"
test -f ~/.ssh/vast_living_eamon.pub && echo "PUBLIC KEY EXISTS"
[ "$(stat -f %A ~/.ssh/vast_living_eamon)" = "600" ] && echo "PRIVATE KEY PERMS OK"
vastai show ssh-keys | grep -q "vast-living-eamon" && echo "KEY REGISTERED ON VAST"
grep -q "vast_living_eamon" ~/.ssh/config && echo "SSH CONFIG UPDATED"
```

All five checks should pass. Report to Scotch. Wait for "continue".

---

### Phase 2.5 — Final checklist and commit

Run the full Part 1 checklist from `INFRASTRUCTURE.md`:

```bash
echo "=== Part 1 Final Verification ==="
echo

echo "1. Civitai membership cancelled: (Scotch confirms — already done)"

echo "2. Cloudflare R2 bucket exists:"
rclone lsd r2-living-eamon: | grep -q "living-eamon-art" && echo "  ✅ PASS" || echo "  ❌ FAIL"

echo "3. .env.infrastructure exists with R2 credentials:"
grep -c "^R2_" .env.infrastructure | grep -q "5" && echo "  ✅ PASS" || echo "  ❌ FAIL"

echo "4. .env.infrastructure is gitignored:"
grep -q "^.env.infrastructure$" .gitignore && echo "  ✅ PASS" || echo "  ❌ FAIL"

echo "5. rclone configured and tested:"
rclone lsd r2-living-eamon: > /dev/null 2>&1 && echo "  ✅ PASS" || echo "  ❌ FAIL"

echo "6. Vast.ai authenticated:"
vastai show instances > /dev/null 2>&1 && echo "  ✅ PASS" || echo "  ❌ FAIL"

echo "7. Vast.ai API key in .env.infrastructure:"
grep -q "^VAST_API_KEY=" .env.infrastructure && echo "  ✅ PASS" || echo "  ❌ FAIL"

echo "8. Dedicated SSH key generated and registered:"
test -f ~/.ssh/vast_living_eamon && \
  vastai show ssh-keys | grep -q "vast-living-eamon" && \
  grep -q "vast_living_eamon" ~/.ssh/config && \
  echo "  ✅ PASS" || echo "  ❌ FAIL"
```

Report all 8 results to Scotch.

If all 8 pass, commit:

```bash
cd /Users/joshuamcclure/Desktop/living-eamon

# Confirm only intended files are staged
git status

# Stage only the gitignore change (env file is already excluded)
git add .gitignore

# Also stage INFRASTRUCTURE.md and this session plan if not already committed
git add INFRASTRUCTURE.md SESSION_001_VAST_R2_SETUP.md 2>/dev/null || true

# Commit
git commit -m "infrastructure: Part 1 — Vast.ai, Cloudflare R2, rclone, SSH key

Completes Part 1 of INFRASTRUCTURE.md.

- Vast.ai account active with \$25 credit and spending alerts
- Cloudflare R2 bucket living-eamon-art created and tested
- rclone configured with r2-living-eamon remote
- Vast.ai CLI installed and authenticated
- Dedicated ed25519 SSH key generated and registered with Vast.ai
- .env.infrastructure created (gitignored) with all credentials

Next: Session 002 — spin up ComfyUI instance on Vast.ai (Part 2)."

# Push
git push origin main
```

Report commit SHA to Scotch.

---

## Failure Recovery

If any phase's verification fails, **stop**. Do not continue to the next phase.

Common failures and what to do:

| Failure | Action |
|---------|--------|
| `brew install rclone` fails | Confirm Homebrew is installed (`brew --version`). If not, prompt Scotch to install Homebrew first |
| `rclone lsd r2-living-eamon:` returns auth error | Re-check R2 credentials in `.env.infrastructure` — the most common error is a typo in `R2_ENDPOINT` (must include `https://` and the account ID) |
| `pip3 install --user vastai` fails | Check Python 3 is available (`python3 --version`). On macOS, may need to install via `brew install python` |
| `vastai show instances` returns 401 / auth error | API key was pasted incorrectly. Have Scotch regenerate it on vast.ai and provide the new value |
| `vastai create ssh-key` fails with "key already exists" | A previous key with the same content is already registered. Run `vastai show ssh-keys` and confirm the existing one is the right one; if so, skip this step |

In any failure case, surface the exact error message to Scotch verbatim. Do not improvise fixes.

---

## What Comes After This Session

After Phase 2.5 commits successfully, this session is complete.

**Next session (Session 002) will be a separate plan**, generated from Part 2 of `INFRASTRUCTURE.md`. It will cover:

- Searching Vast.ai for an appropriate RTX 4090 offer
- Spinning up an instance with a ComfyUI Docker image
- Syncing a downloaded SDXL or Flux checkpoint from R2 to the instance
- SSH port forwarding to access the ComfyUI web UI
- Generating test images
- Syncing outputs back to R2
- Destroying the instance

**Do not attempt Part 2 in this session.** Stop after the commit in Phase 2.5.

---

## Quick Reference for Scotch

What you need to do, in order:

1. ☐ Sign up at vast.ai, add $25 credit, set spending alerts, copy API key
2. ☐ Sign up at cloudflare.com (if needed), create R2 bucket `living-eamon-art`, generate API token, copy 4 R2 values
3. ☐ Open Cursor, point Claude Code at this file
4. ☐ Tell Claude Code: *"Execute Session 001 starting at Half 2 Phase 2.1. Stop after each phase and report results."*
5. ☐ Provide Claude Code with the 5 credential values when prompted
6. ☐ At each verification gate, review results and reply "continue" if good
7. ☐ Confirm final commit pushed
8. ☐ Done

Total time estimate: 30-45 minutes.
