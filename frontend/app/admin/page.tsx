"use client"

import { useEffect, useState } from "react"
import axios from "axios"

export default function Admin(){

const [pedidos,setPedidos] = useState([])

async function carregarPedidos(){

 const res = await axios.get("http://localhost:5000/pedidos")

 setPedidos(res.data)

}

useEffect(()=>{
 carregarPedidos()
},[])

return(

<div style={{padding:"40px"}}>

<h1>Painel Admin</h1>

<table border={1} cellPadding={10}>

<thead>
<tr>
<th>ID</th>
<th>Cliente</th>
<th>Email</th>
<th>Produto</th>
<th>Valor</th>
<th>Status</th>
<th>Data</th>
</tr>
</thead>

<tbody>

{pedidos.map((pedido:any)=>(
<tr key={pedido.id}>
<td>{pedido.id}</td>
<td>{pedido.nome}</td>
<td>{pedido.email}</td>
<td>{pedido.produto}</td>
<td>R$ {pedido.valor}</td>
<td>{pedido.status}</td>
<td>{new Date(pedido.criado_em).toLocaleString()}</td>
</tr>
))}

</tbody>

</table>

</div>

)

}