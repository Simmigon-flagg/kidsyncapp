# Use official Node.js LTS base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy only package.json and package-lock.json
COPY package*.json ./

# Install all dependencies (including production)
RUN npm install

# Copy all source code
COPY . .

# Expose the port your app runs on
EXPOSE 3000

# Run the backend in dev mode
CMD ["npm", "run", "dev"]
