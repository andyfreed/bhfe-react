@echo off
SETLOCAL EnableDelayedExpansion

echo BH Financial Education Installation Script
echo =====================================
echo.

REM Check if Docker is installed
WHERE docker >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo [31mDocker is not installed.[0m
    echo Please install Docker from https://docs.docker.com/get-docker/
    pause
    exit /b 1
) ELSE (
    echo [32m√[0m Docker is installed
)

REM Check if Docker is running
docker info >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo [31mDocker is not running. Please start Docker Desktop.[0m
    pause
    exit /b 1
) ELSE (
    echo [32m√[0m Docker is running
)

REM Check if .env file exists
IF EXIST .env (
    echo [33mA .env file already exists.[0m
    SET /P OVERWRITE="Do you want to overwrite it? (y/n): "
    IF /I "!OVERWRITE!" NEQ "y" (
        echo Keeping existing .env file.
    ) ELSE (
        SET CREATE_ENV=true
    )
) ELSE (
    SET CREATE_ENV=true
)

REM Create .env file if needed
IF "!CREATE_ENV!"=="true" (
    echo Creating .env file...
    
    REM Check if .env.example exists and copy it
    IF EXIST .env.example (
        copy .env.example .env > nul
        echo [32m√[0m Created .env file from template
    ) ELSE (
        REM Otherwise create a basic .env file
        (
            echo # Supabase Configuration
            echo NEXT_PUBLIC_SUPABASE_URL=https://ujgxftkzguriirozloxa.supabase.co
            echo NEXT_PUBLIC_SUPABASE_ANON_KEY=
            echo SUPABASE_SERVICE_ROLE_KEY=
            echo.
            echo # Development Mode Configuration
            echo NEXT_PUBLIC_USE_MOCK_AUTH=false
        ) > .env
        echo [32m√[0m Created basic .env file
    )

    REM Ask for Supabase credentials
    echo.
    echo [33mSupabase Configuration:[0m
    echo Please enter your Supabase credentials:
    
    SET /P ANON_KEY="Supabase Anon Key: "
    SET /P SERVICE_KEY="Supabase Service Role Key: "
    
    REM Create a temporary file with the updated content
    type .env | (
        for /f "tokens=*" %%a in ('findstr /v "NEXT_PUBLIC_SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY" .env') do (
            echo %%a
        )
        echo NEXT_PUBLIC_SUPABASE_ANON_KEY=!ANON_KEY!
        echo SUPABASE_SERVICE_ROLE_KEY=!SERVICE_KEY!
    ) > .env.tmp
    
    REM Replace the original file with the temporary file
    move /y .env.tmp .env > nul
    
    echo [32m√[0m Updated Supabase credentials in .env file
)

REM Ask for deployment mode
echo.
echo [33mDeployment Mode:[0m
echo 1) Production (optimized build)
echo 2) Development (with hot reloading)
SET /P DEPLOY_MODE="Choose deployment mode (1/2): "

REM Pull latest Docker images
echo Pulling latest Docker images...
docker-compose pull

REM Start application based on chosen mode
IF "!DEPLOY_MODE!"=="1" (
    echo [32mStarting application in production mode...[0m
    docker-compose up -d
    echo [32m√[0m Application started in production mode
    echo Access the website at http://localhost:3000
    echo.
    echo Useful commands:
    echo   - View logs: docker-compose logs -f
    echo   - Stop application: docker-compose down
) ELSE IF "!DEPLOY_MODE!"=="2" (
    echo [32mStarting application in development mode...[0m
    docker-compose -f docker-compose.dev.yml up -d
    echo [32m√[0m Application started in development mode with hot reloading
    echo Access the website at http://localhost:3000
    echo.
    echo Useful commands:
    echo   - View logs: docker-compose -f docker-compose.dev.yml logs -f
    echo   - Stop application: docker-compose -f docker-compose.dev.yml down
) ELSE (
    echo [31mInvalid option. Please run the script again and select 1 or 2.[0m
    pause
    exit /b 1
)

echo.
echo [32mInstallation complete![0m
pause
ENDLOCAL 