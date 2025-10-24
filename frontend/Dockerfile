# Base image using Node.js 18 on Alpine Linux
FROM node:18-alpine AS base

# Stage 1: Install dependencies
# This stage is cached and only re-runs when package.json or yarn.lock changes.
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* yarn.lock* ./

# Install dependencies (supports both npm and yarn)
RUN if [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci; \
    else npm install; fi

# Stage 2: Build the application
# This stage re-runs when your source code changes.
FROM base AS builder
WORKDIR /app

# Copy dependencies from the 'deps' stage
COPY --from=deps /app/node_modules ./node_modules

# Copy the rest of your application source code
COPY . .

# Run the build command
RUN if [ -f yarn.lock ]; then yarn build; else npm run build; fi

# Stage 3: Production image
# This stage creates a minimal, secure image for running the app.
FROM base AS runner
WORKDIR /app

# Set the environment to production
ENV NODE_ENV production

# Create a dedicated, non-root user and group for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy only the necessary build artifacts from the 'builder' stage
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to the non-root user
USER nextjs

# Expose the port the app will run on
EXPOSE 3000

# Set the port environment variable
ENV PORT 3000

# The command to start the Next.js standalone server
CMD ["node", "server.js"]