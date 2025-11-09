FROM node:20-alpine AS deps
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install

FROM node:20-alpine AS build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY tsconfig.base.json ./tsconfig.base.json
COPY frontend/tsconfig.json ./tsconfig.json
COPY frontend/vite.config.ts ./vite.config.ts
COPY frontend/tailwind.config.ts ./tailwind.config.ts
COPY frontend/postcss.config.cjs ./postcss.config.cjs
COPY frontend/index.html ./index.html
COPY frontend/src ./src
COPY frontend/public ./public
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
RUN npm install --omit=dev --prefer-offline
ENV PORT=4173
EXPOSE 4173
CMD ["sh", "-c", "npx vite preview --host 0.0.0.0 --port ${PORT}"]
