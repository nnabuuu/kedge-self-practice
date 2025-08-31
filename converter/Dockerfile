# DOCX/EMF Converter Docker Image
# Includes all necessary tools for EMF/WMF conversion

FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine

# Install runtime dependencies
RUN apk add --no-cache \
    imagemagick \
    imagemagick-doc \
    imagemagick-dev \
    ghostscript \
    librsvg \
    inkscape \
    libreoffice \
    openjdk11-jre \
    fontconfig \
    ttf-liberation \
    ttf-dejavu \
    bash \
    curl

# Install additional fonts for better rendering
RUN apk add --no-cache \
    font-noto \
    font-noto-cjk \
    font-noto-extra

WORKDIR /app

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Create directories
RUN mkdir -p /app/input /app/output /app/temp

# Set environment variables
ENV NODE_ENV=production
ENV CONVERTER_OUTPUT=/app/output
ENV CONVERTER_TEMP=/app/temp

# Create a non-root user
RUN addgroup -g 1001 -S converter && \
    adduser -u 1001 -S converter -G converter && \
    chown -R converter:converter /app

USER converter

# Entry point
ENTRYPOINT ["node", "dist/index.js"]
CMD ["--help"]