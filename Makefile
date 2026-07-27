.PHONY: help install run dev server build preview lint clean

# Default target
help:
	@echo "branch-checker"
	@echo ""
	@echo "  make install   Install dependencies"
	@echo "  make run       Run API (:3001) + UI (:5173)"
	@echo "  make dev       Run UI only (:5173)"
	@echo "  make server    Run API only (:3001)"
	@echo "  make build     Production build to dist/"
	@echo "  make preview   Serve the production build"
	@echo "  make lint      Run eslint"
	@echo "  make clean     Remove dist/ and node_modules/"

node_modules: package.json package-lock.json
	npm install
	@touch node_modules

install: node_modules

run: node_modules
	npm start

dev: node_modules
	npm run dev

server: node_modules
	npm run server

build: node_modules
	npm run build

preview: build
	npm run preview

lint: node_modules
	npm run lint

clean:
	rm -rf dist node_modules
