FROM node:22-alpine
LABEL io.modelcontextprotocol.server.name="io.github.joeyg6393/agentbreakwatch-mcp"
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY index.mjs server.json glama.json smithery.yaml README.md SECURITY.md CHANGELOG.md LICENSE ./
USER node
ENTRYPOINT ["node", "index.mjs"]
