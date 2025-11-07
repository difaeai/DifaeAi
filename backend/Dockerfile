FROM node:20-alpine AS deps
WORKDIR /app
COPY backend/package.json backend/package-lock.json* ./
RUN npm install --omit=dev

FROM node:20-alpine AS build
WORKDIR /app
COPY backend/package.json backend/package-lock.json* ./
RUN npm install
COPY tsconfig.base.json ./tsconfig.base.json
COPY backend/tsconfig.build.json ./tsconfig.build.json
COPY backend/tsconfig.json ./tsconfig.json
COPY backend/src ./src
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY backend/package.json ./package.json
EXPOSE 4000
CMD ["node", "dist/index.js"]
