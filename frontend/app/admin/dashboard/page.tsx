"use client"

import { useEffect,useState } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"

const API_URL = "http://localhost:5000"

type Pedido = {
 id:number
 nome:string
 valor:number
 produto:string
 criado_em:string
}

export default function Dashboard(){

const router = useRouter()

const [pedidos,setPedidos] = useState<Pedido[]>([])
const [total,setTotal] = useState(0)

useEffect(()=>{

const token = localStorage.getItem("admin_token")

if(!token){
 router.push("/admin/login")
 return
}

carregarPedidos()

},[])

async function carregarPedidos(){

try{

const token = localStorage.getItem("admin_token")

const res = await axios.get(
 `${API_URL}/admin/pedidos`,
 {
  headers:{
   Authorization:`Bearer ${token}`
  }
 }
)

setPedidos(res.data)

const soma = res.data.reduce(
 (acc:any,p:any)=> acc + Number(p.valor),
 0
)

setTotal(soma)

}catch(err){
 console.log(err)
}

}

return(

<div style={{
minHeight:"100vh",
background:"#f5f7fb",
padding:"40px",
fontFamily:"Inter,Arial"
}}>

{/* HEADER */}

<div style={{
display:"flex",
justifyContent:"space-between",
alignItems:"center",
marginBottom:"40px"
}}>

<h1 style={{fontSize:"28px"}}>Dashboard</h1>

<div style={{
background:"#fff",
padding:"10px 16px",
borderRadius:"8px",
boxShadow:"0 3px 10px rgba(0,0,0,0.08)"
}}>
Admin
</div>

</div>

{/* CARDS */}

<div style={{
display:"grid",
gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",
gap:"20px",
marginBottom:"40px"
}}>

<Card
titulo="Pedidos"
valor={pedidos.length}
cor="#6366f1"
/>

<Card
titulo="Faturamento"
valor={`R$ ${total.toFixed(2)}`}
cor="#16a34a"
/>

</div>

{/* TABELA */}

<div style={{
background:"#fff",
padding:"25px",
borderRadius:"12px",
boxShadow:"0 10px 25px rgba(0,0,0,0.08)"
}}>

<h2 style={{
marginBottom:"20px",
fontSize:"20px"
}}>
Pedidos recentes
</h2>

<table style={{
width:"100%",
borderCollapse:"collapse"
}}>

<thead>

<tr style={{
borderBottom:"1px solid #eee",
textAlign:"left",
fontSize:"14px",
color:"#666"
}}>

<th style={{padding:"10px"}}>ID</th>
<th style={{padding:"10px"}}>Cliente</th>
<th style={{padding:"10px"}}>Produto</th>
<th style={{padding:"10px"}}>Valor</th>

</tr>

</thead>

<tbody>

{pedidos.map((p)=>{

return(

<tr
key={p.id}
style={{
borderBottom:"1px solid #f1f1f1"
}}
>

<td style={{padding:"12px"}}>{p.id}</td>

<td style={{padding:"12px"}}>{p.nome}</td>

<td style={{padding:"12px"}}>{p.produto}</td>

<td style={{
padding:"12px",
fontWeight:"600"
}}>
R$ {Number(p.valor).toFixed(2)}
</td>

</tr>

)

})}

</tbody>

</table>

</div>

</div>

)

}

function Card({titulo,valor,cor}:any){

return(

<div style={{
background:"#fff",
padding:"24px",
borderRadius:"12px",
boxShadow:"0 10px 25px rgba(0,0,0,0.08)",
borderLeft:`5px solid ${cor}`
}}>

<p style={{
color:"#666",
fontSize:"14px"
}}>
{titulo}
</p>

<h2 style={{
fontSize:"26px",
marginTop:"8px"
}}>
{valor}
</h2>

</div>

)

}