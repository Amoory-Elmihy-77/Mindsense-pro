FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Install dependencies first for better layer caching
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source after dependencies
COPY . .

EXPOSE 5020

CMD ["npm", "start"]
