# gen/

This directory is populated by `make proto-gen` and is **not committed to git**.

The Dockerfile regenerates these files automatically during `docker build`.

## Install prerequisites (local dev)

```bash
# protoc compiler
brew install protobuf          # macOS
# or: https://github.com/protocolbuffers/protobuf/releases

# Go plugins
go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.34.2
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@v1.3.0
```

## Generate

```bash
make proto-gen
```

Files produced:
- `transaction.pb.go` — message types
- `transaction_grpc.pb.go` — service client/server interfaces
