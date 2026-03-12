#!/usr/bin/env python3
"""
自动发布匿名聊天室到 GitHub
使用方法：双击运行或在命令行执行：python auto-deploy.py
"""

import os
import sys
import json
import time
import subprocess
from pathlib import Path

def check_git_installed():
    """检查是否安装了 Git"""
    try:
        subprocess.run(['git', '--version'], capture_output=True, check=True)
        return True
    except:
        return False

def install_git():
    """安装 Git"""
    print("正在安装 Git...")
    # 下载 Git for Windows
    git_installer = "https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe"
    installer_path = os.path.join(os.getenv("TEMP"), "git-installer.exe")
    
    # 使用 PowerShell 下载
    cmd = f'powershell -Command "Invoke-WebRequest -Uri {git_installer} -OutFile {installer_path}"'
    subprocess.run(cmd, shell=True)
    
    # 静默安装 Git
    subprocess.run([installer_path, "/VERYSILENT", "/NORESTART", "/NOCANCEL"], shell=True)
    
    # 添加 Git 到 PATH
    git_path = r"C:\Program Files\Git\bin"
    os.environ["PATH"] += os.pathsep + git_path
    
    print("Git 安装完成！")
    time.sleep(3)  # 等待安装完成

def configure_git():
    """配置 Git"""
    print("配置 Git...")
    os.system('git config --global user.name "ZLZY-zlzy"')
    os.system('git config --global user.email "你的邮箱@example.com"')
    print("Git 配置完成！")

def deploy_to_github():
    """部署到 GitHub"""
    project_path = r"C:\Users\Admin\WorkBuddy\20260312091516\anonymous-chat"
    
    # 检查是否已在项目目录
    if os.getcwd() != project_path:
        os.chdir(project_path)
    
    print("初始化 Git 仓库...")
    os.system("git init")
    
    print("添加文件...")
    os.system("git add .")
    
    print("提交代码...")
    os.system('git commit -m "Initial commit"')
    
    print("连接到 GitHub...")
    os.system("git remote remove origin 2>nul")  # 忽略错误
    os.system("git remote add origin https://github.com/ZLZY-zlzy/anonymous-chat.git")
    
    print("推送到 GitHub...")
    print("请在弹出的窗口中输入 GitHub 用户名和密码")
    
    # 尝试推送，如果失败则提示用户使用 GitHub Desktop
    result = os.system("git push -u origin main --force")
    
    if result == 0:
        print("✅ 成功发布到 GitHub！")
        print("访问：https://github.com/ZLZY-zlzy/anonymous-chat")
        return True
    else:
        print("❌ 推送失败")
        print("建议：使用 GitHub Desktop 手动发布")
        return False

def main():
    print("=" * 60)
    print("🚀 匿名聊天室 - 自动发布工具")
    print("=" * 60)
    print()
    
    # 检查 Git 是否安装
    if not check_git_installed():
        print("Git 未安装，正在安装...")
        install_git()
    else:
        print("✅ Git 已安装")
    
    print()
    
    # 配置 Git
    configure_git()
    
    print()
    
    # 部署到 GitHub
    success = deploy_to_github()
    
    if success:
        print()
        print("=" * 60)
        print("🎉 下一步：部署到 Railway")
        print("1. 访问 https://railway.app")
        print("2. 用 GitHub 登录")
        print("3. 创建新项目，选择 GitHub repo")
        print("4. 选择 anonymous-chat 仓库")
        print("5. 等待自动部署完成")
        print("=" * 60)
    else:
        print()
        print("请使用 GitHub Desktop 手动发布：")
        print("1. 打开 GitHub Desktop")
        print("2. File → Add local repository")
        print("3. 选择项目文件夹")
        print("4. 点击 Publish repository")
    
    print()
    input("按回车键退出...")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"发生错误: {e}")
        input("按回车键退出...")
