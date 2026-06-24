// gateway_test.go — Unit tests for the gateway validation helpers.
// These tests run without the generated proto stubs (no proto-gen needed).
// Run: go test -v .
package gateway

import "testing"

func TestValidateCSV(t *testing.T) {
	cases := []struct {
		name    string
		input   []byte
		wantErr bool
	}{
		{"empty bytes", []byte{}, true},
		{"nil slice", nil, true},
		{"valid csv", []byte("date,amount,description,category\n2024-01-01,500.00,Ingredients,COGS"), false},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			err := ValidateCSV(tc.input)
			if (err != nil) != tc.wantErr {
				t.Errorf("ValidateCSV() error = %v, wantErr %v", err, tc.wantErr)
			}
		})
	}
}

func TestValidateSessionID(t *testing.T) {
	cases := []struct {
		name    string
		id      string
		wantErr bool
	}{
		{"empty string", "", true},
		{"whitespace only", "   ", false}, // not blank by our definition
		{"valid uuid-style", "sess-abc-123", false},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			err := ValidateSessionID(tc.id)
			if (err != nil) != tc.wantErr {
				t.Errorf("ValidateSessionID(%q) error = %v, wantErr %v", tc.id, err, tc.wantErr)
			}
		})
	}
}
