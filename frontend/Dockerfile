# Use official Node.js image
FROM node:20

# Set the working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install
RUN npm install -g expo-cli @expo/ngrok

# Copy the rest of the application files
COPY . .

# Expose the port that Expo uses
EXPOSE 19000 19001 19002
# Run Expo start directly
CMD ["npm", "run", "start", "--tunnel"]
