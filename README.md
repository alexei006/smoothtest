# Smooth Bowl - IONOS Hosting Anleitung

## Dateien für IONOS Hosting

Diese Dateien dienen dem Hosting Ihrer Website bei IONOS:

- `index.html` - Hauptdatei mit dem Grundgerüst Ihrer Website
- `index.php` - PHP-Einstiegspunkt (leitet derzeit zur HTML-Version weiter)
- `.htaccess` - Konfigurationsdatei für Apache-Server

## Anleitung zum Hochladen bei IONOS

### Methode 1: Über den Webspace Explorer (einfach)

1. Melden Sie sich bei IONOS an und öffnen Sie den Webspace Explorer
2. Klicken Sie auf "Hochladen" 
3. Wählen Sie die Dateien aus diesem Ordner aus (index.html, index.php, .htaccess)
4. Klicken Sie auf "Öffnen", um die Dateien hochzuladen
5. Verbinden Sie Ihre Domain mit dem Hauptverzeichnis über "Verzeichnis mit Domain verbinden"

### Methode 2: Via FTP (empfohlen für größere Projekte)

1. Laden Sie einen FTP-Client wie [FileZilla](https://filezilla-project.org/) herunter
2. In Ihrem IONOS-Konto finden Sie die FTP-Zugangsdaten
3. Verbinden Sie sich mit dem FTP-Server
4. Laden Sie die Dateien in das Hauptverzeichnis hoch
5. Verbinden Sie Ihre Domain mit dem Verzeichnis in Ihrem IONOS Control Panel

## Domain mit Verzeichnis verbinden

1. Im IONOS Control Panel: Gehen Sie zu "Hosting"
2. Wählen Sie Ihre Domain aus
3. Klicken Sie auf "Domainverwaltung"
4. Wählen Sie "Domain mit Verzeichnis verbinden"
5. Wählen Sie das Verzeichnis, in dem Ihre Dateien liegen

## Nächste Schritte für Ihre Next.js Anwendung

Um später Ihre vollständige Next.js Anwendung zu hosten:

1. Bauen Sie Ihre Anwendung mit `npm run build`
2. Verwenden Sie die Dateien aus dem `.next`-Ordner
3. Konfigurieren Sie IONOS für eine Node.js-Anwendung (falls verfügbar)

Alternativ können Sie statische Exporte erstellen oder einen anderen Hosting-Dienst für Next.js in Betracht ziehen. 