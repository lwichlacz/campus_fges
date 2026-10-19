#!/bin/zsh
# Bande son de la vidéo : musique seule (python3 mix.py). Avec voix off de synthèse : décommenter la boucle say et lancer mix.py --voix.
cd "$(dirname "$0")"
python3 mix.py && afconvert -f m4af -d aac -b 64000 bande-son.wav ../media/bande-son.mp4 && rm -f bande-son.wav
