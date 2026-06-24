# Makefile — Build targets for the CPG CFO Agent gRPC gateway.
#
# Prerequisites for `build`:
#   brew install protobuf
#   go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
#   go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
#
# Quick start:
#   make deps      # download Go modules
#   make proto-gen # generate Go stubs from proto/transaction.proto
#   make build     # compile binary → bin/gateway
#   make test      # run unit tests (no proto-gen needed)

PROTO_DIR = proto
GEN_DIR   = gen
BIN_DIR   = bin
CMD_DIR   = cmd/gateway

.PHONY: proto-gen deps build run test clean

proto-gen:
	@mkdir -p $(GEN_DIR)
	protoc \
		--go_out=$(GEN_DIR) --go_opt=paths=source_relative \
		--go-grpc_out=$(GEN_DIR) --go-grpc_opt=paths=source_relative \
		$(PROTO_DIR)/transaction.proto
	@echo "✓ Generated Go stubs in $(GEN_DIR)/"

deps:
	go mod download
	go mod tidy

build: proto-gen
	@mkdir -p $(BIN_DIR)
	go build -ldflags="-s -w" -o $(BIN_DIR)/gateway ./$(CMD_DIR)/
	@echo "✓ Binary written to $(BIN_DIR)/gateway"

run: build
	KAFKA_BOOTSTRAP_SERVERS=$${KAFKA_BOOTSTRAP_SERVERS:-localhost:9092} \
	GRPC_GATEWAY_PORT=$${GRPC_GATEWAY_PORT:-50051} \
	./$(BIN_DIR)/gateway

# Tests cover validate.go only — no proto-gen or external deps required.
test:
	go test -v -count=1 .

clean:
	rm -rf $(BIN_DIR) $(GEN_DIR)
