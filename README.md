# mobile-cicd

A shared CI/CD and automation toolkit for the mobile platform.  
This repository centralizes reusable workflows, GitHub Actions, Copilot integrations, release scripts, and build tooling used across all iOS and Android projects.

## What’s Inside
- Reusable GitHub Actions  
- Shared CI/CD workflows  
- Copilot CLI automation  
- Release and distribution tooling  
- Common scripts for iOS and Android builds  

## Purpose
 Provide a single source of truth for mobile delivery—consistent builds, predictable releases, automated quality checks, and standardized tooling across teams.
 
## How to Use
Reference any shared workflow or action directly in your mobile repositories:

```yaml
uses: org/mobile-cicd/.github/actions/copilot-cli-prompt@main
```

