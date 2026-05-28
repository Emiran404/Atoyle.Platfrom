# Aşama 1: Frontend'in derlenmesi
FROM node:20 AS build-frontend
WORKDIR /app

# Sadece kök dizindeki dosyaları kopyala
COPY package*.json ./
COPY vite.config.js ./
COPY eslint.config.js ./
COPY index.html ./

# Frontend bağımlılıklarını kur
RUN npm install

# Frontend kaynak kodlarını kopyala ve derle
COPY src ./src
COPY public ./public
RUN npm run build

# Aşama 2: Üretim (Production) Sunucusu
FROM node:20-slim
WORKDIR /app

# Gerekli sistem paketleri (better-sqlite3 derlemesi için python ve build araçları şarttır)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Server bağımlılıklarını kopyala ve kur
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --omit=dev

# Server kaynak kodlarını kopyala
COPY server/ ./

# Aşama 1'den derlenmiş frontend'i kopyala
COPY --from=build-frontend /app/dist /app/dist

# Ortam değişkenleri
ENV NODE_ENV=production
ENV PORT=3001

# Gerekli klasörlerin (volumes) oluşturulması
RUN mkdir -p /app/server/data /app/server/backups /app/src/uploads_student

# Dışarıya açılacak port
EXPOSE 3001

# Uygulamayı başlat
CMD ["node", "index.js"]
