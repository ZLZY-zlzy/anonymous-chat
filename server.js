const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"]
  }
});

// 配置
const CONFIG = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  ROOM_TIMEOUT_MINUTES: parseInt(process.env.ROOM_TIMEOUT_MINUTES) || 30,
  MAX_MESSAGES_PER_ROOM: parseInt(process.env.MAX_MESSAGES_PER_ROOM) || 200,
  MESSAGE_HISTORY_LIMIT: parseInt(process.env.MESSAGE_HISTORY_LIMIT) || 50
};

// 存储活跃房间和邀请码
const rooms = new Map();
const inviteCodes = new Map();
const userSockets = new Map();

// 日志工具
const logger = {
  info: (msg, data = '') => console.log(`[INFO] ${msg}`, data),
  error: (msg, error = '') => console.error(`[ERROR] ${msg}`, error),
  warn: (msg, data = '') => console.warn(`[WARN] ${msg}`, data),
  debug: (msg, data = '') => {
    if (CONFIG.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${msg}`, data);
    }
  }
};

// 生成随机邀请码
function generateInviteCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

// 生成随机匿名用户名
function generateAnonymousName() {
  const adjectives = ['快乐', '神秘', '安静', '活泼', '温柔', '帅气', '可爱', '聪明', '勇敢', '善良'];
  const nouns = ['小猫', '小狗', '兔子', '小鸟', '小熊', '小鹿', '小鱼', '小马', '小羊', '小狐狸'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 999).toString().padStart(3, '0');
  return `${adj}${noun}${num}`;
}

// 中间件
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// 请求日志中间件
app.use((req, res, next) => {
  const start = Date.now();
  logger.debug(`${req.method} ${req.url} - ${req.ip}`);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.debug(`${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
  });
  
  next();
});

// 错误处理中间件
app.use((err, req, res, next) => {
  logger.error(`服务器错误: ${req.method} ${req.url}`, err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: CONFIG.NODE_ENV === 'development' ? err.message : undefined
  });
});

// API路由
logger.info('初始化 API 路由...');

// 创建房间 API
app.post('/api/create-room', (req, res) => {
  try {
    const roomId = crypto.randomUUID();
    const inviteCode = generateInviteCode();
    
    const room = {
      id: roomId,
      inviteCode: inviteCode,
      createdAt: new Date(),
      users: new Map(),
      messages: []
    };
    
    rooms.set(roomId, room);
    inviteCodes.set(inviteCode, roomId);
    
    logger.info(`创建新房间: ${roomId}, 邀请码: ${inviteCode}`);
    
    res.json({
      success: true,
      roomId: roomId,
      inviteCode: inviteCode
    });
  } catch (error) {
    logger.error('创建房间失败', error);
    res.status(500).json({
      success: false,
      message: '创建房间失败'
    });
  }
});

