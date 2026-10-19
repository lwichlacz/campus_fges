#!/bin/zsh
# Musique du film de présentation (100 s), utilisée par tools/film/film.js : voix/musique-film.wav (non versionnée).
cd "$(dirname "$0")"
python3 mix.py --duree 100 --sortie musique-film.wav
