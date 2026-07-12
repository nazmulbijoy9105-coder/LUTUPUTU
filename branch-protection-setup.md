# GitHub Code Protection & Repository Security Setup

This guide helps you secure your GitHub repository so that **no one can make changes to your code without your explicit permission**. 

By following these steps, you will establish a strict, industry-standard branch protection system for your repository.

---

## Step 1: Push the `CODEOWNERS` File
This repository now contains a `CODEOWNERS` file at the root. This file declares **`@NAZMULBIJOY9105`** as the absolute owner of the code.
- **Path:** `/CODEOWNERS`
- **Effect:** GitHub will automatically require your review and approval for any Pull Request that alters files in this repository.

---

## Step 2: Configure Branch Protection Rules on GitHub

To activate this protection, you must enable it in your GitHub repository settings:

1. Open your repository on GitHub: `https://github.com/your-username/your-repo-name`
2. Click on the **Settings** tab at the top.
3. In the left sidebar, click on **Branches** (under the "Code and automation" section).
4. Under **Branch protection rules**, click the **Add branch protection rule** button (or click **Edit** if you have an existing rule for `main`/`master`).
5. In the **Branch name pattern** field, type:
   ```text
   main
   ```
   *(or `master`, depending on your default branch name).*

---

## Step 3: Turn on Specific Security Toggles

Tick the following options to enforce absolute control:

### 🔒 1. Require a pull request before merging
*   This prevents anyone from pushing code directly to the branch. Everyone (including collaborators) must submit a Pull Request.
*   **Action:** Check the box **"Require a pull request before merging"**.

### ✍️ 2. Require approvals
*   Specifies how many reviews are needed before a merge is authorized.
*   **Action:** Set **"Required approving reviews"** to **`1`**.

### 🛡️ 4. Require review from Code Owners
*   This is the most critical setting. It links with the `CODEOWNERS` file we created. Even if other collaborators approve a PR, it **cannot** be merged until you (`@NAZMULBIJOY9105`) personally sign off on it.
*   **Action:** Check the box **"Require review from Code Owners"**.

### 🚫 5. Do not allow bypassing the above settings
*   Ensures that these rules apply to *everyone*, including administrators (you). This prevents accidental pushes.
*   **Action:** Check **"Do not allow bypassing the above settings"** (or "Enforce rules for administrators").

### 🔑 6. Require signed commits
*   Ensures that only verified commits with GPG keys are allowed, preventing identity spoofing.
*   **Action:** Check **"Require signed commits"**.

---

## Step 4: Save Changes
Click the **Create** or **Save changes** button at the bottom.

---

## What Happens Now?
1. **Pushes Blocked:** Direct pushes to `main`/`master` are completely blocked.
2. **PRs Mandatory:** Any code changes must be submitted via a Pull Request.
3. **Your Approval Required:** If someone makes a Pull Request, GitHub will show a message: **"Review required from Code Owners"**. The code **cannot** be merged unless **`@NAZMULBIJOY9105`** clicks **Approve**.
