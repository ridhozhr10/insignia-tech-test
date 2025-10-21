# Use an official Node.js runtime as a parent image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and pnpm-lock.yaml to the working directory
COPY package.json ./package.json
COPY pnpm-lock.yaml ./pnpm-lock.yaml

# Install pnpm globally
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the NestJS application
RUN pnpm run build

# Expose the port the app runs on
EXPOSE 3000

# Run the application
CMD ["node", "dist/main"]
