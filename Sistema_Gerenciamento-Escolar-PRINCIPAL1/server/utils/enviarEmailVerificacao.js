const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "luanregysslima2016@gmail.com",   // seu e-mail real
    pass: "they rmbr lnfh ctcw"           // senha de app gerada no Google
  }
});

async function enviarEmailVerificacao(email, token) {
  const link = `http://localhost:3000/auth/verify/${token}`;

  await transporter.sendMail({
    from: `Seu Projeto <luanregysslima2016@gmail.com>`,
    to: email,
    subject: "Verifique sua conta",
    html: `
      <h2>Confirme sua conta!</h2>
      <p>Clique no link abaixo para ativar sua conta:</p>
      <a href="${link}">${link}</a>
    `
  });
}

module.exports = enviarEmailVerificacao;
