#!/bin/bash

# =================================================================
# UNIFIED ATTACHMENT CLEANUP SCRIPT
# =================================================================
# This script manages attachment files stored on the filesystem
# Works both locally and when run directly on remote servers via SSH
# =================================================================

set -e

# Configuration - Auto-detect or use environment variables
if [ -f "/.dockerenv" ] || [ -d "/var/quiz-storage" ]; then
    # Likely on production/remote server
    STORAGE_PATH="${QUIZ_STORAGE_PATH:-/var/quiz-storage}"
    DB_HOST="${DB_HOST:-10.64.0.40}"
    DB_PORT="${DB_PORT:-5432}"
    DB_USER="${DB_USER:-arthur}"
    DB_NAME="${DB_NAME:-arthur-test}"
    DB_PASSWORD="${PGPASSWORD:-arthur}"
    ENVIRONMENT="REMOTE"
else
    # Local development
    STORAGE_PATH="${QUIZ_STORAGE_PATH:-/tmp/quiz-storage}"
    DB_HOST="${DB_HOST:-localhost}"
    DB_PORT="${DB_PORT:-7543}"
    DB_USER="${DB_USER:-postgres}"
    DB_NAME="${DB_NAME:-kedge_db}"
    DB_PASSWORD="${PGPASSWORD:-postgres}"
    ENVIRONMENT="LOCAL"
fi

# Override with command line argument if provided
if [ "$1" = "--path" ] && [ -n "$2" ]; then
    STORAGE_PATH="$2"
    shift 2
