const express = require("express")
const cors = require("cors")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const axios = require("axios")
require("dotenv").config()

const pool = require("./database")

const app = express()

app.use(express.json())

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}))

const JWT_SECRET = process.env.JWT_SECRET || "segredo_super_forte_123"
const PORT = process.env.PORT || 5000

const sseClients = []

function enviarEventoVenda(payload) {
  const data = `data: ${JSON.stringify(payload)}\n\n`

  sseClients.forEach((client) => {
    try {
      client.res.write(data)
    } catch (err) {
      console.error("Erro SSE:", err.message)
    }
  })
}

function logErro(label, err) {
  console.error(`\n[${label}]`)
  console.error("Mensagem:", err.message)
  if (err.code) console.error("Code:", err.code)
  if (err.detail) console.error("Detail:", err.detail)
  if (err.constraint) console.error("Constraint:", err.constraint)
  if (err.response?.data) console.error("Response data:", err.response.data)
  console.error(err)
}

async function gerarPixPodPay(pedidoId, valor, cliente) {
  const response = await axios.post(
    "https://api.podpay.app/v1/transactions",
    {
      paymentMethod: "pix",
      amount: Math.round(Number(valor) * 100),
      customer: {
        name: cliente.nome,
        email: cliente.email,
        phone: cliente.telefone,
        document: {
          type: "cpf",
          number: cliente.cpf
        }
      },
      items: [
        {
          title: "Projetor HY350",
          unitPrice: Math.round(Number(valor) * 100),
          quantity: 1,
          tangible: true
        }
      ],
      metadata: {
        pedidoId: String(pedidoId)
      }
    },
    {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.PODPAY_KEY
      }
    }
  )

  return {
    codigo: response.data?.data?.pixQrCode || "",
    qrcode: response.data?.data?.pixQrCodeImage || "",
    transactionId: response.data?.data?.id || ""
  }
}

async function verificarPagamento(transactionId) {
  const res = await axios.get(
    `https://api.podpay.app/v1/transactions/${transactionId}`,
    {
      headers: {
        "x-api-key": process.env.PODPAY_KEY
      }
    }
  )

  return res.data?.data?.status
}

function authAdmin(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    return res.status(401).json({ erro: "Token não enviado" })
  }

  const parts = authHeader.split(" ")
  const token = parts.length === 2 ? parts[1] : null

  if (!token) {
    return res.status(401).json({ erro: "Token inválido" })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.admin = decoded
    next()
  } catch (err) {
    return res.status(401).json({ erro: "Token inválido" })
  }
}

async function criarAdminPadrao() {
  try {
    const email = process.env.ADMIN_EMAIL || "admin@loja.com"
    const senha = process.env.ADMIN_SENHA || "123456"

    const existe = await pool.query(
      "SELECT id FROM admin WHERE email = $1",
      [email]
    )

    if (existe.rows.length === 0) {
      const senhaHash = await bcrypt.hash(senha, 10)

      await pool.query(
        `INSERT INTO admin (nome, email, senha)
         VALUES ($1, $2, $3)`,
        ["Administrador", email, senhaHash]
      )

      console.log("Admin padrão criado")
    }
  } catch (err) {
    logErro("CRIAR ADMIN PADRAO", err)
  }
}

app.get("/", (req, res) => {
  res.json({ message: "API funcionando" })
})

app.get("/eventos", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream")
  res.setHeader("Cache-Control", "no-cache")
  res.setHeader("Connection", "keep-alive")
  res.flushHeaders()

  const clientId = Date.now()
  const client = { id: clientId, res }

  sseClients.push(client)

  res.write(`data: ${JSON.stringify({ tipo: "conectado" })}\n\n`)

  req.on("close", () => {
    const index = sseClients.findIndex((c) => c.id === clientId)
    if (index !== -1) {
      sseClients.splice(index, 1)
    }
  })
})

