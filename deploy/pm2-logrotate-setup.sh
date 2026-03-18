#!/usr/bin/env bash
# Configure PM2 log rotation
pm2 install pm2-logrotate

pm2 set pm2-logrotate:max_size 50M      # rotate when log exceeds 50MB
pm2 set pm2-logrotate:retain 14         # keep 14 rotated files (~2 weeks)
pm2 set pm2-logrotate:compress true     # gzip old logs
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss
pm2 set pm2-logrotate:rotateInterval '0 0 * * *'  # rotate daily at midnight

echo "PM2 log rotation configured"
pm2 get pm2-logrotate
