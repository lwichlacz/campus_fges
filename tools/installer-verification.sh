#!/bin/sh
# Installe le crochet git « pre-push » : avant chaque git push, tools/verifier.mjs vérifie le site complet
# (syntaxe, intérieurs, mini-jeux, pages, captures dans tools/verif/). S'il trouve un problème, l'envoi est annulé.
# À lancer une fois par ordinateur :   sh tools/installer-verification.sh
cd "$(git rev-parse --show-toplevel)" || exit 1
cat > .git/hooks/pre-push <<'EOF'
#!/bin/sh
echo "Vérification du site avant l'envoi (environ 3 minutes)…"
node tools/verifier.mjs || { echo; echo "Envoi annulé : corriger les problèmes ci-dessus (voir aussi tools/verif/index.html)."; exit 1; }
EOF
chmod +x .git/hooks/pre-push
echo "Crochet installé : chaque git push lance d'abord node tools/verifier.mjs."
