FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first for better build caching
COPY package*.json ./
RUN npm ci

# Build static assets
COPY . .
ARG VITE_API_BASE_URL=http://localhost:5020/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM nginx:1.27-alpine

# Serve Vite output from nginx web root
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
