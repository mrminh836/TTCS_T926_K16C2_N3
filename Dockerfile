# ---- Base image ----
FROM node:20-alpine

# Tạo thư mục làm việc trong container
WORKDIR /app

# Copy file quản lý dependency trước để tận dụng Docker cache
COPY package.json package-lock.json ./

# Cài đặt dependencies
RUN npm ci

# Copy toàn bộ mã nguồn (sẽ bị override bởi volume mount khi dev)
COPY . .

# Mở port ứng dụng
EXPOSE 3000

# Chạy server với hot-reload (node --watch)
CMD ["node", "--watch", "server.js"]
