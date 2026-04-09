# Use Node.js 18 slim as stable base
FROM node:18-slim

# Install system dependencies for Ansible and Windows management (pywinrm)
RUN apt-get update && apt-get install -y \
    ansible \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Install pywinrm for Ansible to communicate with Windows Senses Boards
RUN pip3 install --no-cache-dir pywinrm --break-system-packages

# Create app directory
WORKDIR /usr/src/app

# Copy dependency files
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Set environment variable to help the app detect Docker
ENV DOCKER_ENV=true

# Start the application
CMD [ "node", "server.js" ]
