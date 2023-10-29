call pnpm docs:build
cd docs/.vitepress/dist

git init
git add -A
git commit -m "auto construct"

git push -f https://github.com/codansYC/github.io.git main:gh-pages