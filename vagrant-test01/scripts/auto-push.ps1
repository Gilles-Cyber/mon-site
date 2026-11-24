# auto-push.ps1 : surveille le projet et fait automatiquement git add / commit / push
# des que des fichiers sont enregistres. Le push declenche ensuite GitHub Actions (CI/CD),
# puis Watchtower met a jour le conteneur dans la VM.
#
# Utilisation (PowerShell) :   .\vagrant-test01\scripts\auto-push.ps1
# Arret : Ctrl+C
param(
  [int]$Attente = 5   # secondes sans nouvelle modification avant d'envoyer
)

$racine = (git -C $PSScriptRoot rev-parse --show-toplevel).Trim()
Set-Location $racine
Write-Host "Surveillance de $racine (Ctrl+C pour arreter)"

$dernier = ""
$depuis = Get-Date

while ($true) {
  Start-Sleep -Seconds 2
  $etat = (git status --porcelain) -join "`n"

  if ([string]::IsNullOrWhiteSpace($etat)) { $dernier = ""; continue }

  if ($etat -ne $dernier) {      # ca bouge encore : on attend que ce soit stable
    $dernier = $etat
    $depuis = Get-Date
    continue
  }

  if (((Get-Date) - $depuis).TotalSeconds -ge $Attente) {
    $heure = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$heure] Modifications detectees, envoi..."
    git add -A
    git commit -q -m "Mise a jour automatique $heure"
    git push 2>&1 | Select-Object -Last 1
    $dernier = ""
    Write-Host "[$heure] Envoye. Pipeline : https://github.com/Gilles-Cyber/mon-site/actions"
  }
}
