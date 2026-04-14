# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — Dependencies (cached layer when package.json unchanged)
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — Runtime image
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Non-root user for security
RUN addgroup -g 1001 -S nodeapp && \
    adduser  -u 1001 -S nodeapp -G nodeapp

# RDS CA bundle for SSL verification (https://truststore.pki.rds.amazonaws.com)
RUN mkdir -p /app/certs
COPY --chown=nodeapp:nodeapp certs/ /app/certs/

COPY --from=deps --chown=nodeapp:nodeapp /app/node_modules ./node_modules
COPY --chown=nodeapp:nodeapp . .

USER nodeapp
EXPOSE 3001

ENV NODE_ENV=production \
    PORT=3001

# Graceful shutdown — send SIGTERM before SIGKILL
STOPSIGNAL SIGTERM

CMD ["node", "server.js"]
