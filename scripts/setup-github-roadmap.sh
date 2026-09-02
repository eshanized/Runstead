#!/usr/bin/env bash
set -euo pipefail

# Runstead GitHub Roadmap & Milestone Provisioning Script
# Sourced from eshanized/Runstead

REPO="eshanized/Runstead"

echo "=================================================="
echo "Runstead GitHub Roadmap Provisioner"
echo "Target Repository: $REPO"
echo "=================================================="

if ! command -v gh &> /dev/null; then
  echo "Error: GitHub CLI ('gh') is not installed. Please install gh and authenticate."
  exit 1
fi

if ! gh auth status &> /dev/null; then
  echo "Error: GitHub CLI is not authenticated. Run 'gh auth login' to authenticate."
  exit 1
fi

echo "✓ GitHub CLI authenticated."

# Ensure repo exists
if ! gh repo view "$REPO" &> /dev/null; then
  echo "Creating repository $REPO..."
  gh repo create "$REPO" --public --description "Runstead — Operating System for Hosting Businesses"
  echo "✓ Created repository $REPO"
else
  echo "✓ Repository $REPO exists."
fi

# 1. Setup Label Taxonomy
echo "Provisioning Label Taxonomy..."

create_label_if_missing() {
  local name="$1"
  local color="$2"
  local desc="$3"
  if gh label list --repo "$REPO" | grep -Fq "$name"; then
    echo "  Label '$name' already exists."
  else
    gh label create "$name" --repo "$REPO" --color "$color" --description "$desc" || true
    echo "  ✓ Created label '$name'"
  fi
}

# Work states
create_label_if_missing "status:planned" "64748b" "Work scheduled for future milestone"
create_label_if_missing "status:in-progress" "3b82f6" "Actively being developed"
create_label_if_missing "status:blocked" "ef4444" "Work blocked on dependencies"
create_label_if_missing "status:in-review" "a855f7" "Pull request or review in flight"
create_label_if_missing "status:completed" "10b981" "Deliverable verified and closed"

# Work categories
create_label_if_missing "type:feature" "06b6d4" "User-visible or architectural feature"
create_label_if_missing "type:bug" "f43f5e" "Defect or unexpected behavior"
create_label_if_missing "type:security" "f59e0b" "Security hardening or CVE resolution"
create_label_if_missing "type:testing" "10b981" "Automated test suite or QA harness"
create_label_if_missing "type:documentation" "8b5cf6" "Documentation, specs, or guide"
create_label_if_missing "type:infrastructure" "6366f1" "CI/CD, deployment, or server infrastructure"

# Roadmap membership
create_label_if_missing "roadmap" "ec4899" "Included in public roadmap completion calculations"

# Effort estimates (Fibonacci)
create_label_if_missing "estimate:1" "cbd5e1" "1 effort point (Trivial change / config)"
create_label_if_missing "estimate:2" "94a3b8" "2 effort points (Small UI / isolated function)"
create_label_if_missing "estimate:3" "64748b" "3 effort points (Standard feature / component)"
create_label_if_missing "estimate:5" "475569" "5 effort points (Complex module / multi-file)"
create_label_if_missing "estimate:8" "334155" "8 effort points (Major subsystem / external integration)"
create_label_if_missing "estimate:13" "1e293b" "13 effort points (Deep architectural overhaul)"

echo "✓ Label taxonomy provisioned."

# 2. Setup Milestones
echo "Provisioning Milestones..."

create_milestone_if_missing() {
  local title="$1"
  local desc="$2"
  local due="$3"
  if gh api "repos/$REPO/milestones?state=all" --jq '.[].title' | grep -Fq "$title"; then
    echo "  Milestone '$title' already exists."
  else
    gh api "repos/$REPO/milestones" -f title="$title" -f description="$desc" -f due_on="$due" || true
    echo "  ✓ Created milestone '$title'"
  fi
}

create_milestone_if_missing "M1: Foundation & Reseller Architecture" "Core multi-tenant models, seeded demo state, auth foundations, and platform operator console." "2026-09-15T00:00:00Z"
create_milestone_if_missing "M2: Core Platform & Business Workflows" "Customer CRM, recurring invoices, product catalog, support ticketing, and business analytics." "2026-10-01T00:00:00Z"
create_milestone_if_missing "M3: Customer Experience & Storefront" "White-label storefront editor, live preview, multi-item cart, and self-service customer portal." "2026-10-10T00:00:00Z"
create_milestone_if_missing "M4: Provisioning & Automation Engine" "Service lifecycle state machine, automated hypervisor/DNS provisioning, and upstream cPanel/WHM connectors." "2026-11-15T00:00:00Z"
create_milestone_if_missing "M5: Domain Commerce & DNS Network" "RFC DNS zone editor, registrar API connector abstraction, and automated Let's Encrypt SSL orchestration." "2026-12-01T00:00:00Z"
create_milestone_if_missing "M6: Security, Enterprise & Release Readiness" "Public progress dashboard, GitHub CI/CD pipeline, PostgreSQL persistence adapter, and v1.0 production release." "2026-12-20T00:00:00Z"

echo "✓ Milestones provisioned."
echo "=================================================="
echo "Runstead GitHub Setup Complete!"
echo "Visit: https://github.com/$REPO"
echo "=================================================="
