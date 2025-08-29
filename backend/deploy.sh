#!/bin/bash

# Kedge Backend Docker Deployment Script
# This script helps deploy the backend with proper environment configuration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
CONFIG_DIR="${CONFIG_DIR:-../config}"
ENV_FILE="${ENV_FILE:-$CONFIG_DIR/.env}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.backend.yaml}"
IMAGE_NAME="${IMAGE_NAME:-kedge-backend}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

# Functions
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    print_info "Checking requirements..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_warn "docker-compose is not installed, trying docker compose..."
        if ! docker compose version &> /dev/null; then
            print_error "Docker Compose is not installed"
            exit 1
        fi
        DOCKER_COMPOSE="docker compose"
    else
        DOCKER_COMPOSE="docker-compose"
    fi
    
    print_info "Requirements satisfied"
}

setup_config() {
    print_info "Setting up configuration..."
    
    # Create config directory if it doesn't exist
    if [ ! -d "$CONFIG_DIR" ]; then
        print_info "Creating config directory: $CONFIG_DIR"
        mkdir -p "$CONFIG_DIR"
    fi
    
    # Check if .env file exists
    if [ ! -f "$ENV_FILE" ]; then
        print_warn "Environment file not found at $ENV_FILE"
        
        # Offer to create from example
        if [ -f ".env.docker.example" ]; then
            read -p "Would you like to create one from .env.docker.example? (y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                cp .env.docker.example "$ENV_FILE"
                print_info "Created $ENV_FILE from example"
                print_warn "Please edit $ENV_FILE with your actual values before continuing"
                exit 0
            fi
        else
            print_error "No .env.docker.example found"
            exit 1
        fi
    fi
    
    # Validate required variables
    print_info "Validating environment configuration..."
    source "$ENV_FILE"
    
    required_vars=(
        "NODE_DATABASE_URL"
        "REDIS_HOST"
        "JWT_SECRET"
        "HASURA_GRAPHQL_ADMIN_SECRET"
    )
    
    missing_vars=()
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_error "Missing required environment variables:"
        printf '%s\n' "${missing_vars[@]}"
        print_warn "Please edit $ENV_FILE and set these variables"
        exit 1
    fi
    
    print_info "Configuration validated"
}

build_image() {
    print_info "Building Docker image..."
    
    # Build the image
    docker build \
        -f Dockerfile.backend \
        -t "${IMAGE_NAME}:${IMAGE_TAG}" \
        --build-arg NODE_ENV="${NODE_ENV:-production}" \
        --build-arg API_PORT="${API_PORT:-8718}" \
        .
    
    if [ $? -eq 0 ]; then
        print_info "Image built successfully: ${IMAGE_NAME}:${IMAGE_TAG}"
    else
        print_error "Failed to build image"
        exit 1
    fi
}

start_services() {
    print_info "Starting services..."
    
    # Export variables for docker-compose
    export ENV_FILE
    export CONFIG_DIR
    export IMAGE_NAME
    export IMAGE_TAG
    
    # Start services
    $DOCKER_COMPOSE -f "$COMPOSE_FILE" up -d
    
    if [ $? -eq 0 ]; then
        print_info "Services started successfully"
    else
        print_error "Failed to start services"
        exit 1
    fi
}

stop_services() {
    print_info "Stopping services..."
    
    $DOCKER_COMPOSE -f "$COMPOSE_FILE" down
    
    if [ $? -eq 0 ]; then
        print_info "Services stopped successfully"
    else
        print_error "Failed to stop services"
        exit 1
    fi
}

show_status() {
    print_info "Service status:"
    
    $DOCKER_COMPOSE -f "$COMPOSE_FILE" ps
    
    # Check API health
    print_info "Checking API health..."
    sleep 5
    
    if curl -f http://localhost:${API_PORT:-8718}/v1/health &> /dev/null; then
        print_info "API is healthy and responding"
    else
        print_warn "API is not responding yet. Check logs with: $DOCKER_COMPOSE -f $COMPOSE_FILE logs api-server"
    fi
}

show_logs() {
    $DOCKER_COMPOSE -f "$COMPOSE_FILE" logs -f "$1"
}

# Main script
case "${1:-}" in
    setup)
        check_requirements
        setup_config
        ;;
    build)
        check_requirements
        build_image
        ;;
    start)
        check_requirements
        setup_config
        build_image
        start_services
        show_status
        ;;
    stop)
        check_requirements
        stop_services
        ;;
    restart)
        check_requirements
        stop_services
        start_services
        show_status
        ;;
    status)
        check_requirements
        show_status
        ;;
    logs)
        check_requirements
        show_logs "${2:-api-server}"
        ;;
    clean)
        check_requirements
        print_warn "This will remove all containers and volumes. Are you sure? (y/n)"
        read -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            $DOCKER_COMPOSE -f "$COMPOSE_FILE" down -v
            print_info "Cleaned up containers and volumes"
        fi
        ;;
    *)
        echo "Kedge Backend Docker Deployment Script"
        echo ""
        echo "Usage: $0 {setup|build|start|stop|restart|status|logs|clean}"
        echo ""
        echo "Commands:"
        echo "  setup    - Check requirements and setup configuration"
        echo "  build    - Build Docker image"
        echo "  start    - Build image and start all services"
        echo "  stop     - Stop all services"
        echo "  restart  - Restart all services"
        echo "  status   - Show service status"
        echo "  logs     - Show logs (optionally specify service name)"
        echo "  clean    - Remove all containers and volumes"
        echo ""
        echo "Environment variables:"
        echo "  CONFIG_DIR   - Configuration directory (default: ../config)"
        echo "  ENV_FILE     - Environment file path (default: \$CONFIG_DIR/.env)"
        echo "  COMPOSE_FILE - Docker Compose file (default: docker-compose.backend.yaml)"
        echo "  IMAGE_NAME   - Docker image name (default: kedge-backend)"
        echo "  IMAGE_TAG    - Docker image tag (default: latest)"
        exit 1
        ;;
esac