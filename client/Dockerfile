# ---- Frontend image (Nginx serving static SPA) ----
FROM nginx:1.27-alpine

# Xóa config mặc định của Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy toàn bộ mã nguồn frontend
COPY . /usr/share/nginx/html/

# Mở port 80
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q --spider http://127.0.0.1/nginx-health || exit 1

CMD ["nginx", "-g", "daemon off;"]
