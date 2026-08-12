#!/usr/bin/env bash
# Resets the demo repo back to its pre-demo starting state.
# Run this between practice runs (and once before the real thing).
set -euo pipefail
cd "$(dirname "$0")"

echo "Resetting demo state..."

# H2 database + build artifacts
rm -rf backend/data backend/target
rm -rf frontend/dist frontend/.angular/cache
echo "  - cleared H2 db and build artifacts"

# Agent configs back to v2 (in case /upgrade-agent ran during the demo)
cp .kiro/agents/.originals/backend-agent.v2.json .kiro/agents/backend-agent.json
cp .kiro/agents/.originals/frontend-agent.v2.json .kiro/agents/frontend-agent.json
echo "  - restored backend-agent.json / frontend-agent.json to v2 shape"

# CI workflow (in case /spawn created it)
rm -f .github/workflows/ci.yml
echo "  - removed .github/workflows/ci.yml"

echo "Done. Ready for another run."
