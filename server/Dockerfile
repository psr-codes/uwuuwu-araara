FROM node:18-slim

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of the application
COPY . .

# Generate Prisma client
RUN npx prisma generate

EXPOSE 5000

CMD ["npm", "start"]
