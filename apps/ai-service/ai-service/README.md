# FIRE STONE Team Designer

Microservice local et gratuit d'analyse de logos. Il ne depend d'aucune API cloud.

## Installation

```powershell
cd ai-service
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Demarrage

```powershell
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

## API

- `GET /health`
- `POST /api/theme/analyze-logo` avec un champ multipart `logo` (PNG, JPEG ou WEBP, 5 Mo maximum).

La reponse contient les tokens de couleur, le gradient, l'ombre, le glow et le type de theme. Les resultats peuvent etre stockes dans `Team.theme` lorsque cette colonne sera ajoutee au modele de donnees.
