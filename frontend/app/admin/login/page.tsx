"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"

export default function LoginAdmin() {

const router = useRouter()

const [email,setEmail]=useState("")
const [senha,setSenha]=useState("")
const [erro,setErro]=useState("")
const [loading,setLoading]=useState(false)

async function entrar(e:React.FormEvent){

e.preventDefault()

setErro("")
setLoading(true)

try{

const res = await axios.post("http://localhost:5000/admin/login",{

email,
senha

})

if(!res.data?.token){

throw new Error("Token não recebido")

}

localStorage.setItem("admin_token",res.data.token)
localStorage.setItem("admin_nome",res.data.admin.nome)

router.push("/admin/dashboard")

}catch(error:any){

console.log(error)

setErro(
error?.response?.data?.erro ||
"Email ou senha inválidos"
)

}

setLoading(false)

}

return(

<div
style={{
maxWidth:420,
margin:"80px auto",
padding:30,
background:"#fff",
borderRadius:10,
boxShadow:"0 5px 20px rgba(0,0,0,0.1)"
}}
>

<h1
style={{
textAlign:"center",
marginBottom:25
}}
>

Login Admin

</h1>

<form onSubmit={entrar}>

<input
type="email"
placeholder="Email"
value={email}
onChange={(e)=>setEmail(e.target.value)}
required
style={{
width:"100%",
padding:12,
marginBottom:15,
border:"1px solid #ccc",
borderRadius:6
}}
/>

<input
type="password"
placeholder="Senha"
value={senha}
onChange={(e)=>setSenha(e.target.value)}
required
style={{
width:"100%",
padding:12,
marginBottom:15,
border:"1px solid #ccc",
borderRadius:6
}}
/>

<button
type="submit"
disabled={loading}
style={{
width:"100%",
padding:12,
background:"#16a34a",
color:"#fff",
border:"none",
borderRadius:6,
fontWeight:"bold",
cursor:"pointer"
}}
>

{loading ? "Entrando..." : "Entrar"}

</button>

</form>

{erro && (

<p
style={{
color:"red",
marginTop:15,
textAlign:"center"
}}
>

{erro}

</p>

)}

</div>

)

}