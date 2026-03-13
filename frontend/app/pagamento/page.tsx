"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function PagamentoContent() {
  const params = useSearchParams();
  const router = useRouter();

  const codigoParam = params.get("codigo");
  const pedidoId = params.get("pedido");

  const codigo = codigoParam ? decodeURIComponent(codigoParam) : "";

  const [copiado, setCopiado] = useState(false);
  const [tempo, setTempo] = useState(900);

  function copiarPix() {
    navigator.clipboard.writeText(codigo);

    setCopiado(true);

    setTimeout(() => {
      setCopiado(false);
    }, 2000);
  }

  useEffect(() => {
    const intervalo = setInterval(() => {
      setTempo((t) => {
        if (t <= 1) {
          clearInterval(intervalo);
          return 0;
        }

        return t - 1;
      });
    }, 1000);

    return () => clearInterval(intervalo);
  }, []);

  // 🔎 VERIFICAR PAGAMENTO AUTOMATICAMENTE
  useEffect(() => {
    if (!pedidoId) return;

    const intervalo = setInterval(async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/pedido/${pedidoId}/status`
        );

        const data = await res.json();

        if (data.status === "paid") {
          alert("Pagamento confirmado!");
          router.push("/sucesso");
        }
      } catch (err) {
        console.log("Erro verificar pagamento");
      }
    }, 5000);

    return () => clearInterval(intervalo);
  }, [pedidoId]);

  const minutos = Math.floor(tempo / 60);
  const segundos = tempo % 60;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#f3f4f6",
        fontFamily: "Arial",
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: 40,
          borderRadius: 10,
          boxShadow: "0 5px 20px rgba(0,0,0,0.1)",
          maxWidth: 500,
          width: "100%",
          textAlign: "center",
        }}
      >
        <h1 style={{ marginBottom: 10 }}>Pagamento via PIX</h1>

        <p style={{ color: "#666", marginBottom: 20 }}>
          Escaneie o QR Code abaixo para pagar
        </p>

        {codigo && (
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
              codigo
            )}`}
            alt="QR Code PIX"
            style={{
              width: 260,
              marginBottom: 20,
            }}
          />
        )}

        <div
          style={{
            fontSize: 14,
            color: "#555",
            marginBottom: 10,
          }}
        >
          Tempo restante: {minutos}:{segundos.toString().padStart(2, "0")}
        </div>

        <p style={{ marginBottom: 10 }}>Ou copie o código PIX</p>

        <textarea
          value={codigo}
          readOnly
          onClick={copiarPix}
          style={{
            width: "100%",
            height: 110,
            padding: 10,
            borderRadius: 6,
            border: "1px solid #ddd",
            fontSize: 12,
            cursor: "pointer",
            resize: "none",
          }}
        />

        <button
          onClick={copiarPix}
          style={{
            marginTop: 15,
            width: "100%",
            padding: "14px",
            background: "#16a34a",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontSize: 16,
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          {copiado ? "✔ PIX copiado!" : "Copiar código PIX"}
        </button>

        <div
          style={{
            marginTop: 20,
            fontSize: 13,
            color: "#666",
          }}
        >
          🔒 Pagamento 100% seguro <br />
          ⚡ Confirmação automática
        </div>
      </div>
    </div>
  );
}

export default function Pagamento() {
  return (
    <Suspense fallback={<div>Carregando pagamento...</div>}>
      <PagamentoContent />
    </Suspense>
  );
}