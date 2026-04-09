# Senses Management Setup Guide

This project is designed to help you manage your Senses Boards and other systems using Ansible from your Windows machine.

## 1. Prerequisites (Installing Ansible in WSL)

Since you are running the dashboard on Windows, it uses **WSL (Windows Subsystem for Linux)** as the management engine.

1.  **Open Ubuntu** (Search for "Ubuntu" in your Windows Start menu).
2.  **Update and Install Ansible**:
    ```bash
    sudo apt update
    sudo apt install ansible -y
    ```
3.  **Install Windows Support (pywinrm)**:
    Ansible needs this to talk to your Windows Senses Boards:
    ```bash
    sudo apt install python3-pip -y
    pip3 install pywinrm
    ```

## 2. Configuring Your Systems

Use the **[sample_inventory.xlsx](file:///c:/Users/admin/Music/Ansible project/sample_inventory.xlsx)** file to add your IP addresses.
The dashboard will **Auto-Sync** your changes to the Ansible engine immediately.

## 3. Preparing your Windows Senses Boards

For the dashboard to connect to your Windows boards, you must enable **WinRM** on each board:

1.  Open **PowerShell as Administrator** on the Senses Board.
2.  Run this command:
    ```powershell
    Set-ExecutionPolicy RemoteSigned; iex (New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/ansible/ansible/devel/examples/scripts/ConfigureRemotingForAnsible.ps1')
    ```

## 4. Troubleshooting 'Request Failed'

If you see "Request Failed" on the dashboard:
- Ensure the NodeJS server is running (`npm start`).
- Ensure you have completed the **Step 1** above (Installing Ansible in WSL).
- Check the terminal where NodeJS is running for detailed error logs.
