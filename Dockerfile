# Use Node.js 18 LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm install
RUN cd backend && npm install

# Copy source code
COPY backend/ ./backend/

# Generate Prisma client
RUN cd backend && npx prisma generate

# Build the backend
RUN cd backend && npm run build

# Expose port
EXPOSE 3002

# Set working directory to backend
WORKDIR /app/backend

# Start the application
CMD ["npm", "run", "start"]