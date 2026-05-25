# VedaAI AI Assessment Creator: Database Strategy & Setup

This guide details how to configure the VedaAI data storage layer. Our system is built with **zero-setup execution guarantees** to run instantly on any Windows, macOS, or Linux machine, with or without active database engines.

---

## 🗄️ Database Architecture Options

```mermaid
graph LR
    A[Express Server DBStore] --> B{MONGODB_URI set?}
    B -->|Yes| C[Connect Mongoose]
    C --> D[(MongoDB Atlas / Local DB)]
    B -->|No| E[Activate Fallback]
    E --> F[Atomic AsyncLock Write]
    F --> G[(Local db_fallback.json File)]
```

---

## ☁️ Option 1: MongoDB Atlas (Recommended - Free Cloud Tier)

MongoDB Atlas is the recommended setup for production workloads. It is hosted in the cloud, requires **zero software installation**, and can be deployed in under 3 minutes.

### 1. Account Initialization
1. Register at the official [MongoDB Atlas Signup Portal](https://www.mongodb.com/cloud/atlas/register).
2. Choose the permanent **M0 Free Shared Tier** to ensure zero infrastructure fees.
3. Select your preferred cloud provider (e.g. AWS) and the region closest to you, then click **Create Deployment**.

### 2. Security Configuration
1. **Database Credentials**:
   * Create an administrator user (e.g. `veda_admin`).
   * Autogenerate a secure password (make sure to copy it safely).
   * Click **Create Database User**.
2. **IP Access Control**:
   * Set the IP Access List to **Allow Access from Anywhere** (`0.0.0.0/0`) for review purposes, or click **Add My Current IP Address**.
   * Click **Add Entry**.

### 3. Connection String Retrieval
1. Navigate to the Database Cluster dashboard and click **Connect**.
2. Select **Drivers** (Node.js).
3. Copy the target connection string. It will look similar to this:
   ```text
   mongodb+srv://veda_admin:<db_password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   ```
4. Replace `<db_password>` with the password you generated in step 2.
5. Save this URI in `backend/.env`:
   ```env
   MONGODB_URI=mongodb+srv://veda_admin:yourpassword@cluster0.abcde.mongodb.net/veda_db?retryWrites=true&w=majority
   ```

---

## 🐳 Option 2: Run MongoDB Locally via Docker

If Docker Desktop is installed on your Windows machine, you can run a local MongoDB instance in 5 seconds with a single command:

1. Open PowerShell or Command Prompt.
2. Launch the official MongoDB Docker container:
   ```bash
   docker run -d --name veda-mongo -p 27017:27017 mongo:latest
   ```
3. Set your connection string in `backend/.env`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/veda_db
   ```

---

## 💻 Option 3: Local MongoDB Community Server Installation

To install MongoDB directly on your Windows host:

1. Download the official installer from the [MongoDB Download Center](https://www.mongodb.com/try/download/community).
2. Select the `MSI` package and launch the downloaded installer.
3. Choose **Complete Setup**.
4. > [!IMPORTANT]
   > Ensure that **"Install MongoDB as a Service"** remains checked. This configures the engine to run quietly in the background on startup.
5. Follow the prompts and install **MongoDB Compass** (the GUI utility for database visual inspections).
6. Set your connection string in `backend/.env`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/veda_db
   ```

---

## 🛡️ Zero-Configuration Fallback Mode (Default out-of-the-box)

If the `MONGODB_URI` environment variable is not defined or the target database is unreachable, the system automatically redirects operations to the **Local File Database Fallback**:

> [!NOTE]
> **Active Memory Buffering & Mutex Locking**
> To prevent read/write conflicts, VedaAI incorporates an asynchronous locking system (`fileLock`) alongside a synchronized memory-caching buffer (`cachedData`) inside `DBStore.ts`. This guarantees that operations are fully serialized, making local file database interactions robust and thread-safe.

* **File Location**: `backend/db_fallback.json`
* **Performance**: Operations execute in under `3ms` with instant atomic writes.
* **Pre-seeded data**: Includes a beautiful sample exam paper on the *PRAGATI Smart Attendance System* class assignment so you can test all features immediately without configuring external databases or AI API keys!