app.post("/admin/login", async (req, res) => {
  try {
    const { email, senha } = req.body

    if (!email || !senha) {
      return res.status(400).json({ erro: "Email e senha são obrigatórios" })
    }

    const result = await pool.query(
      "SELECT * FROM admin WHERE email = $1",
      [email]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ erro: "Email ou senha inválidos" })
    }

    const admin = result.rows[0]
    const senhaValida = await bcrypt.compare(senha, admin.senha)

    if (!senhaValida) {
      return res.status(401).json({ erro: "Email ou senha inválidos" })
    }

    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        nome: admin.nome
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    )

    res.json({
      sucesso: true,
      token,
      admin: {
        id: admin.id,
        nome: admin.nome,
        email: admin.email
      }
    })
  } catch (err) {
    logErro("LOGIN ADMIN", err)
    res.status(500).json({ erro: "Erro login" })
  }
})

app.post("/pedido", async (req, res) => {
  const client = await pool.connect()

  try {
    await client.query("BEGIN")

    const {
      nome,
      cpf,
      email,
      telefone,
      nascimento = null,
      cep,
      rua,
      numero,
      bairro,
      cidade,
      estado,
      produto,
      valor
    } = req.body

    if (!nome || !cpf || !email || !telefone || !produto || !valor) {
      await client.query("ROLLBACK")
      return res.status(400).json({ erro: "Dados obrigatórios faltando" })
    }

    const clienteResult = await client.query(
      `INSERT INTO clientes
      (nome, cpf, email, telefone, nascimento, cep, rua, numero, bairro, cidade, estado)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING id`,
      [nome, cpf, email, telefone, nascimento, cep, rua, numero, bairro, cidade, estado]
    )

    const cliente_id = clienteResult.rows[0].id

    const pedidoResult = await client.query(
      `INSERT INTO pedidos (cliente_id, produto, valor, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [cliente_id, produto, valor, "pendente"]
    )

    const pedido = pedidoResult.rows[0]

    const pix = await gerarPixPodPay(pedido.id, valor, {
      nome,
      email,
      telefone,
      cpf
    })

    if (!pix.codigo || !pix.qrcode || !pix.transactionId) {
      throw new Error("Falha ao gerar PIX na PodPay")
    }

    const pedidoAtualizado = await client.query(
      `UPDATE pedidos
       SET pix_codigo = $1,
           pix_qrcode = $2,
           pix_transaction_id = $3
       WHERE id = $4
       RETURNING *`,
      [pix.codigo, pix.qrcode, pix.transactionId, pedido.id]
    )

    await client.query("COMMIT")

    const pedidoFinal = pedidoAtualizado.rows[0]

    enviarEventoVenda({
      tipo: "nova_venda",
      pedidoId: pedidoFinal.id,
      cliente: nome,
      valor: pedidoFinal.valor,
      produto: pedidoFinal.produto
    })

    res.json({
      sucesso: true,
      pedido: pedidoFinal,
      pix: {
        codigo: pedidoFinal.pix_codigo,
        qrcode: pedidoFinal.pix_qrcode
      }
    })
  } catch (err) {
    await client.query("ROLLBACK")
    logErro("CRIAR PEDIDO", err)
    res.status(500).json({ erro: "Erro criar pedido" })
  } finally {
    client.release()
  }
})

app.get("/pedido/:id/status", async (req, res) => {
  try {
    const { id } = req.params

    const pedido = await pool.query(
      "SELECT * FROM pedidos WHERE id = $1",
      [id]
    )

    if (pedido.rows.length === 0) {
      return res.status(404).json({ erro: "Pedido não encontrado" })
    }

    const pedidoAtual = pedido.rows[0]

    if (!pedidoAtual.pix_transaction_id) {
      return res.status(400).json({ erro: "Pedido sem transactionId salvo" })
    }

    const statusGateway = await verificarPagamento(pedidoAtual.pix_transaction_id)

    let novoStatus = pedidoAtual.status

    if (statusGateway === "paid" || statusGateway === "approved") {
      novoStatus = "pago"

      await pool.query(
        "UPDATE pedidos SET status = $1 WHERE id = $2",
        ["pago", id]
      )

      enviarEventoVenda({
        tipo: "pagamento_confirmado",
        pedidoId: id
      })
    }

    res.json({ status: novoStatus })
  } catch (err) {
    logErro("VERIFICAR PAGAMENTO", err)
    res.status(500).json({ erro: "Erro verificar pagamento" })
  }
})

app.get("/admin/pedidos", authAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        pedidos.id,
        clientes.nome,
        clientes.email,
        clientes.telefone,
        pedidos.produto,
        pedidos.valor,
        pedidos.status,
        pedidos.criado_em
      FROM pedidos
      JOIN clientes ON clientes.id = pedidos.cliente_id
      ORDER BY pedidos.criado_em DESC
    `)

    res.json(result.rows)
  } catch (err) {
    logErro("LISTAR PEDIDOS ADMIN", err)
    res.status(500).json({ erro: "Erro buscar pedidos" })
  }
})

