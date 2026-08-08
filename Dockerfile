# ── Dockerfile for Aegis-F Go TEE Keeper Backend ─────────────────────────────
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Install git and ca-certificates
RUN apk add --no-cache git ca-certificates

# Copy go mod and sum
COPY fce-keeper/go.mod fce-keeper/go.sum ./
RUN go mod download

# Copy source code
COPY fce-keeper/ ./

# Build static binary
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /aegis-keeper .

# ── Runtime Stage ────────────────────────────────────────────────────────────
FROM alpine:3.19

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /root/
COPY --from=builder /aegis-keeper .

EXPOSE 6662

ENV PORT=6662
ENV MODE=0
ENV COSTON2_RPC=https://coston2-api.flare.network/ext/C/rpc
ENV POSITION_CONTRACT=0x6376892136f7c85E09c0e36100ffA6b484B3AC8c
ENV VAULT_CONTRACT=0x52C0C06382bCF4f08689c74c47F4D5BFf36F4d6e
ENV SENDER_CONTRACT=0x416dbc9ABC289b58701e8543e6C54a3a7634BB3c

CMD ["./aegis-keeper"]
