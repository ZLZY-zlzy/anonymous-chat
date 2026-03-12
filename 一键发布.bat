@echo off
chcp 65001 >nul
echo ====================================================
echo 🚀 匿名聊天室 - 一键发布工具
echo ====================================================
echo.

cd /d "C:\Users\Admin\WorkBuddy\20260312091516\anonymous-chat"

echo 步骤1: 初始化 Git 仓库...
git init
echo.

echo 步骤2: 添加所有文件...
git add .
echo.

echo 步骤3: 提交代码...
git commit -m "Initial commit" --quiet
echo.

echo 步骤4: 连接到 GitHub...
git remote remove origin 2>nul
git remote add origin https://github.com/ZLZY-zlzy/anonymous-chat.git
echo.

echo 步骤5: 推送到 GitHub...
echo 请在弹出的窗口中输入 GitHub 用户名和密码
echo.

:retry
git push -u origin main --force

if %errorlevel% equ 0 (
    echo.
    echo ====================================================
    echo ✅ 发布成功！
    echo ====================================================
    echo.
    echo 访问：https://github.com/ZLZY-zlzy/anonymous-chat
    echo.
    echo 下一步：部署到 Railway
    echo 1. 访问 https://railway.app
    echo 2. 用 GitHub 账号登录
    echo 3. 创建新项目，选择 GitHub repo
    echo 4. 选择 anonymous-chat 仓库
    echo 5. 等待自动部署完成
    echo ====================================================
    timeout /t 10
    exit /b 0
) else (
    echo.
    echo ❌ 推送失败
    echo.
    echo 建议：使用 GitHub Desktop 手动发布
    echo 1. 打开 GitHub Desktop
    echo 2. File → Add local repository
    echo 3. 选择项目文件夹
    echo 4. 点击 Publish repository
    echo.
    set /p retry="是否重试? (y/n): "
    if /i "%retry%"=="y" goto retry
    timeout /t 10
    exit /b 1
)
