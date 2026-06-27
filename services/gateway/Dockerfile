# Dockerfile — Multi-stage build for the Go gRPC gateway.
# Stage 1 installs protoc tooling, generates stubs, and compiles the binary.
# Stage 2 produces a minimal alpine image (~15 MB).

# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM golang:1.25-alpine AS builder

RUN apk add --no-cache git protobuf protobuf-dev

# Install protoc plugins
RUN go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.34.2
RUN go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@v1.3.0

WORKDIR /app

# Cache dependency downloads before copying source
COPY go.mod go.sum* ./
RUN go mod download

COPY . .

# Generate proto stubs then build the gateway binary
RUN mkdir -p gen && \
    protoc --go_out=gen --go_opt=paths=source_relative \
           --go-grpc_out=gen --go-grpc_opt=paths=source_relative \
           proto/transaction.proto && \
    go build -ldflags="-s -w" -o /gateway ./cmd/gateway/

# ── Stage 2: minimal runtime ──────────────────────────────────────────────────
FROM alpine:3.19

RUN apk add --no-cache ca-certificates

COPY --from=builder /gateway /gateway

EXPOSE 50051

ENTRYPOINT ["/gateway"]
