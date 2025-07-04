package ora

import (
	_ "embed"
	"encoding/json"
	"log"
	"net/http"
	"strings"
)

//go:embed assets/index.html
var indexHTML string

// New return a http.Handler
func New(cfg *Config) http.Handler {
	configuration, err := json.Marshal(cfg)
	if err != nil {
		log.Panic(err)
	}
	indexHTML = strings.ReplaceAll(indexHTML, "'<<configuration>>'", string(configuration))
	return http.StripPrefix(cfg.Basename, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		_, _ = w.Write([]byte(indexHTML))
	}))
}
