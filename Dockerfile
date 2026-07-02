# Gunakan base image yang lebih stabil
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy hanya file manifest untuk memanfaatkan Docker Cache
COPY package.json package-lock.json* ./

# Install dependensi dengan mode CI (paling aman untuk Docker)
# --frozen-lockfile memastikan versi yang diinstall sama persis dengan lokal
RUN npm ci

# Copy sisa source code setelah instalasi selesai
COPY . .

# Pastikan environment dalam mode production saat build
ENV NODE_ENV=production

# Jalankan build
RUN npm run build

# Port yang digunakan
EXPOSE 3000

# Perintah menjalankan aplikasi
CMD ["npm", "start"]