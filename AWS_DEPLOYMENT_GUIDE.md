# Complete AWS Deployment & Setup Guide for Dearly Journal Application

This guide provides a step-by-step walkthrough for deploying **Dearly Journal Application** to Amazon Web Services (AWS) using:

- **AWS Amplify** (Frontend Hosting - React/Vite SPA)
- **AWS EC2** (Backend API & WebSocket Server - Node.js/Express/Socket.io)
- **AWS S3** (Object Storage for User Avatars & Journal Media)
- **AWS RDS PostgreSQL** (Managed Relational Database via Prisma ORM)

All services selected in this guide qualify for **AWS 12-Month Free Tier**, ensuring your $100 credit lasts for over a year!

---

## 🛠️ Prerequisites & AWS Account Setup

1. **AWS Account**: Log in to your [AWS Management Console](https://console.aws.amazon.com/).
2. **Git Repository**: Ensure your latest code is pushed to GitHub/GitLab.

---

## Step 1: Set Up AWS RDS PostgreSQL (Database)

1. Open **AWS Console** and search for **RDS**.
2. Click **Create database**:
   - **Database creation method**: Standard create
   - **Engine type**: PostgreSQL
   - **Templates**: **Free tier** (this selects `db.t3.micro` or `db.t4g.micro`)
   - **DB instance identifier**: `dearly-db`
   - **Master username**: `dearly_admin`
   - **Master password**: Set a strong password (save this!)
   - **Connectivity**:
     - **Public access**: **Yes** (to run `npx prisma db push` from your local environment or EC2)
     - **VPC security group**: Create new (e.g. `dearly-rds-sg`)
3. Click **Create database** (takes 3-5 minutes).
4. Once active, click on `dearly-db` and copy the **Endpoint** (e.g., `dearly-db.xxxxxx.us-east-1.rds.amazonaws.com`).
5. Update your `backend/.env`:
   ```env
   DATABASE_URL="postgresql://dearly_admin:YOUR_PASSWORD@dearly-db.xxxxxx.us-east-1.rds.amazonaws.com:5432/postgres?schema=public"
   DIRECT_URL="postgresql://dearly_admin:YOUR_PASSWORD@dearly-db.xxxxxx.us-east-1.rds.amazonaws.com:5432/postgres?schema=public"
   ```
6. Push schema from your machine:
   ```bash
   cd backend
   npx prisma db push
   ```

---

## Step 2: Set Up AWS S3 (Media Storage) & IAM Credentials

### 1. Create S3 Bucket

1. Go to **AWS Console ➔ S3**.
2. Click **Create bucket**:

   - **Bucket name**: `dearly-journal-media-bucket` (must be globally unique)
   - **AWS Region**: Select your nearest region (e.g. `us-east-1`)
   - **Object Ownership**: ACLs disabled (recommended)
   - **Block Public Access**: Uncheck "Block all public access" (Acknowledge warning so media URLs can be publicly viewed in journal entries)

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::dearly-journal-media-bucket/*"
       }
     ]
   }
   ```
3. Click **Create bucket**.
4. Go to your bucket's **Permissions** tab ➔ **Bucket policy** ➔ Edit:

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::dearly-journal-media-bucket/*"
       }
     ]
   }
   ```
5. Set **CORS Configuration** (Permissions tab ➔ Cross-origin resource sharing):

   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": []
     }
   ]
   ```

### 2. Create IAM User Credentials

1. Go to **AWS Console ➔ IAM ➔ Users ➔ Create user**.
2. Username: `dearly-s3-user`.
3. Select **Attach policies directly** ➔ Search for `AmazonS3FullAccess` and attach it.
4. Click **Create user**.
5. Select the newly created user ➔ **Security credentials** tab ➔ **Create access key**.
6. Select **Com****mand Line Interface (CLI)** or **Application running outside AWS**.
7. Copy the **Access Key ID** and **Secret Access Key**.

---

## Step 3: Set Up AWS EC2 (Backend API & WebSocket Server)

### 1. Launch EC2 Instance

1. Go to **AWS Console ➔ EC2 ➔ Launch Instance**:
   - **Name**: `dearly-backend-server`
   - **OS Image**: **Ubuntu 24.04 LTS** (Free tier eligible)
   - **Instance Type**: `t2.micro` or `t3.micro` (Free tier eligible)
   - **Key pair**: Create new key pair (`dearly-key.pem`) and download it.
   - **Network settings (Security Group)**:
     - Allow **SSH** (Port 22) from Anywhere (or My IP)
     - Allow **HTTP** (Port 80) from Anywhere
     - Allow **HTTPS** (Port 443) from Anywhere
     - Allow Custom TCP **Port 3000** from Anywhere
   - **Configure Storage**: Change from **8 GiB** to **20 GiB** (or **30 GiB** gp3). *(AWS Free Tier includes up to 30 GB of EBS storage completely free!)*
2. Click **Launch Instance**.

### 2. Configure EC2 Server Environment

> **Note:** If you connected using **EC2 Instance Connect** in your browser (prompt shows `ubuntu@ip-...`), you are **already connected**! Skip `chmod` and `ssh` commands and go directly to **Step B**.

#### Option A: Connecting from your local computer terminal

```bash
# Run this on your LOCAL computer (in the folder where dearly-key.pem was downloaded)
chmod 400 dearly-key.pem
ssh -i "dearly-key.pem" ubuntu@YOUR_EC2_PUBLIC_IP
```

#### Option B: Setup inside your EC2 terminal

Inside your EC2 server prompt (`ubuntu@ip-...`), install Node.js 20, Git, and PM2:

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git
sudo npm install -g pm2
```

Clone your repository and setup the backend:

```bash
git clone https://github.com/Piyush-Singh-coder/Dearly-Journal-Application.git
cd Dearly-Journal-Application/backend
npm install
```

Create `.env` inside `backend/`:

```bash
nano .env
```

Paste your environment variables:

```env
PORT=3000
DATABASE_URL="postgresql://dearly_admin:YOUR_PASSWORD@dearly-db.xxxxxx.us-east-1.rds.amazonaws.com:5432/postgres?schema=public"
DIRECT_URL="postgresql://dearly_admin:YOUR_PASSWORD@dearly-db.xxxxxx.us-east-1.rds.amazonaws.com:5432/postgres?schema=public"
JWT_SECRET="your_secure_jwt_secret"
JWT_EXPIRES_IN="7d"

AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="YOUR_AWS_ACCESS_KEY_ID"
AWS_SECRET_ACCESS_KEY="YOUR_AWS_SECRET_ACCESS_KEY"
AWS_S3_BUCKET_NAME="dearly-journal-media-bucket"

CLIENT_URL="https://main.xxxxxxxx.amplifyapp.com"
```

Push schema & start backend with PM2:

```bash
npx prisma generate
pm2 start ecosystem.config.cjs
pm2 startup
pm2 save
```

Your API is now running at `http://YOUR_EC2_PUBLIC_IP:3000/api`!

---

## Step 4: Set Up AWS Amplify (Frontend Hosting)

1. Go to **AWS Console ➔ AWS Amplify**.
2. Click **Create new app** ➔ Select **GitHub** as repository provider.
3. Authorize AWS Amplify and select `Dearly-Journal-Application`.
4. Choose Branch: `main`.
5. Amplify will automatically detect the build settings via `amplify.yml` in your repository.
6. Under **Environment variables**, add:
   - Key: `VITE_API_URL`
   - Value: `http://YOUR_EC2_PUBLIC_IP:3000/api`
7. Click **Save and Deploy**.
8. Amplify will build your app and output a public domain (e.g. `https://main.xxxxxxxx.amplifyapp.com`).

---

## 💰 Summary of Monthly Budget & Free Tier Tips

- **RDS Database (`db.t3.micro`)**: 750 free hours/month (Free for 12 months)
- **EC2 Instance (`t2.micro` / `t3.micro`)**: 750 free hours/month (Free for 12 months)
- **S3 Bucket**: 5 GB standard storage + 20,000 GET / 2,000 PUT requests free per month
- **Amplify Hosting**: 1,000 build minutes/month & 15 GB served free per month
- **Total Expected Monthly Cost**: **$0.00 / month** (Your $100 credit will remain intact as a safety net!)
