# 匿名聊天室 - 邀请制

基于 WebSocket 的实时匿名聊天应用，支持邀请码机制，无需注册即可使用。

## ✨ 功能特性

- 🔒 **完全匿名** - 自动生成随机昵称，无需注册
- 🔐 **邀请制** - 只有知道邀请码的人才能加入聊天室
- ⚡ **实时通信** - 基于 Socket.IO 的即时消息传输
- 📱 **响应式设计** - 支持手机、平板、桌面设备
- 💬 **实时状态** - 显示正在输入状态
- 📝 **消息历史** - 自动保存最近 50 条消息
- 🧹 **自动清理** - 空房间 30 分钟后自动删除
- 🚀 **一键部署** - 支持 Railway、Render 等平台

## 🛠️ 技术栈

- **后端**: Node.js + Express + Socket.IO
- **前端**: HTML5 + CSS3 (Tailwind) + Vanilla JavaScript
- **部署**: 支持 Railway、Render、Docker

## 📦 安装部署

### 本地开发

```bash
# 克隆仓库
git clone <repository-url>
cd anonymous-chat

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

### 生产部署

#### Railway（推荐）

1. Fork 此仓库到你的 GitHub
2. 登录 [Railway.app](https://railway.app)
3. 点击 "Start a New Project" → "Deploy from GitHub repo"
4. 选择你的仓库并部署
5. Railway 会自动检测 Node.js 项目并部署

#### Render

1. Fork 此仓库
2. 登录 [Render.com](https://render.com)
3. 创建新的 Web Service
4. 连接你的 GitHub 仓库
5. 使用默认设置部署

#### Docker

```bash
# 构建镜像
docker build -t anonymous-chat .

# 运行容器
docker run -p 3000:3000 -d anonymous-chat
```

## 🔧 环境变量

创建 `.env` 文件（参考 `.env.example`）：

```env
# 服务器端口
PORT=3000

# Node 环境
NODE_ENV=production

# CORS 配置
CORS_ORIGIN=*

# 房间配置（分钟）
ROOM_TIMEOUT_MINUTES=30

# 消息限制
MAX_MESSAGES_PER_ROOM=200
MESSAGE_HISTORY_LIMIT=50
```

## 📡 API 文档

### 创建房间

```http
POST /api/create-room
```

**响应:**
```json
{
  "success": true,
  "roomId": "uuid-v4-string",
  "inviteCode": "ABCD1234"
}
```

### 验证邀请码

```http
POST /api/verify-invite
Content-Type: application/json

{
  "inviteCode": "ABCD1234"
}
```

**响应:**
```json
{
  "success": true,
  "roomId": "uuid-v4-string"
}
```

### 获取房间信息

```http
GET /api/room/:roomId
```

**响应:**
```json
{
  "success": true,
  "userCount": 3,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### 健康检查

```http
GET /health
```

**响应:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45,
  "rooms": 5,
  "connections": 12
}
```

### 服务器信息

```http
GET /api/info
```

**响应:**
```json
{
  "success": true,
  "version": "1.0.0",
  "rooms": 5,
  "connections": 12,
  "uptime": 123.45,
  "nodeVersion": "v18.x.x",
  "environment": "production"
}
```

## 💻 使用说明

### 创建聊天室

1. 访问首页 https://your-app-url.com
2. 点击 "创建房间" 按钮
3. 复制生成的 8 位邀请码
4. 分享给朋友

### 加入聊天室

1. 从朋友处获取 8 位邀请码
2. 在首页输入邀请码
3. 点击 "加入" 按钮
4. 开始聊天

### 邀请码格式

邀请码为 8 位大写字母和数字组合，例如：`A1B2C3D4`

## 🔍 故障排查

### Railway 部署失败

1. 确保 GitHub 仓库为 **Public**（公开）
2. 检查 `package.json` 中有 `start` 脚本
3. 确保已提交 `package-lock.json`
4. 检查 Railway 的 Root Directory 设置为 **留空**

### 连接问题

1. 检查网络连接
2. 确认邀请码是否正确
3. 查看浏览器控制台是否有错误
4. 尝试刷新页面

### 消息发送失败

1. 检查是否已加入房间
2. 确认 Socket.IO 连接正常
3. 查看服务器日志

## 📊 监控

访问 `/health` 查看服务器健康状态

访问 `/api/info` 查看服务器详细信息

## 📝 日志

服务器启动后会显示详细的启动信息：

```
[==================================================]
匿名聊天服务器启动成功
[==================================================]
绑定地址: 0.0.0.0:XXXX
环境变量端口: XXXX
运行环境: production
Node版本: v18.x.x
[==================================================]
健康检查: http://0.0.0.0:XXXX/health
访问首页: http://0.0.0.0:XXXX
API信息: http://0.0.0.0:XXXX/api/info
[==================================================]
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🔒 隐私说明

- 所有消息仅在内存中临时存储
- 房间为空后 30 分钟自动删除所有数据
- 不收集任何个人信息
- 完全匿名，无法追踪用户身份

## 🆘 支持

如有问题，请：

1. 查看本 README 的故障排查部分
2. 检查 [DEPLOY_FIX.md](./DEPLOY_FIX.md) 部署修复指南
3. 提交 Issue 到 GitHub
