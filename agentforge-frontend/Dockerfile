FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 5173

ENV VITE_API_URL=http://localhost:8000
ENV VITE_APP_NAME=AgentForge
ENV VITE_NODE_ENV=development

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:5173/ || exit 1

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
