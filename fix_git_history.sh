#!/bin/bash
# Fix git history to remove API key from old commit

echo "🔧 Fixing git history to remove API key..."

# Interactive rebase to edit the commit
git rebase -i 01527bd

# This will open an editor. Change 'pick' to 'edit' for commit 8b1485e
# Then save and close

# After the rebase pauses, run:
# git show HEAD:FIXES_APPLIED.md | sed 's/ANTHROPIC_API_KEY=sk-ant-api03-.*/ANTHROPIC_API_KEY=<your-anthropic-api-key>/' > FIXES_APPLIED.md.tmp
# mv FIXES_APPLIED.md.tmp FIXES_APPLIED.md
# git add FIXES_APPLIED.md
# git commit --amend --no-edit
# git rebase --continue

echo "Then force push: git push origin main --force"
