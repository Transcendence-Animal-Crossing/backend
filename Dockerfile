# 가벼운 이미지를 위한 multi-stage docker build
# build stage
FROM node:18 AS builder

WORKDIR /app
COPY . .

RUN yarn
RUN yarn build

# run stage
FROM node:18-alpine

WORKDIR /app
COPY --from=builder /app ./

CMD ["yarn","start:dev"]