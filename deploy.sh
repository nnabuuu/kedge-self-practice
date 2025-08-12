#!/bin/bash

# ==============================================
# KEDGE SELF-PRACTICE PLATFORM DEPLOYMENT SCRIPT
# ==============================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="kedge-self-practice"
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.prod"
BACKUP_DIR="backups"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command_exists docker-compose; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    if [ ! -f "$ENV_FILE" ]; then
        print_warning "Environment file $ENV_FILE not found."
        if [ -f ".env.prod.example" ]; then
            print_status "Copying example environment file..."
            cp .env.prod.example $ENV_FILE
            print_warning "Please edit $ENV_FILE with your configuration before proceeding."
            exit 1
        else
            print_error "No environment file template found."
            exit 1
        fi
    fi
    
    print_success "Prerequisites check passed."
}

# Function to create backup
create_backup() {
    print_status "Creating backup..."
    
    mkdir -p $BACKUP_DIR
    
    # Backup database if running
    if docker-compose -f $COMPOSE_FILE ps postgres | grep -q "Up"; then
        print_status "Backing up database..."
        docker-compose -f $COMPOSE_FILE exec -T postgres pg_dump -U kedge_user kedge_practice | gzip > "$BACKUP_DIR/db_backup_$(date +%Y%m%d_%H%M%S).sql.gz"
    fi
    
    # Backup volumes
    if docker volume ls | grep -q "${PROJECT_NAME}_quiz_storage"; then
        print_status "Backing up quiz storage..."
        docker run --rm -v "${PROJECT_NAME}_quiz_storage:/data" -v "$(pwd)/$BACKUP_DIR:/backup" alpine tar czf "/backup/quiz_storage_$(date +%Y%m%d_%H%M%S).tar.gz" -C /data .
    fi
    
    print_success "Backup completed."
}

# Function to setup SSL certificates
setup_ssl() {
    print_status "Setting up SSL certificates..."
    
    if command_exists certbot; then
        # Load environment variables
        source $ENV_FILE
        
        if [ -n "$API_DOMAIN" ] && [ -n "$PRACTICE_DOMAIN" ] && [ -n "$PARSER_DOMAIN" ]; then
            print_status "Obtaining SSL certificates..."
            certbot --nginx -d $API_DOMAIN -d $PRACTICE_DOMAIN -d $PARSER_DOMAIN --non-interactive --agree-tos --email ${LETSENCRYPT_EMAIL:-admin@$API_DOMAIN}
        else
            print_warning "Domain names not configured in $ENV_FILE. Skipping SSL setup."
        fi
    else
        print_warning "Certbot not installed. SSL certificates not configured."
        print_status "To install certbot: sudo apt-get install certbot python3-certbot-nginx"
    fi
}

# Function to generate secrets
generate_secrets() {
    print_status "Checking secrets in environment file..."
    
    # Check if secrets need to be generated
    if grep -q "change_me\|your_" $ENV_FILE; then
        print_warning "Default secrets found in $ENV_FILE. Generating secure secrets..."
        
        # Generate secure random passwords
        DB_PASS=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
        REDIS_PASS=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
        JWT_SECRET=$(openssl rand -base64 48 | tr -d "=+/")
        HASURA_SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
        
        # Replace in file
        sed -i.bak "s/your_super_secure_db_password_here_change_me/$DB_PASS/" $ENV_FILE
        sed -i.bak "s/your_secure_redis_password_here_change_me/$REDIS_PASS/" $ENV_FILE
        sed -i.bak "s/your_super_secure_jwt_secret_key_here_minimum_32_characters_required/$JWT_SECRET/" $ENV_FILE
        sed -i.bak "s/your_hasura_admin_secret_here_change_me/$HASURA_SECRET/" $ENV_FILE
        
        print_success "Secure secrets generated and saved to $ENV_FILE"
        print_warning "Backup of original file saved as ${ENV_FILE}.bak"
    else
        print_success "Secrets already configured."
    fi
}

