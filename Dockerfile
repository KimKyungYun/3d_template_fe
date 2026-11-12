# syntax=docker/dockerfile:1

FROM node:22-alpine AS build
WORKDIR /app

# yarn 은 corepack 이 package.json 의 `packageManager` 를 보고 받아온다.
# 내려받기 확인 프롬프트는 끈다 — CI 는 대화형이 아니라 물음이 뜨면 그대로 멎는다.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

COPY .yarnrc.yml package.json yarn.lock ./
RUN yarn install --immutable

COPY . .

# Vite가 빌드 시 번들에 인라인하는 값 (브라우저가 호출할 BE 주소)
ARG VITE_APP_API_PATH
ENV VITE_APP_API_PATH=$VITE_APP_API_PATH
RUN yarn build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
