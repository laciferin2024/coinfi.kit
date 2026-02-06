# Testing Guide: Backup Later Option

This guide explains how to use the **Backup Later** option during wallet creation. This path allows agents and developers to quickly generate a wallet without performing the mandatory Google Drive backup, significantly speeding up the testing loop.

## Prerequisites
- The application must be running locally (`bun run dev`).
- You should be on the Onboarding screen (initial load).

## Steps to Use "Backup Later"

1.  **Start New Wallet**
    - Click the **NEW WALLET** button.
    - Wait for identity generation (MPC keys are created locally).

2.  **Confirm Identity**
    - You will see your new Public Address.
    - Click **CONFIRM IDENTITY ->**.

3.  **Cloud Backup Screen**
    - This screen usually asks for Google Drive backup.
    - Locate the secondary action button below the main "CONFIRM & SECURE" button.
    - Click **BACKUP LATER**.

4.  **Completion**
    - The wallet will be created immediately.
    - You will be redirected to the Home/Dashboard or Shield setup.

## Behavior & State

-   **LocalStorage**: `wallet_cloud_backup_active` will be set to `"false"`.
-   **Wallet Store**: `state.hasCloudBackup` will be `false`.
-   **Functionality**: The wallet is fully functional for sending/receiving/dapps, but will prompt for backup if recovery is attempted (restore flow won't work without backup, obviously).

## Use Case

Use this flow for:
-   UI regression testing.
-   Checking post-onboarding flows (Dashboard, Send, Swap).
-   DApp connection testing.

**Note**: Do not use this for testing Recovery/Restore flows.
