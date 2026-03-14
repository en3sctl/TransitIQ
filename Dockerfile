FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install
# ts-node'u kuruyoruz ki .ts dosyalarını anlasın
RUN npm install -g ts-node typescript

COPY . .
RUN npx prisma generate

EXPOSE 3000

# dist/main.js yerine direkt src/main.ts'yi çalıştırıyoruz!
CMD ["ts-node", "src/main.ts"]