fi

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_section() {
    echo ""
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${PURPLE}  $1${NC}"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Function to check database connectivity
check_database() {
    if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to scan attachments
scan_attachments() {
    log_section "Scanning Attachments"
    
    log_info "Environment: $ENVIRONMENT"
    log_info "Storage Path: $STORAGE_PATH"
    log_info "Database: $DB_NAME @ $DB_HOST:$DB_PORT"
    echo ""
    
    if [ ! -d "$STORAGE_PATH" ]; then
        log_warn "Storage path does not exist: $STORAGE_PATH"
        echo "  Creating directory..."
        mkdir -p "$STORAGE_PATH"
        log_info "✓ Directory created"
        return
    fi
    
    # Count files by year/month
    echo "Files by Year/Month:"
    echo "─────────────────────"
    
    total_by_month=0
    for year_dir in "$STORAGE_PATH"/[0-9][0-9][0-9][0-9]; do
        if [ -d "$year_dir" ]; then
            year=$(basename "$year_dir")
            for month_dir in "$year_dir"/[0-9][0-9]; do
                if [ -d "$month_dir" ]; then
                    month=$(basename "$month_dir")
                    count=$(find "$month_dir" -type f 2>/dev/null | wc -l)
                    if [ "$count" -gt 0 ]; then
                        size=$(du -sh "$month_dir" 2>/dev/null | cut -f1)
                        printf "  ${CYAN}%s/%s${NC}: %d files (%s)\n" "$year" "$month" "$count" "$size"
                        total_by_month=$((total_by_month + count))
                    fi
                fi
            done
        fi
    done
    
    if [ "$total_by_month" -eq 0 ]; then
        echo "  No files found in year/month structure"
    fi
    
    # Check for files outside year/month structure
    other_files=$(find "$STORAGE_PATH" -maxdepth 1 -type f 2>/dev/null | wc -l)
    if [ "$other_files" -gt 0 ]; then
        echo ""
        log_warn "Found $other_files files outside year/month structure"
    fi
    
    # Total statistics
    echo ""
    echo "Summary:"
    echo "────────"
    total_files=$(find "$STORAGE_PATH" -type f 2>/dev/null | wc -l)
    total_size=$(du -sh "$STORAGE_PATH" 2>/dev/null | cut -f1 || echo "0")
    echo "  Total Files: ${GREEN}$total_files${NC}"
    echo "  Total Size: ${GREEN}$total_size${NC}"
    
    # File types breakdown
    if [ "$total_files" -gt 0 ]; then
        echo ""
        echo "File Types:"
        echo "───────────"
        find "$STORAGE_PATH" -type f -name "*.*" 2>/dev/null | \
            sed 's/.*\.//' | sort | uniq -c | sort -rn | \
            while read count ext; do
                printf "  %-10s: %d files\n" ".$ext" "$count"
            done
    fi
}

# Function to find orphaned attachments
find_orphaned() {
    log_section "Finding Orphaned Attachments"
    
    if [ ! -d "$STORAGE_PATH" ]; then
        log_error "Storage path does not exist: $STORAGE_PATH"
        return 1
    fi
    
    # Check database connectivity
    if ! check_database; then
        log_warn "Cannot connect to database"
        echo "  Connection: $DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
        echo ""
        echo "All files will be considered orphaned since database is not accessible."
        echo ""
        
        # Count all files
        total_files=$(find "$STORAGE_PATH" -type f 2>/dev/null | wc -l)
        if [ "$total_files" -gt 0 ]; then
            total_size=$(du -sh "$STORAGE_PATH" 2>/dev/null | cut -f1)
            log_warn "Found $total_files potentially orphaned files ($total_size)"
        else
            log_info "No files found in storage"
        fi
        return 0
    fi
    
    log_info "Checking database for referenced attachments..."
    
    # Get all image references from quizzes table
    REFERENCED_IMAGES=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "
        SELECT DISTINCT jsonb_array_elements_text(images)
        FROM kedge_practice.quizzes 
        WHERE images IS NOT NULL AND images != '[]'::jsonb
    " 2>/dev/null | grep -oE '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}' | sort -u) || REFERENCED_IMAGES=""
    
    # Get all attachment IDs from attachments table (if it exists)
    TRACKED_ATTACHMENTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "
        SELECT file_id FROM kedge_practice.attachments
    " 2>/dev/null | grep -v '^$' | sort -u) || TRACKED_ATTACHMENTS=""
    
    # Combine referenced and tracked
    ALL_REFERENCED=$(echo -e "$REFERENCED_IMAGES\n$TRACKED_ATTACHMENTS" | grep -v '^$' | sort -u)
    
    ref_count=$(echo "$ALL_REFERENCED" | grep -c . || echo "0")
    log_info "Found $ref_count referenced attachments in database"
    
    # Find all files on disk
    log_info "Scanning filesystem..."
    ALL_FILES=$(find "$STORAGE_PATH" -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.gif" \) 2>/dev/null | \
                xargs -I {} basename {} | sed 's/\.[^.]*$//' | sort -u)
    file_count=$(echo "$ALL_FILES" | grep -c . || echo "0")
    log_info "Found $file_count files on disk"
    
    # Find orphaned files
    if [ "$ref_count" -eq 0 ]; then
        # No references in database, all files are orphaned
        ORPHANED="$ALL_FILES"
    else
        ORPHANED=$(comm -13 <(echo "$ALL_REFERENCED") <(echo "$ALL_FILES") 2>/dev/null || echo "$ALL_FILES")
    fi
    
    orphan_count=$(echo "$ORPHANED" | grep -c . || echo "0")
    
    echo ""
    if [ "$orphan_count" -gt 0 ]; then
        log_warn "Found $orphan_count orphaned files"
        echo ""
        echo "Sample orphaned files (first 10):"
        echo "──────────────────────────────────"
        
        shown=0
        echo "$ORPHANED" | head -10 | while read uuid; do
            if [ -n "$uuid" ]; then
                file=$(find "$STORAGE_PATH" -name "$uuid.*" -type f 2>/dev/null | head -1)
                if [ -n "$file" ]; then
                    size=$(du -h "$file" 2>/dev/null | cut -f1)
                    name=$(basename "$file")
                    echo "  • $name ($size)"
                    shown=$((shown + 1))
                fi
            fi
        done
        
        if [ "$orphan_count" -gt 10 ]; then
            echo "  ... and $((orphan_count - 10)) more"
        fi
        
        # Calculate total size of orphaned files
        echo ""
        echo "Calculating total orphaned size..."
        total_size=0
        echo "$ORPHANED" | while read uuid; do
            if [ -n "$uuid" ]; then
                find "$STORAGE_PATH" -name "$uuid.*" -type f -exec du -b {} \; 2>/dev/null | cut -f1
            fi
        done | awk '{s+=$1} END {if(s>0) printf "Total orphaned size: %.2f MB\n", s/1024/1024}'
    else
        log_info "✓ No orphaned files found!"
    fi
}

# Function to clean orphaned attachments
clean_orphaned() {
    log_section "Cleaning Orphaned Attachments"
    
    if [ ! -d "$STORAGE_PATH" ]; then
        log_error "Storage path does not exist: $STORAGE_PATH"
        return 1
    fi
    
    echo -e "${YELLOW}This will DELETE orphaned attachment files!${NC}"
    echo "Storage path: $STORAGE_PATH"
    echo ""
    
    # First find orphaned files
    log_info "Finding orphaned files..."
    
    # Try to get references from database
    if check_database; then
        REFERENCED_IMAGES=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "
            SELECT DISTINCT jsonb_array_elements_text(images)
            FROM kedge_practice.quizzes 
            WHERE images IS NOT NULL AND images != '[]'::jsonb
        " 2>/dev/null | grep -oE '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}' | sort -u) || REFERENCED_IMAGES=""
        
        TRACKED_ATTACHMENTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "
            SELECT file_id FROM kedge_practice.attachments
        " 2>/dev/null | grep -v '^$' | sort -u) || TRACKED_ATTACHMENTS=""
        
        ALL_REFERENCED=$(echo -e "$REFERENCED_IMAGES\n$TRACKED_ATTACHMENTS" | grep -v '^$' | sort -u)
    else
        log_warn "Database not accessible - all files will be considered orphaned"
        ALL_REFERENCED=""
    fi
    
    ALL_FILES=$(find "$STORAGE_PATH" -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.gif" \) 2>/dev/null | \
                xargs -I {} basename {} | sed 's/\.[^.]*$//' | sort -u)
    
    if [ -z "$ALL_REFERENCED" ]; then
        ORPHANED="$ALL_FILES"
    else
        ORPHANED=$(comm -13 <(echo "$ALL_REFERENCED") <(echo "$ALL_FILES") 2>/dev/null || echo "$ALL_FILES")
    fi
    
    orphan_count=$(echo "$ORPHANED" | grep -c . || echo "0")
    
    if [ "$orphan_count" -eq 0 ]; then
        log_info "No orphaned files to clean"
        return 0
    fi
    
    echo "Found $orphan_count orphaned files to delete"
    echo ""
    read -p "Type 'DELETE' to confirm: " confirmation
    
    if [ "$confirmation" != "DELETE" ]; then
        log_info "Cleanup cancelled"
        return 0
    fi
    
    log_info "Deleting orphaned files..."
    deleted=0
    failed=0
    
    echo "$ORPHANED" | while read uuid; do
        if [ -n "$uuid" ]; then
            files_deleted=$(find "$STORAGE_PATH" -name "$uuid.*" -type f -delete -print 2>/dev/null | wc -l)
            if [ "$files_deleted" -gt 0 ]; then
                deleted=$((deleted + 1))
                if [ $((deleted % 10)) -eq 0 ]; then
                    echo "  Deleted $deleted files..."
                fi
            else
                failed=$((failed + 1))
            fi
        fi
    done
    
    # Clean empty directories
    log_info "Cleaning empty directories..."
    find "$STORAGE_PATH" -type d -empty -delete 2>/dev/null || true
    
    echo ""
    log_info "✓ Cleanup complete!"
    log_info "  Deleted: $orphan_count orphaned files"
}

# Function to clean ALL attachments
clean_all() {
    log_section "COMPLETE ATTACHMENT CLEANUP"
    
    echo -e "${RED}⚠️  WARNING: This will DELETE ALL attachment files!${NC}"
    echo -e "${RED}   This includes both referenced and orphaned files.${NC}"
    echo -e "${RED}   This action CANNOT be undone!${NC}"
    echo ""
    echo "Environment: $ENVIRONMENT"
    echo "Storage path: $STORAGE_PATH"
    
    if [ -d "$STORAGE_PATH" ]; then
        total_files=$(find "$STORAGE_PATH" -type f 2>/dev/null | wc -l)
        total_size=$(du -sh "$STORAGE_PATH" 2>/dev/null | cut -f1)
        echo ""
        echo "Files to delete: ${YELLOW}$total_files${NC}"
        echo "Total size: ${YELLOW}$total_size${NC}"
    else
        log_warn "Storage path does not exist"
        return 0
    fi
    
    echo ""
    read -p "Type 'DELETE ALL' to confirm: " confirmation
    
    if [ "$confirmation" != "DELETE ALL" ]; then
        log_info "Cleanup cancelled"
        return 0
    fi
    
    log_info "Deleting all attachments..."
    rm -rf "$STORAGE_PATH"/*
    
    # Recreate year/month structure for current year/month
    current_year=$(date +%Y)
    current_month=$(date +%m)
    mkdir -p "$STORAGE_PATH/$current_year/$current_month"
    
    log_info "✓ All attachments deleted"
    log_info "✓ Storage directory ready: $STORAGE_PATH"
}

# Function to backup attachments
backup_attachments() {
    log_section "Backing Up Attachments"
    
    BACKUP_DIR="${1:-./attachment_backup_$(date +%Y%m%d_%H%M%S)}"
    
    if [ ! -d "$STORAGE_PATH" ]; then
        log_error "Storage path does not exist: $STORAGE_PATH"
        return 1
    fi
    
    total_files=$(find "$STORAGE_PATH" -type f 2>/dev/null | wc -l)
    
    if [ "$total_files" -eq 0 ]; then
        log_warn "No files to backup"
        return 0
    fi
    
    log_info "Creating backup in: $BACKUP_DIR"
    log_info "Files to backup: $total_files"
    
    mkdir -p "$BACKUP_DIR"
    
    # Use rsync if available, otherwise use cp
    if command -v rsync > /dev/null 2>&1; then
        rsync -av --progress "$STORAGE_PATH/" "$BACKUP_DIR/"
    else
        cp -rv "$STORAGE_PATH"/* "$BACKUP_DIR/" 2>/dev/null || true
    fi
    
    # Create backup info file
    cat > "$BACKUP_DIR/backup_info.txt" << EOF
Attachment Backup
━━━━━━━━━━━━━━━━
Date: $(date)
Environment: $ENVIRONMENT
Source: $STORAGE_PATH
Database: $DB_NAME @ $DB_HOST:$DB_PORT
Total Files: $total_files
Total Size: $(du -sh "$STORAGE_PATH" 2>/dev/null | cut -f1)
EOF
    
    log_info "✓ Backup complete: $BACKUP_DIR"
}

# Function to show status
show_status() {
    log_section "Attachment Storage Status"
    
    echo "Configuration:"
    echo "─────────────"
    echo "  Environment: ${CYAN}$ENVIRONMENT${NC}"
    echo "  Storage Path: ${CYAN}$STORAGE_PATH${NC}"
    echo "  Database: ${CYAN}$DB_NAME${NC} @ ${CYAN}$DB_HOST:$DB_PORT${NC}"
    echo ""
    
    # Check storage
    if [ -d "$STORAGE_PATH" ]; then
        total_files=$(find "$STORAGE_PATH" -type f 2>/dev/null | wc -l)
        total_size=$(du -sh "$STORAGE_PATH" 2>/dev/null | cut -f1)
        echo "Storage Status:"
        echo "──────────────"
        echo "  Directory Exists: ${GREEN}✓${NC}"
        echo "  Total Files: $total_files"
        echo "  Total Size: $total_size"
    else
        echo "Storage Status:"
        echo "──────────────"
        echo "  Directory Exists: ${RED}✗${NC} (not found)"
    fi
    echo ""
    
    # Check database
    echo "Database Status:"
    echo "───────────────"
    if check_database; then
        echo "  Connection: ${GREEN}✓${NC}"
        
        # Get counts from database
        quiz_count=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "
            SELECT COUNT(*) FROM kedge_practice.quizzes WHERE images IS NOT NULL AND images != '[]'::jsonb
        " 2>/dev/null || echo "0")
        
        image_count=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "
            SELECT COUNT(DISTINCT jsonb_array_elements_text(images))
            FROM kedge_practice.quizzes 
            WHERE images IS NOT NULL AND images != '[]'::jsonb
        " 2>/dev/null || echo "0")
        
        echo "  Quizzes with images: $quiz_count"
        echo "  Referenced images: $image_count"
    else
        echo "  Connection: ${RED}✗${NC}"
        echo "  Cannot retrieve database statistics"
    fi
}

# Interactive menu
show_menu() {
    clear
    echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║    Unified Attachment Management      ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo "Environment: ${YELLOW}$ENVIRONMENT${NC}"
    echo "Storage: $STORAGE_PATH"
    echo "Database: $DB_NAME @ $DB_HOST"
    echo ""
    echo "Commands:"
    echo "─────────"
    echo "  ${CYAN}1${NC}. Show Status"
    echo "  ${CYAN}2${NC}. Scan Attachments"
    echo "  ${CYAN}3${NC}. Find Orphaned Files"
    echo "  ${CYAN}4${NC}. Clean Orphaned Files"
    echo "  ${CYAN}5${NC}. Backup Attachments"
    echo "  ${CYAN}6${NC}. Clean ALL Files ${RED}(Dangerous!)${NC}"
    echo "  ${CYAN}0${NC}. Exit"
    echo ""
    read -p "Select option: " choice
    
    case "$choice" in
        1) show_status ;;
        2) scan_attachments ;;
        3) find_orphaned ;;
        4) clean_orphaned ;;
        5) 
            read -p "Backup directory [./backup]: " dir
            backup_attachments "${dir:-./backup}"
            ;;
        6) clean_all ;;
        0) exit 0 ;;
        *) log_error "Invalid option" ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
    show_menu
}

# Help message
show_help() {
    echo "Unified Attachment Cleanup Script"
    echo "================================="
    echo ""
    echo "Usage: $0 [options] [command]"
    echo ""
    echo "Options:"
    echo "  --path PATH        Override storage path"
    echo "  --help            Show this help message"
    echo ""
    echo "Commands:"
    echo "  status            Show current status"
    echo "  scan              Scan and analyze attachments"
    echo "  orphaned          Find orphaned files"
    echo "  clean             Clean orphaned files"
    echo "  clean-all         Delete ALL files (dangerous!)"
    echo "  backup [dir]      Backup attachments"
    echo "  menu              Interactive menu (default)"
    echo ""
    echo "Environment Variables:"
    echo "  QUIZ_STORAGE_PATH  Storage directory path"
    echo "  DB_HOST           Database host"
    echo "  DB_PORT           Database port"
    echo "  DB_NAME           Database name"
    echo "  DB_USER           Database user"
    echo "  PGPASSWORD        Database password"
    echo ""
    echo "Examples:"
    echo "  $0 status                    # Show status"
    echo "  $0 scan                      # Scan attachments"
    echo "  $0 orphaned                  # Find orphaned files"
    echo "  $0 clean                     # Clean orphaned files"
    echo "  $0 backup ./my-backup        # Backup to directory"
    echo "  $0 --path /var/storage scan  # Scan specific path"
    echo ""
    echo "Auto-Detection:"
    echo "  • Detects if running on remote server (checks for /var/quiz-storage)"
    echo "  • Uses appropriate database settings for environment"
    echo "  • Works both locally and via SSH on remote servers"
}

# Main command dispatcher
case "${1:-menu}" in
    status) show_status ;;
    scan) scan_attachments ;;
    orphaned|find) find_orphaned ;;
    clean) clean_orphaned ;;
    clean-all|nuclear) clean_all ;;
    backup) backup_attachments "$2" ;;
    menu) show_menu ;;
    --help|-h|help) show_help ;;
    *)
        log_error "Unknown command: $1"
        echo "Use '$0 --help' for usage information"
        exit 1
        ;;
esac