# Function to deploy application
deploy() {
    print_status "Starting deployment..."
    
    # Pull latest images
    print_status "Pulling base images..."
    docker-compose -f $COMPOSE_FILE pull postgres redis hasura nginx
    
    # Build and start services
    print_status "Building and starting services..."
    docker-compose -f $COMPOSE_FILE up -d --build
    
    # Wait for services to be healthy
    print_status "Waiting for services to be healthy..."
    
    local max_attempts=60
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose -f $COMPOSE_FILE ps | grep -E "(postgres|redis|api-server)" | grep -q "healthy"; then
            print_success "Core services are healthy."
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            print_error "Services did not become healthy within expected time."
            docker-compose -f $COMPOSE_FILE logs --tail=50
            exit 1
        fi
        
        print_status "Waiting for services... (attempt $attempt/$max_attempts)"
        sleep 10
        ((attempt++))
    done
    
    # Run database migrations if needed
    print_status "Running database migrations..."
    docker-compose -f $COMPOSE_FILE exec api-server npm run migrate || print_warning "Migration failed or not configured"
    
    print_success "Deployment completed successfully!"
}

# Function to show status
show_status() {
    print_status "Service Status:"
    docker-compose -f $COMPOSE_FILE ps
    
    echo ""
    print_status "Service URLs:"
    source $ENV_FILE
    echo "API Server: http://localhost:${API_PORT:-8718}/api/v1/health"
    echo "Practice App: http://localhost:${PRACTICE_PORT:-5174}"
    echo "Quiz Parser: http://localhost:${PARSER_PORT:-5173}"
    echo "Hasura Console: http://localhost:${HASURA_PORT:-28717}"
    
    if [ -n "$API_DOMAIN" ]; then
        echo ""
        print_status "Production URLs:"
        echo "API Server: https://$API_DOMAIN/api/v1/health"
        echo "Practice App: https://$PRACTICE_DOMAIN"
        echo "Quiz Parser: https://$PARSER_DOMAIN"
    fi
}

# Function to show logs
show_logs() {
    local service=${1:-}
    if [ -n "$service" ]; then
        docker-compose -f $COMPOSE_FILE logs -f "$service"
    else
        docker-compose -f $COMPOSE_FILE logs -f
    fi
}

# Function to stop services
stop_services() {
    print_status "Stopping services..."
    docker-compose -f $COMPOSE_FILE down
    print_success "Services stopped."
}

# Function to cleanup
cleanup() {
    print_warning "This will remove all containers, volumes, and data. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        print_status "Removing containers and volumes..."
        docker-compose -f $COMPOSE_FILE down -v --remove-orphans
        docker system prune -f
        print_success "Cleanup completed."
    else
        print_status "Cleanup cancelled."
    fi
}

# Function to update application
update() {
    print_status "Updating application..."
    
    # Create backup before update
    create_backup
    
    # Pull latest code (if in git repo)
    if [ -d ".git" ]; then
        print_status "Pulling latest code..."
        git pull
    fi
    
    # Rebuild and restart services
    print_status "Rebuilding services..."
    docker-compose -f $COMPOSE_FILE build --no-cache
    docker-compose -f $COMPOSE_FILE up -d
    
    print_success "Update completed."
}

# Function to show help
show_help() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  deploy      Deploy the application (default)"
    echo "  status      Show service status"
    echo "  logs        Show service logs (optionally specify service name)"
    echo "  stop        Stop all services"
    echo "  cleanup     Remove all containers and volumes"
    echo "  update      Update application to latest version"
    echo "  backup      Create backup of data"
    echo "  ssl         Setup SSL certificates"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 deploy              # Deploy application"
    echo "  $0 logs api-server     # Show API server logs"
    echo "  $0 status              # Show service status"
    echo ""
}

# Main script logic
main() {
    local command=${1:-deploy}
    
    case $command in
        deploy)
            check_prerequisites
            generate_secrets
            deploy
            show_status
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs "$2"
            ;;
        stop)
            stop_services
            ;;
        cleanup)
            cleanup
            ;;
        update)
            check_prerequisites
            update
            show_status
            ;;
        backup)
            create_backup
            ;;
        ssl)
            setup_ssl
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"