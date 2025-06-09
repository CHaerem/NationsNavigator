# GitHub Actions Workflows

This directory contains GitHub Actions workflows that automate deployment and preview functionality for the Nations Navigator project.

## Workflows Overview

### 1. `gh-pages.yml` - Production Deployment

**Purpose**: Automatically deploys the application to GitHub Pages when changes are pushed to the main branch.

**Trigger**:

- Push events to the `main` branch

**What it does**:

- Checks out the repository code
- Prepares deployment folder with production files (HTML, CSS, JS, data)
- Excludes development and performance files from deployment
- Deploys to the `gh-pages` branch with modular CSS structure
- Preserves the `pr-preview/` directory to maintain pull request previews
- Makes the application available at your GitHub Pages URL

**Permissions Required**:

- `contents: write` - To push to the gh-pages branch

### 2. `preview.yml` - Pull Request Previews

**Purpose**: Creates temporary preview deployments for pull requests, allowing you to test changes before merging.

**Trigger**:

- Pull request opened, reopened, synchronized, or closed

**What it does**:

- Creates a unique preview URL for each pull request
- Updates the preview when new commits are pushed to the PR
- Automatically cleans up the preview when the PR is closed
- Posts a comment on the PR with the preview link

**Permissions Required**:

- `contents: write` - To deploy preview files
- `pull-requests: write` - To comment on PRs with preview links

**Concurrency**: Uses `preview-${{ github.ref }}` to ensure only one preview deployment runs per PR at a time.

## How It Works

### Production Deployment Flow

1. Developer pushes code to `main` branch
2. `gh-pages.yml` workflow triggers automatically
3. Code is deployed to GitHub Pages
4. Application is live at your GitHub Pages URL

### Preview Deployment Flow

1. Developer creates or updates a pull request
2. `preview.yml` workflow triggers automatically
3. A preview is deployed to a unique URL (typically `your-pages-url/pr-preview/pr-X/`)
4. GitHub bot comments on the PR with the preview link
5. When PR is merged or closed, the preview is automatically cleaned up

## Benefits

- **Continuous Deployment**: Changes to main are automatically deployed
- **Safe Testing**: Preview deployments let you test changes without affecting production
- **Collaboration**: Team members can easily review and test proposed changes
- **Automatic Cleanup**: No manual intervention needed for preview management

## Configuration

Both workflows use:

- `actions/checkout@v4` for checking out code
- `${{ secrets.GITHUB_TOKEN }}` for authentication (automatically provided by GitHub)
- Ubuntu latest runners for consistent deployment environment

The workflows are configured to work with static sites and require no build step, making them perfect for vanilla HTML/CSS/JavaScript applications like Nations Navigator.
