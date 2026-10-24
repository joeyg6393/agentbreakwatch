FROM node:22-alpine
WORKDIR /app
COPY package.json index.mjs server.json glama.json smithery.yaml README.md LICENSE ./
ENTRYPOINT ["node", "index.mjs"]
