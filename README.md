# F2R - Multi-Vendor Footwear Marketplace

A professional e-commerce marketplace similar to Flipkart/Myntra for footwear, built with Next.js, Node.js, Express, and MongoDB.

## 🚀 Features

### Customer Features
- Mobile OTP login (like Flipkart)
- Product browsing with filters (category, size, color, price)
- Shopping cart (works without login)
- Multiple payment options (Razorpay, COD)
- Order tracking
- Address management
- Coupon system

### Seller Features
- Seller registration with business details
- Product listing with variants (size/color/stock)
- Order management with status updates
- Finance dashboard (earnings, pending payments)
- Support ticket system

### Admin Features
- Vendor onboarding & approval
- Commission management per vendor
- Banner & coupon management
- Order analytics & reports
- Product promotion

### Integrations
- **Razorpay** - Payment gateway (UPI, Cards, Net Banking)
- **Shiprocket** - Logistics & shipping
- **WhatsApp** - Order notifications (ready to integrate)

---

## 📁 Project Structure

```
f2r-marketplace/
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── config/         # Database config
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Auth middleware
│   │   ├── models/         # MongoDB schemas
│   │   ├── routes/         # API routes
│   │   ├── services/       # External services (Razorpay, Shiprocket)
│   │   └── utils/          # Utilities
│   └── .env.example        # Environment variables template
│
├── frontend/               # Next.js 14 App
│   ├── src/
│   │   ├── app/           # Pages (App Router)
│   │   ├── components/    # React components
│   │   ├── lib/           # API client & utilities
│   │   ├── store/         # Zustand state management
│   │   └── types/         # TypeScript types
│   └── .env.local.example # Frontend env template
│
└── README.md
```

---

## 🛠️ Local Development Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### 1. Clone & Install Dependencies

```bash
cd ~/Desktop/f2r-marketplace

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment Variables

**Backend (.env)**
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# MongoDB - Use Atlas for production
MONGODB_URI=mongodb://localhost:27017/f2r_marketplace

# JWT Secret (generate a strong random string)
JWT_SECRET=your_super_secret_key_here

# Razorpay (Get from dashboard.razorpay.com)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Shiprocket (Get from app.shiprocket.in/api-user)
SHIPROCKET_EMAIL=your_email
SHIPROCKET_PASSWORD=your_password
```

**Frontend (.env.local)**
```bash
cd frontend
cp .env.local.example .env.local
```

Edit `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
```

### 3. Start Development Servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

---

## 🌐 Deployment Guide

### Option 1: VPS/Cloud Server (Recommended for India)

#### A. Purchase Domain & Server

1. **Domain**: Buy `f2r.co.in` from:
   - GoDaddy (godaddy.com)
   - Namecheap (namecheap.com)
   - BigRock (bigrock.in)

2. **Server**: Get a VPS from:
   - DigitalOcean ($6/month) - Bangalore datacenter
   - AWS Lightsail ($3.50/month)
   - Hostinger VPS

#### B. Server Setup (Ubuntu 22.04)

```bash
# SSH into server
ssh root@your_server_ip

# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs

# Install PM2 (process manager)
npm install -g pm2

# Install Nginx
apt install -y nginx

# Install Certbot for SSL
apt install -y certbot python3-certbot-nginx

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt update
apt install -y mongodb-org
systemctl start mongod
systemctl enable mongod
```

#### C. Deploy Application

```bash
# Clone your code (or upload via SFTP)
cd /var/www
git clone https://github.com/your-repo/f2r-marketplace.git
cd f2r-marketplace

# Setup Backend
cd backend
npm install
cp .env.example .env
# Edit .env with production values
nano .env

# Build & Start Backend
npm run build
pm2 start dist/index.js --name f2r-api

# Setup Frontend
cd ../frontend
npm install
cp .env.local.example .env.local
# Edit with production API URL
nano .env.local

# Build & Start Frontend
npm run build
pm2 start npm --name f2r-web -- start

# Save PM2 config
pm2 save
pm2 startup
```

#### D. Configure Nginx

```bash
nano /etc/nginx/sites-available/f2r.co.in
```

```nginx
# Frontend
server {
    listen 80;
    server_name f2r.co.in www.f2r.co.in;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# API
server {
    listen 80;
    server_name api.f2r.co.in;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/f2r.co.in /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# Get SSL Certificate
certbot --nginx -d f2r.co.in -d www.f2r.co.in -d api.f2r.co.in
```

#### E. Point Domain to Server

In your domain registrar DNS settings:
- A Record: `@` → Your Server IP
- A Record: `www` → Your Server IP
- A Record: `api` → Your Server IP

---

### Option 2: Vercel + Railway (Easier)

#### Frontend on Vercel
1. Push code to GitHub
2. Go to vercel.com → Import project
3. Add environment variables
4. Deploy!

#### Backend on Railway
1. Go to railway.app
2. New Project → Deploy from GitHub
3. Add MongoDB plugin
4. Add environment variables
5. Get your API URL

---

## 🔑 API Keys Setup

### 1. Razorpay (Payment Gateway)

1. Go to https://dashboard.razorpay.com
2. Sign up / Login
3. Go to Settings → API Keys
4. Generate Test Keys (for testing)
5. Generate Live Keys (for production)
6. Complete KYC for live payments

### 2. Shiprocket (Logistics)

1. Go to https://app.shiprocket.in
2. Sign up for business account
3. Go to Settings → API → Create User
4. Get email and password for API

### 3. MongoDB Atlas (Production Database)

1. Go to https://cloud.mongodb.com
2. Create free cluster (choose Mumbai region)
3. Create database user
4. Whitelist your server IP
5. Get connection string

---

## 📱 WhatsApp Integration (Optional)

For order notifications via WhatsApp:

1. **Facebook Business**: Create a WhatsApp Business Account
2. **Meta for Developers**: Get WhatsApp Business API access
3. **Alternative**: Use Twilio WhatsApp API (easier setup)

---

## 🔒 Security Checklist

- [ ] Change default JWT secret
- [ ] Use HTTPS in production
- [ ] Set proper CORS origins
- [ ] Enable rate limiting
- [ ] Secure MongoDB (authentication)
- [ ] Regular backups
- [ ] Never expose .env files

---

## 💰 Estimated Costs (Monthly)

| Service | Cost |
|---------|------|
| Domain (.co.in) | ₹500/year |
| VPS Server | ₹500-1000/month |
| MongoDB Atlas (Free tier) | ₹0 |
| Razorpay | 2% per transaction |
| Shiprocket | As per usage |
| **Total** | ~₹1000/month + transaction fees |

---

## 📞 Support & Next Steps

### What YOU Need to Do:

1. **Buy Domain**: Purchase f2r.co.in
2. **Razorpay Account**: Create and complete KYC
3. **Shiprocket Account**: Sign up for shipping
4. **Server**: Get a VPS (DigitalOcean/AWS)
5. **Upload Products**: Add your inventory

### I Can Help You With:

- Domain DNS configuration
- Server setup assistance
- Payment gateway integration
- Any code modifications
- Bug fixes

---

## 🎯 Quick Start Commands

```bash
# Start everything locally
cd ~/Desktop/f2r-marketplace

# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

Then open http://localhost:3000

---

Built with ❤️ for F2R Marketplace
