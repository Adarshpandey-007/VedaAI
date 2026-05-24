# MongoDB Setup Guide for VedaAI Assignment

Since you do not have MongoDB installed locally on your Windows machine, this guide provides a step-by-step walkthrough to get a MongoDB database running. 

We recommend **MongoDB Atlas** (Free Cloud Tier) because it requires **zero installation** and is ready in 3 minutes. Alternatively, you can run MongoDB locally using Docker or the Windows Installer.

---

## Option 1: MongoDB Atlas (Recommended - Free & Zero Install)

MongoDB Atlas is the official cloud database service. It has a permanent free tier that is perfect for this project.

### Step 1: Sign Up
1. Go to [MongoDB Atlas Registration Page](https://www.mongodb.com/cloud/atlas/register).
2. Create a free account.

### Step 2: Create a Free Database Cluster
1. Choose the **M0 (Free)** tier.
2. Select your provider (e.g., AWS) and region nearest to you.
3. Click **Create Deployment**.

### Step 3: Set Up Database Security Credentials
1. **Create a Database User**:
   - Enter a username (e.g., `veda_admin`).
   - Enter a secure password (click "Autogenerate" and copy it).
   - Click **Create Database User**.
2. **Configure IP Access List**:
   - Choose **Allow Access from Anywhere** (`0.0.0.0/0`) or click **Add My Current IP Address**.
   - Click **Add Entry**.

### Step 4: Retrieve Your Connection String
1. On your Database Deployment dashboard, click the **Connect** button.
2. Select **Drivers** (Node.js).
3. Copy the provided connection string. It will look like this:
   ```text
   mongodb+srv://veda_admin:<db_password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   ```
4. Replace `<db_password>` with the secure password you generated in Step 3.
5. In your `backend/.env` file, paste this connection string under:
   ```env
   MONGODB_URI=mongodb+srv://veda_admin:yourpassword@cluster0.abcde.mongodb.net/veda_db?retryWrites=true&w=majority
   ```

---

## Option 2: Run Local MongoDB using Docker (Requires Docker Desktop)

If you decide to install Docker Desktop on your Windows machine, running MongoDB is a single command:

1. Open PowerShell or Command Prompt.
2. Run the following command:
   ```bash
   docker run -d --name veda-mongo -p 27017:27017 mongo:latest
   ```
3. Your local connection URI will be:
   ```env
   MONGODB_URI=mongodb://localhost:27017/veda_db
   ```

---

## Option 3: Install MongoDB Community Server on Windows (Local Install)

To install MongoDB directly on Windows:

1. Download the MSI Installer from [MongoDB Download Center](https://www.mongodb.com/try/download/community).
2. Choose package `MSI` and click **Download**.
3. Run the installer and select **Complete Setup**.
4. **IMPORTANT**: Make sure **"Install MongoDB as a Service"** is checked.
5. Finish the installation.
6. Install [MongoDB Compass](https://www.mongodb.com/try/download/compass) (the visual GUI) if prompted to explore your database tables.
7. Your local connection URI will be:
   ```env
   MONGODB_URI=mongodb://localhost:27017/veda_db
   ```

---

## Zero-Configuration Fallback Mode (Built-in)

If you run the application *without* specifying any `MONGODB_URI` environment variable, or if the server cannot connect to your MongoDB database, the backend is built to **automatically switch to local file-based fallback mode**.

- It will create a database file under `backend/db_fallback.json`.
- All assignments and question papers will be saved and fetched from this local file.
- Everything runs seamlessly out-of-the-box without crashing!
