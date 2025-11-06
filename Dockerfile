# Use Node.js 18 with Python 3.9
FROM node:18-bullseye

# Install Python and pip
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set Python alias
RUN ln -s /usr/bin/python3 /usr/bin/python

# Set working directory
WORKDIR /app

# Copy package.json files and install Node.js dependencies
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
RUN cd backend && npm install
RUN cd frontend && npm install

# Copy Python requirements and install
COPY backend/requirements.txt ./backend/
COPY ats-model/ATS-Scoring-System-main/requirements.txt ./ats-model/ATS-Scoring-System-main/
RUN pip3 install --no-cache-dir -r backend/requirements.txt
RUN pip3 install --no-cache-dir -r ats-model/ATS-Scoring-System-main/requirements.txt

# Copy the entire project
COPY . .

# Build the React frontend
RUN cd frontend && npm run build

# Move React build to backend
RUN mv frontend/build backend/

# Expose port
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PYTHONPATH=/app/ats-model/ATS-Scoring-System-main

# Start the backend server
CMD ["node", "backend/server.js"]
