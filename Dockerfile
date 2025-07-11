# Use the official Node.js 21 image
FROM node:21.6.1-alpine

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application source code
COPY . .

# Expose the port your health check might run on (optional)
# EXPOSE 3000

# Command to run the application
CMD [ "node", "src/index.js" ]