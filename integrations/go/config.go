package ora

type Config struct {
	Basename         string `json:"basename"`
	OpenapiDocUrl    string `json:"openapiDocUrl"`
	AppTitle         string `json:"appTitle"`
	OidcIssuer       string `json:"oidcIssuer"`
	OidcClientId     string `json:"oidcClientId"`
	OidcRedirectUri  string `json:"oidcRedirectUri"`
	OidcResponseType string `json:"oidcResponseType"`
	OidcScope        string `json:"oidcScope"`
	OidcAudience     string `json:"oidcAudience"`
}
