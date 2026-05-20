FROM node:22-alpine AS base
WORKDIR /app
COPY package.json ./
RUN npm install
COPY next.config.ts tsconfig.json ./
COPY src ./src

FROM base AS dev
EXPOSE 3000
CMD ["npm", "run", "dev"]

FROM base AS prod
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
