FROM node:20-slim

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install backend dependencies
COPY backend/package.json backend/package-lock.json* backend/
RUN cd backend && npm install --production

# Install frontend dependencies and build
COPY frontend/package.json frontend/package-lock.json* frontend/
RUN cd frontend && npm install
COPY frontend/ frontend/
RUN cd frontend && npm run build

# Copy backend source
COPY backend/ backend/

# Move frontend build into backend for static serving
RUN cp -r frontend/dist backend/public

WORKDIR /app/backend
EXPOSE 3001

CMD ["node", "src/index.js"]