async function marcarPedidoComoPago(req, res) {
  try {
    const { id } = req.params

    const existe = await pool.query(
      "SELECT id, status FROM pedidos WHERE id = $1",
      [id]
    )

    if (existe.rows.length === 0) {
      return res.status(404).json({ erro: "Pedido não encontrado" })
    }

    const result = await pool.query(
      `UPDATE pedidos
       SET status = $1
       WHERE id = $2
       RETURNING id, status`,
      ["pago", id]
    )

    enviarEventoVenda({
      tipo: "pagamento_manual",
      pedidoId: id
    })

    return res.json({
      sucesso: true,
      mensagem: "Pedido marcado como pago",
      pedido: result.rows[0]
    })
  } catch (err) {
    logErro("MARCAR PEDIDO COMO PAGO", err)
    return res.status(500).json({
      erro: err.detail || err.message || "Erro atualizar pedido"
    })
  }
}

app.put("/admin/pedido/:id/pago", authAdmin, marcarPedidoComoPago)
app.put("/admin/pedidos/:id/pago", authAdmin, marcarPedidoComoPago)

async function excluirPedido(req, res) {
  try {
    const { id } = req.params

    const existe = await pool.query(
      "SELECT id FROM pedidos WHERE id = $1",
      [id]
    )

    if (existe.rows.length === 0) {
      return res.status(404).json({ erro: "Pedido não encontrado" })
    }

    const result = await pool.query(
      "DELETE FROM pedidos WHERE id = $1 RETURNING id",
      [id]
    )

    return res.json({
      sucesso: true,
      mensagem: "Pedido excluído com sucesso",
      pedido: result.rows[0]
    })
  } catch (err) {
    logErro("EXCLUIR PEDIDO", err)
    return res.status(500).json({
      erro: err.detail || err.message || "Erro excluir pedido"
    })
  }
}

app.delete("/admin/pedido/:id", authAdmin, excluirPedido)
app.delete("/admin/pedidos/:id", authAdmin, excluirPedido)

app.get("/admin/metricas", authAdmin, async (req, res) => {
  try {
    const faturamento = await pool.query(`
      SELECT COALESCE(SUM(valor), 0) AS total
      FROM pedidos
      WHERE status = 'pago'
    `)

    const totalPedidos = await pool.query(`
      SELECT COUNT(*) FROM pedidos
    `)

    const pendentes = await pool.query(`
      SELECT COUNT(*) FROM pedidos
      WHERE status = 'pendente'
    `)

    const ticketMedio = await pool.query(`
      SELECT COALESCE(AVG(valor), 0) AS ticket
      FROM pedidos
      WHERE status = 'pago'
    `)

    res.json({
      faturamento: Number(faturamento.rows[0].total),
      pedidos: Number(totalPedidos.rows[0].count),
      pendentes: Number(pendentes.rows[0].count),
      ticket: Number(ticketMedio.rows[0].ticket)
    })
  } catch (err) {
    logErro("METRICAS ADMIN", err)
    res.status(500).json({ erro: "Erro buscar métricas" })
  }
})

app.listen(PORT, async () => {
  console.log("Servidor rodando na porta", PORT)
  await criarAdminPadrao()
})