// Package gateway contains validation helpers shared between the gRPC server
// and its unit tests. Keeping validation separate from package main makes it
// testable without needing the generated proto stubs.
package gateway

import "errors"

// ValidateCSV returns an error if the CSV payload is empty.
func ValidateCSV(csv []byte) error {
	if len(csv) == 0 {
		return errors.New("csv_data must not be empty")
	}
	return nil
}

// ValidateSessionID returns an error if the session ID is blank.
func ValidateSessionID(id string) error {
	if id == "" {
		return errors.New("session_id must not be empty")
	}
	return nil
}
