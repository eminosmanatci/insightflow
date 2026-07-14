# Hafif bir Node.js imajı kullanıyoruz
FROM node:20-alpine

# Çalışma dizinini belirliyoruz
WORKDIR /app

# Önce bağımlılık dosyalarını kopyalayıp kuruyoruz (Docker önbellek optimizasyonu)
COPY package*.json ./
RUN npm install

# Tüm proje dosyalarını kopyalıyoruz
COPY . .

# Vite'in varsayılan portunu dışa açıyoruz
EXPOSE 5173

# Container dışından erişime izin vermek için --host bayrağıyla başlatıyoruz
CMD ["npm", "run", "dev", "--", "--host"]