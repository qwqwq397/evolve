@echo off
echo 正在编译进化游戏（静态链接版本）...
echo.

:: 删除旧的构建文件
if exist build rmdir /s /q build
mkdir build

:: 编译项目 - 使用静态链接避免DLL依赖
echo 使用g++静态编译...
g++ -std=c++11 -DUNICODE -D_UNICODE -static -static-libgcc -static-libstdc++ -Iinclude src/main.cpp src/ui/Window.cpp -o EvolutionGame.exe -luser32 -lgdi32 -lkernel32 -lcomctl32 -lgdi32 -lcomctl32 -mwindows -Wl,--subsystem,windows

if %ERRORLEVEL% == 0 (
    echo.
    echo 编译成功！
    echo 文件：EvolutionGame.exe（静态链接版本）
) else (
    echo.
    echo 编译失败！
)

pause