# 匿名聊天室部署指南

## 🚀 快速部署

### 方式一：自动部署脚本（推荐）

```bash
# 1. 将项目上传到服务器
scp -r anonymous-chat user@your-server:/home/user/

# 2. SSH 登录服务器
ssh user@your-server

# 3. 进入项目目录并运行部署脚本
cd anonymous-chat
chmod +x deploy.sh
./deploy.sh
```

部署完成后，访问 `http://your-server-ip` 即可使用。

---

### 方式二：Docker 部署

```bash
# 1. 进入项目目录
cd anonymous-chat

# 2. 启动容器
docker-compose up -d

# 3. 查看日志
docker-compose logs -f
```

访问 `http://localhost:3000` 或 `http://your-server-ip`。

---

### 方式三：手动部署

#### 1. 环境准备

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -y nodejs npm nginx git
```

**CentOS/RHEL:**
```bash
sudo yum update -y
sudo yum install -y nodejs npm nginx git
```

#### 2. 安装 PM2

```bash
sudo npm install -g pm2
```

#### 3. 部署应用

```bash
# 克隆或上传项目
cd /var/www
sudo mkdir -p anonymous-chat
sudo chown $USER:$USER anonymous-chat

# 复制项目文件到服务器
cp -r /path/to/anonymous-chat/* /var/www/anonymous-chat/

# 进入目录
cd /var/www/anonymous-chat

# 安装依赖
npm ci --production

# 创建日志目录
mkdir -p logs

# 复制环境配置
cp .env.example .env
```

#### 4. 启动应用

```bash
# 使用 PM2 启动
pm2 start ecosystem.config.js --env production

# 保存配置
pm2 save
pm2 startup
```

#### 5. 配置 Nginx

```bash
sudo tee /etc/nginx/sites-available/anonymous-chat <<'EOF'
server {
    listen 80;
    server_name your-domain.com;  # 修改为你的域名

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# 启用配置
sudo ln -sf /etc/nginx/sites-available/anonymous-chat /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

---

## ☁️ 云平台部署

### Vercel 部署

1. 将代码推送到 GitHub
2. 登录 [Vercel](https://vercel.com)
3. 导入项目
4. 环境变量设置：
   - `NODE_ENV` = `production`
5. 部署完成

**注意**: Vercel 不支持 WebSocket，需要使用 Vercel 的 Serverless Functions。

### Railway 部署

1. 将代码推送到 GitHub
2. 登录 [Railway](https://railway.app)
3. 新建项目，选择 GitHub 仓库
4. 添加环境变量
5. 自动部署

### Render 部署

1. 将代码推送到 GitHub
2. 登录 [Render](https://render.com)
3. 新建 Web Service
4. 选择 GitHub 仓库
5. 配置：
   - Build Command: `npm install`
   - Start Command: `npm start`
6. 部署

### 阿里云/腾讯云/华为云

使用云服务器 ECS，然后按照上面的手动部署步骤操作。

---

## 🔒 HTTPS 配置

### 使用 Let's Encrypt

```bash
# 安装 Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

### 手动配置 SSL

```bash
# 编辑 Nginx 配置
sudo nano /etc/nginx/sites-available/anonymous-chat
```

添加 SSL 配置：
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        # ... 其他配置
    }
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## 📊 监控与维护

### PM2 常用命令

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs anonymous-chat
pm2 logs anonymous-chat --lines 100

# 重启应用
pm2 restart anonymous-chat

# 停止应用
pm2 stop anonymous-chat

# 删除应用
pm2 delete anonymous-chat

# 监控面板
pm2 monit
```

### 日志查看

```bash
# 应用日志
tail -f /var/www/anonymous-chat/logs/out.log
tail -f /var/www/anonymous-chat/logs/error.log

# Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 更新应用

```bash
cd /var/www/anonymous-chat

# 拉取最新代码
git pull

# 安装依赖
npm ci --production

# 重启应用
pm2 restart anonymous-chat
```

---

## 🛠️ 故障排查

### 应用无法启动

```bash
# 检查端口占用
sudo lsof -i :3000

# 检查应用日志
pm2 logs

# 检查 Node.js 版本
node --version  # 需要 v16+
```

### Nginx 502 错误

```bash
# 检查应用是否运行
pm2 status

# 检查 Nginx 配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### WebSocket 连接失败

```bash
# 检查防火墙
sudo ufw status
sudo ufw allow 3000/tcp

# 检查 Nginx WebSocket 配置
# 确保有 proxy_set_header Upgrade $http_upgrade;
```

---

## 📈 性能优化

### 启用 Gzip 压缩

在 Nginx 配置中添加：
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
```

### 使用 CDN

将静态资源上传到 CDN，修改 `public/index.html` 中的资源链接。

---

## 🔐 安全建议

1. **及时更新依赖**
   ```bash
   npm audit
   npm audit fix
   ```

2. **配置防火墙**
   ```bash
   sudo ufw default deny incoming
   sudo ufw default allow outgoing
   sudo ufw allow ssh
   sudo ufw allow http
   sudo ufw allow https
   sudo ufw enable
   ```

3. **使用非 root 用户运行应用**
   - 部署脚本已自动处理

4. **定期备份**
   ```bash
   # 备份脚本
   tar -czf backup-$(date +%Y%m%d).tar.gz /var/www/anonymous-chat
   ```

---

## 📞 获取帮助

如有问题，请检查：
1. 应用日志：`pm2 logs`
2. Nginx 日志：`/var/log/nginx/error.log`
3. 系统日志：`journalctl -u nginx`
