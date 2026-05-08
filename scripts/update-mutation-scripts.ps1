# Adiciona scripts de mutação ao package.json.
# Execute na raiz do projeto.

$packagePath = Join-Path (Get-Location) "package.json"

if (-not (Test-Path -LiteralPath $packagePath)) {
    Write-Host "ERRO: package.json não encontrado."
    Write-Host "Execute este script na raiz do projeto."
    exit 1
}

$json = Get-Content -LiteralPath $packagePath -Raw | ConvertFrom-Json

if (-not $json.scripts) {
    $json | Add-Member -MemberType NoteProperty -Name scripts -Value ([PSCustomObject]@{})
}

function Set-Script($name, $value) {
    if ($json.scripts.PSObject.Properties.Name -contains $name) {
        $json.scripts.$name = $value
    } else {
        $json.scripts | Add-Member -MemberType NoteProperty -Name $name -Value $value
    }
}

Set-Script "test:mutation:quick" "stryker run stryker.quick.conf.json"
Set-Script "test:mutation" "stryker run stryker.conf.json"
Set-Script "test:mutation:full" "stryker run stryker.full.conf.json"

$json | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $packagePath -Encoding UTF8

Write-Host "Scripts de mutação adicionados/atualizados com sucesso:"
Write-Host "npm run test:mutation:quick"
Write-Host "npm run test:mutation"
Write-Host "npm run test:mutation:full"
