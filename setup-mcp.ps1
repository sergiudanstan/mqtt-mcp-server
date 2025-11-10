# MQTT MCP Server Setup Script for Claude Desktop (Windows)
# This script automatically adds the MCP server to Claude Desktop configuration

Write-Host "🚀 MQTT MCP Server Setup for Claude Desktop" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Determine the Claude Desktop config path for Windows
$ConfigDir = "$env:APPDATA\Claude"
$ConfigFile = "$ConfigDir\claude_desktop_config.json"

Write-Host "📍 Detected Windows" -ForegroundColor Green
Write-Host "📂 Config file location: $ConfigFile" -ForegroundColor Yellow
Write-Host ""

# Get the absolute path to the build directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BuildPath = Join-Path $ScriptDir "build\index.js"
$BuildPath = $BuildPath -replace '\\', '/'

Write-Host "🔧 MCP Server path: $BuildPath" -ForegroundColor Yellow
Write-Host ""

# Check if build directory exists
if (-not (Test-Path $BuildPath)) {
    Write-Host "⚠️  Build file not found. Building the project first..." -ForegroundColor Yellow
    npm run build
    Write-Host "✅ Build completed" -ForegroundColor Green
    Write-Host ""
}

# Create config directory if it doesn't exist
if (-not (Test-Path $ConfigDir)) {
    New-Item -ItemType Directory -Path $ConfigDir -Force | Out-Null
}

# Backup existing config if it exists
if (Test-Path $ConfigFile) {
    $Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $BackupFile = "$ConfigFile.backup.$Timestamp"
    Write-Host "💾 Backing up existing config to: $BackupFile" -ForegroundColor Yellow
    Copy-Item $ConfigFile $BackupFile
}

# Create or update the configuration
$Config = @{
    mcpServers = @{
        mqtt = @{
            command = "node"
            args = @($BuildPath)
        }
    }
}

# Convert to JSON and save
$JsonConfig = $Config | ConvertTo-Json -Depth 10
Set-Content -Path $ConfigFile -Value $JsonConfig

Write-Host "✅ Configuration updated successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Configuration content:" -ForegroundColor Cyan
Get-Content $ConfigFile | Write-Host
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "📌 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Restart Claude Desktop completely (Quit and reopen)"
Write-Host "   2. Start the web server: npm run start:web"
Write-Host "   3. Open http://localhost:3000 in your browser"
Write-Host "   4. In Claude Desktop, ask: 'Connect to mqtt://test.mosquitto.org:1883 and publish ""blue"" to topic ""color/change""'"
Write-Host "   5. Watch the background change! 🎨"
Write-Host ""
Write-Host "💡 Tip: You can verify the MCP server is loaded by checking the" -ForegroundColor Cyan
Write-Host "   tools available in Claude Desktop after restart."
Write-Host ""
