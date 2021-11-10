FROM node:16-alpine
WORKDIR /app

ENV NODE_ENV production
ENV ENVIRONMENT prod

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

COPY --chown=nextjs:nodejs .next ./.next
COPY config.js ./
COPY next.config.js ./
COPY node_modules ./node_modules
COPY package.json ./package.json
COPY public ./public

USER nextjs

EXPOSE 3000

CMD ["yarn", "start"]