// 验证邀请码 API
app.post('/api/verify-invite', (req, res) => {
  try {
    const { inviteCode } = req.body;
    
    if (!inviteCode || typeof inviteCode !== 'string') {
      return res.status(400).json({
        success: false,
        message: '邀请码格式错误'
      });
    }
    
    const roomId = inviteCodes.get(inviteCode.toUpperCase());
    
    if (roomId && rooms.has(roomId)) {
      logger.info(`验证邀请码成功: ${inviteCode.toUpperCase()} -> ${roomId}`);
      res.json({
        success: true,
        roomId: roomId
      });
    } else {
      logger.warn(`验证邀请码失败: ${inviteCode.toUpperCase()}`);
      res.status(404).json({
        success: false,
        message: '无效的邀请码'
      });
    }
  } catch (error) {
    logger.error('验证邀请码失败', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取房间信息 API
app.get('/api/room/:roomId', (req, res) => {
  try {
    const room = rooms.get(req.params.roomId);
    if (room) {
      res.json({
        success: true,
        userCount: room.users.size,
        createdAt: room.createdAt
      });
    } else {
      res.status(404).json({
        success: false,
        message: '房间不存在'
      });
    }
  } catch (error) {
    logger.error('获取房间信息失败', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// Socket.IO 连接处理
io.on('connection', (socket) => {
  logger.info(`用户连接: ${socket.id}, IP: ${socket.handshake.address}`);
  
  let currentRoom = null;
  let userName = null;
  
  // 加入房间
  socket.on('join-room', ({ roomId, inviteCode }) => {
    try {
      logger.info(`用户 ${socket.id} 尝试加入房间: ${roomId}`);
      
      const room = rooms.get(roomId);
      
      if (!room) {
        logger.warn(`房间不存在: ${roomId}`);
        socket.emit('error', { message: '房间不存在' });
        return;
      }
      
      if (room.inviteCode !== inviteCode.toUpperCase()) {
        logger.warn(`邀请码错误: ${inviteCode.toUpperCase()} != ${room.inviteCode}`);
        socket.emit('error', { message: '邀请码错误' });
        return;
      }
      
      // 生成匿名用户名
      userName = generateAnonymousName();
      currentRoom = roomId;
      
      // 加入房间
      socket.join(roomId);
      room.users.set(socket.id, {
        id: socket.id,
        name: userName,
        joinedAt: new Date()
      });
      userSockets.set(socket.id, { roomId, userName });
      
      // 发送历史消息
      socket.emit('room-joined', {
        roomId: roomId,
        userName: userName,
        userCount: room.users.size,
        messages: room.messages.slice(-CONFIG.MESSAGE_HISTORY_LIMIT)
      });
      
      // 通知其他用户
      socket.to(roomId).emit('user-joined', {
        userName: userName,
        userCount: room.users.size,
        message: `${userName} 加入了聊天室`
      });
      
      logger.info(`${userName} (${socket.id}) 成功加入房间 ${roomId}`);
    } catch (error) {
      logger.error(`加入房间失败: ${socket.id}`, error);
      socket.emit('error', { message: '加入房间失败' });
    }
  });
  
  // 发送消息
  socket.on('send-message', (content) => {
    try {
      if (!currentRoom || !rooms.has(currentRoom)) {
        logger.warn(`用户 ${socket.id} 尝试在未加入房间时发送消息`);
        socket.emit('error', { message: '未加入房间' });
        return;
      }
      
      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        logger.warn(`用户 ${socket.id} 发送了无效消息内容`);
        return;
      }
      
      const room = rooms.get(currentRoom);
      const message = {
        id: crypto.randomUUID(),
        userName: userName,
        content: content.trim(),
        timestamp: new Date(),
        type: 'text'
      };
      
      // 保存消息
      room.messages.push(message);
      
      // 限制消息数量
      if (room.messages.length > CONFIG.MAX_MESSAGES_PER_ROOM) {
        room.messages = room.messages.slice(-CONFIG.MAX_MESSAGES_PER_ROOM / 2);
        logger.debug(`房间 ${currentRoom} 消息数量超过限制，已清理`);
      }
      
      // 广播消息
      io.to(currentRoom).emit('new-message', message);
      logger.debug(`消息已广播到房间 ${currentRoom}: ${userName}`);
    } catch (error) {
      logger.error(`发送消息失败: ${socket.id}`, error);
      socket.emit('error', { message: '发送消息失败' });
    }
  });
  
  // 用户正在输入
  socket.on('typing', () => {
    try {
      if (currentRoom) {
        socket.to(currentRoom).emit('user-typing', { userName });
      }
    } catch (error) {
      logger.error(`输入状态更新失败: ${socket.id}`, error);
    }
  });
  
  // 停止输入
  socket.on('stop-typing', () => {
    try {
      if (currentRoom) {
        socket.to(currentRoom).emit('user-stop-typing', { userName });
      }
    } catch (error) {
      logger.error(`停止输入更新失败: ${socket.id}`, error);
    }
  });
  
  // 断开连接
  socket.on('disconnect', (reason) => {
    logger.info(`用户断开连接: ${socket.id}, 原因: ${reason}`);
    
    try {
      if (currentRoom && rooms.has(currentRoom)) {
        const room = rooms.get(currentRoom);
        room.users.delete(socket.id);
        userSockets.delete(socket.id);
        
        logger.info(`${userName} 离开房间 ${currentRoom}, 剩余用户数: ${room.users.size}`);
        
        // 通知其他用户
        socket.to(currentRoom).emit('user-left', {
          userName: userName,
          userCount: room.users.size,
          message: `${userName} 离开了聊天室`
        });
        
        // 如果房间空了，设置定时删除
        if (room.users.size === 0) {
          const timeout = CONFIG.ROOM_TIMEOUT_MINUTES * 60 * 1000;
          logger.info(`房间 ${currentRoom} 已空，将在 ${CONFIG.ROOM_TIMEOUT_MINUTES} 分钟后删除`);
          
          setTimeout(() => {
            if (room.users.size === 0) {
              rooms.delete(currentRoom);
              inviteCodes.delete(room.inviteCode);
              logger.info(`房间 ${currentRoom} 已自动删除`);
            }
          }, timeout);
        }
      }
    } catch (error) {
      logger.error(`处理断开连接失败: ${socket.id}`, error);
    }
  });
});

// 健康检查端点（Railway必需）
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date(),
    uptime: process.uptime(),
    rooms: rooms.size,
    connections: userSockets.size
  });
});

// API 信息端点
app.get('/api/info', (req, res) => {
  res.json({
    success: true,
    version: '1.0.0',
    rooms: rooms.size,
    connections: userSockets.size,
    uptime: process.uptime(),
    nodeVersion: process.version,
    environment: CONFIG.NODE_ENV
  });
});

// 首页路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 聊天室路由
app.get('/chat/:roomId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

// 404 处理
app.use((req, res) => {
  logger.warn(`404 请求: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    message: '请求的资源不存在'
  });
});

// 启动服务器
server.listen(CONFIG.PORT, '0.0.0.0', () => {
  logger.info('='.repeat(50));
  logger.info('匿名聊天服务器启动成功');
  logger.info('='.repeat(50));
  logger.info(`绑定地址: 0.0.0.0:${CONFIG.PORT}`);
  logger.info(`环境变量端口: ${process.env.PORT || '未设置(使用默认3000)'}`);
  logger.info(`运行环境: ${CONFIG.NODE_ENV}`);
  logger.info(`Node版本: ${process.version}`);
  logger.info('='.repeat(50));
  logger.info(`健康检查: http://0.0.0.0:${CONFIG.PORT}/health`);
  logger.info(`访问首页: http://0.0.0.0:${CONFIG.PORT}`);
  logger.info(`API信息: http://0.0.0.0:${CONFIG.PORT}/api/info`);
  logger.info('='.repeat(50));
});

// 优雅退出
process.on('SIGTERM', () => {
  logger.info('收到 SIGTERM 信号，正在关闭服务器...');
  server.close(() => {
    logger.info('服务器已关闭');
    process.exit(0);
  });
});

process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的Promise拒绝', reason);
  process.exit(1);
});
