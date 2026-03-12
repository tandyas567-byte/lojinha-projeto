"use client"

import { useState } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"

export default function Checkout(){

const router = useRouter()

const [nome,setNome]=useState("")
const [cpf,setCpf]=useState("")
const [email,setEmail]=useState("")
const [telefone,setTelefone]=useState("")

const [cep,setCep]=useState("")
const [rua,setRua]=useState("")
const [numero,setNumero]=useState("")
const [bairro,setBairro]=useState("")
const [cidade,setCidade]=useState("")
const [estado,setEstado]=useState("")

const [loading,setLoading]=useState(false)

async function buscarCep(){

try{

const cepLimpo = cep.replace(/\D/g,"")

if(cepLimpo.length !== 8) return

const res = await axios.get(`https://viacep.com.br/ws/${cepLimpo}/json/`)

setRua(res.data.logradouro || "")
setBairro(res.data.bairro || "")
setCidade(res.data.localidade || "")
setEstado(res.data.uf || "")

}catch(err){

console.log("Erro CEP")

}

}

async function finalizarCompra(){

try{

setLoading(true)

const res = await axios.post("http://localhost:5000/pedido",{

nome,
cpf,
email,
telefone,

cep,
rua,
numero,
bairro,
cidade,
estado,

produto:"Mini Projetor HY350",
valor:129.90

})

const codigo = encodeURIComponent(res.data.pix.codigo)
const qrcode = encodeURIComponent(res.data.pix.qrcode)
const pedido = res.data.pedido.id

router.push(`/pagamento?codigo=${codigo}&qrcode=${qrcode}&pedido=${pedido}`)

}catch(err){

alert("Erro ao gerar pagamento")
console.log(err)

}

setLoading(false)

}

return(

<div className="checkoutPage">

<div className="checkoutGrid">

{/* FORM */}

<div className="checkoutForm">

<h2>Dados do cliente</h2>

<input
placeholder="Nome completo"
value={nome}
onChange={(e)=>setNome(e.target.value)}
/>

<input
placeholder="CPF"
value={cpf}
onChange={(e)=>setCpf(e.target.value)}
/>

<input
placeholder="Email"
value={email}
onChange={(e)=>setEmail(e.target.value)}
/>

<input
placeholder="Telefone"
value={telefone}
onChange={(e)=>setTelefone(e.target.value)}
/>

<h2>Endereço de entrega</h2>

<input
placeholder="CEP"
value={cep}
onChange={(e)=>setCep(e.target.value)}
onBlur={buscarCep}
/>

<div className="linha">

<input
placeholder="Rua"
value={rua}
onChange={(e)=>setRua(e.target.value)}
/>

<input
placeholder="Número"
value={numero}
onChange={(e)=>setNumero(e.target.value)}
/>

</div>

<input
placeholder="Bairro"
value={bairro}
onChange={(e)=>setBairro(e.target.value)}
/>

<div className="linha">

<input
placeholder="Cidade"
value={cidade}
onChange={(e)=>setCidade(e.target.value)}
/>

<input
placeholder="Estado"
value={estado}
onChange={(e)=>setEstado(e.target.value)}
/>

</div>

</div>

{/* RESUMO */}

<div className="checkoutResumo">

<h3>Resumo do pedido</h3>

<div className="produtoResumo">

<img src="/img projetor 1.webp" alt="Mini Projetor HY350"/>

<div>

<p>Mini Projetor HY350</p>
<p className="precoResumo">R$129,90</p>

</div>

</div>

<div className="totalBox">

<p>
<span>Produto</span>
<span>R$129,90</span>
</p>

<p>
<span>Frete</span>
<span>Grátis</span>
</p>

<hr/>

<h3>
<span>Total</span>
<span>R$129,90</span>
</h3>

</div>

<button
className="botaoPagar"
onClick={finalizarCompra}
disabled={loading}
>

{loading ? "Gerando pagamento..." : "Pagar com PIX"}

</button>

<div className="seguranca">

🔒 Pagamento 100% seguro

</div>

</div>

</div>

</div>

)

}