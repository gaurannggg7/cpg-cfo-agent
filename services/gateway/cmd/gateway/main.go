// main.go — Entry point for the CPG CFO Agent gRPC gateway service.
//
// On start-up it connects to Kafka and opens a gRPC listener on :50051.
// Each incoming AnalyzeTransactions RPC validates the CSV payload, publishes a
// JSON envelope to the "transaction-ingestion" Kafka topic, and returns the
// generated job_id so callers can correlate the async result on
// "analysis-complete".
//
// Prerequisites: run `make proto-gen` to populate gen/ before building.
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"os"
	"time"

	gateway "github.com/gaurannggg7/cpg-cfo-agent/gateway"
	pb "github.com/gaurannggg7/cpg-cfo-agent/gateway/gen"
	"github.com/google/uuid"
	kafka "github.com/segmentio/kafka-go"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

const topicIngestion = "transaction-ingestion"

// server implements pb.FinancialAnalysisServiceServer.
type server struct {
	pb.UnimplementedFinancialAnalysisServiceServer
	kafkaWriter *kafka.Writer
}

// kafkaEnvelope is the JSON payload published to Kafka.
type kafkaEnvelope struct {
	JobID     string `json:"job_id"`
	SessionID string `json:"session_id"`
	CSVData   string `json:"csv_data"`
	UserID    string `json:"user_id"`
	Timestamp string `json:"timestamp"`
}

func (s *server) AnalyzeTransactions(ctx context.Context, req *pb.TransactionRequest) (*pb.TransactionResponse, error) {
	if err := gateway.ValidateCSV(req.CsvData); err != nil {
		return nil, status.Error(codes.InvalidArgument, err.Error())
	}
	if err := gateway.ValidateSessionID(req.SessionId); err != nil {
		return nil, status.Error(codes.InvalidArgument, err.Error())
	}

	jobID := uuid.New().String()
	env := kafkaEnvelope{
		JobID:     jobID,
		SessionID: req.SessionId,
		CSVData:   string(req.CsvData),
		UserID:    req.UserId,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	}

	payload, err := json.Marshal(env)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "serialize: %v", err)
	}

	if err := s.kafkaWriter.WriteMessages(ctx, kafka.Message{
		Key:   []byte(jobID),
		Value: payload,
	}); err != nil {
		return nil, status.Errorf(codes.Internal, "kafka publish: %v", err)
	}

	return &pb.TransactionResponse{
		Status:  "accepted",
		JobId:   jobID,
		Message: fmt.Sprintf("job %s queued for analysis", jobID),
	}, nil
}

func main() {
	bootstrap := os.Getenv("KAFKA_BOOTSTRAP_SERVERS")
	if bootstrap == "" {
		bootstrap = "localhost:9092"
	}
	port := os.Getenv("GRPC_GATEWAY_PORT")
	if port == "" {
		port = "50051"
	}

	w := &kafka.Writer{
		Addr:     kafka.TCP(bootstrap),
		Topic:    topicIngestion,
		Balancer: &kafka.LeastBytes{},
	}
	defer w.Close()

	lis, err := net.Listen("tcp", ":"+port)
	if err != nil {
		log.Fatalf("listen :%s: %v", port, err)
	}

	grpcServer := grpc.NewServer()
	pb.RegisterFinancialAnalysisServiceServer(grpcServer, &server{kafkaWriter: w})

	log.Printf("gRPC gateway listening on :%s (Kafka: %s)", port, bootstrap)
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("serve: %v", err)
	}
}
