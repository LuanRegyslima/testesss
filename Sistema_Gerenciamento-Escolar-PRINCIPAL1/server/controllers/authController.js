const jwt = require("jsonwebtoken");

const token = jwt.sign(
  { email },
  "chave_secreta_verificacao",
  { expiresIn: "1h" }
);

// Enviar e-mail
await enviarEmailVerificacao(email, token);
