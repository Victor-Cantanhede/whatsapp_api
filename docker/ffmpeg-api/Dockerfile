FROM node:20-alpine

# Install FFmpeg
RUN apk add --no-cache ffmpeg

# Set working directory
WORKDIR /app

# Copy package info and install dependencies
COPY package.json ./
RUN npm install

# Copy application code
COPY server.js ./

# Create upload directory
RUN mkdir -p /tmp/ffmpeg-api-uploads

# Expose the API port
EXPOSE 5004

# Start the API
CMD ["node", "server.js"]
