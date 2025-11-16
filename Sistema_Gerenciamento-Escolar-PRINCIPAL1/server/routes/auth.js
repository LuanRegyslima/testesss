const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Usuario = require("../models/Usuario");
const enviarEmailVerificacao = require("../utils/enviarEmailVerificacao");

// 🔑 Chaves secretas (ideal mover para .env)
const SECRET_LOGIN = "segredo123";
const SECRET_VERIFICACAO = "chave_secreta_verificacao";

/* -------------------------------------------------------
   📧 Função para validar e-mail
------------------------------------------------------- */
function emailValido(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/* =======================================================
   🧩 CADASTRO DE USUÁRIO + ENVIO DE E-MAIL
======================================================= */
router.post("/register", async (req, res) => {
  try {
    const { nome, email, senha, tipo } = req.body;

    // Validação de email
    if (!emailValido(email)) {
      return res.status(400).json({ mensagem: "❌ Email inválido!" });
    }

    // Verifica se existe
    const existente = await Usuario.findOne({ email });
    if (existente) {
      return res.status(400).json({ mensagem: "❌ Usuário já cadastrado!" });
    }

    // Criar usuário
    const novoUsuario = new Usuario({
      nome,
      email,
      senha,
      tipo: tipo || "aluno",
      verificado: false
    });

    await novoUsuario.save();

    // 🔥 Gerar token de verificação
    const tokenVerificacao = jwt.sign(
      { email },
      SECRET_VERIFICACAO,
      { expiresIn: "1h" }
    );

    // 🔥 Enviar e-mail com link
    await enviarEmailVerificacao(email, tokenVerificacao);

    res.status(201).json({
      mensagem: "📧 Conta criada! Verifique seu e-mail para ativar."
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ mensagem: "❌ Erro no servidor", erro: err });
  }
});

/* =======================================================
   ✔ CONFIRMAR E-MAIL (rota acessada pelo link enviado)
======================================================= */
router.get("/verify/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const decoded = jwt.verify(token, SECRET_VERIFICACAO);

    const usuario = await Usuario.findOne({ email: decoded.email });

    if (!usuario) {
      return res.status(400).json({ mensagem: "❌ Usuário não encontrado." });
    }

    usuario.verificado = true;
    await usuario.save();

    res.send("✅ Conta verificada com sucesso! Você já pode fazer login.");

  } catch (err) {
    console.error(err);
    res.status(400).send("❌ Link inválido ou expirado.");
  }
});

/* =======================================================
   🔐 LOGIN
======================================================= */
router.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;

    const usuario = await Usuario.findOne({ email });
    if (!usuario)
      return res.status(404).json({ mensagem: "❌ Usuário não encontrado!" });

    if (!usuario.verificado)
      return res.status(403).json({ mensagem: "❌ Verifique seu e-mail antes de logar!" });

    const senhaCorreta = await usuario.verificarSenha(senha);
    if (!senhaCorreta)
      return res.status(401).json({ mensagem: "❌ Senha incorreta!" });

    const token = jwt.sign(
      { id: usuario._id, nome: usuario.nome, tipo: usuario.tipo },
      SECRET_LOGIN,
      { expiresIn: "1h" }
    );

    res.json({
      mensagem: `✅ Bem-vindo(a), ${usuario.nome}!`,
      token,
      tipo: usuario.tipo,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ mensagem: "❌ Erro no servidor", erro: err });
  }
});

/* =======================================================
   🛡 DASHBOARD
======================================================= */
router.get("/dashboard", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ mensagem: "❌ Token ausente!" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_LOGIN);

    res.json({
      mensagem: `✅ Token válido. Bem-vindo(a), ${decoded.nome}!`,
      tipo: decoded.tipo,
    });
  } catch (err) {
    res.status(401).json({ mensagem: "❌ Token inválido ou expirado!" });
  }
});

module.exports = router;
