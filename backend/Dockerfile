# Use official Node.js LTS base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy only package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy all source code

COPY . .

# Set environment variable to production
ENV NODE_ENV=production

# Expose the port your app runs on (change if needed)
EXPOSE 3000

# Run your app
CMD ["node", "run","dev"]
