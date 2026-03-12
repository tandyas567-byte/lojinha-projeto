"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function Home(){

const router = useRouter()

const imagens=[
"/img projetor 1.webp",
"/img projetor 2.webp",
"/img projetor 3.webp",
"/img projetor 4.webp"
]

const [imagem,setImagem]=useState(imagens[0])
const [loading,setLoading]=useState(false)

async function comprar(){

setLoading(true)

try{

const res = await fetch("http://localhost:5000/pedido",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({

nome:"Cliente HyperTech",
cpf:"12345678900",
email:"cliente@email.com",
telefone:"11999999999",
nascimento:"1990-01-01",

cep:"01001000",
rua:"Rua teste",
numero:"123",
bairro:"Centro",
cidade:"São Paulo",
estado:"SP",

produto:"Projetor HY350",
valor:129.90

})
})

const data = await res.json()

localStorage.setItem("pixData",JSON.stringify(data))

router.push("/checkout")

}catch(e){

alert("Erro ao gerar pagamento")

}

setLoading(false)

}

return(

<div>

{/* PROMO */}

<div className="promo">
🔥 FRETE GRÁTIS HOJE • 10% OFF NO PIX • ATÉ 12X SEM JUROS
</div>

{/* HEADER */}

<header className="header">

<div className="logo">
<img src="/logohuper.png"/>
</div>

<div className="busca">

<div className="buscaBox">

<input placeholder="O que você está buscando?" />

<button>
🔍
</button>

</div>

</div>

<div className="menuDireita">

<div className="menuItem">
<div className="icone">💬</div>
<span>Atendimento</span>
</div>

<div className="menuItem">
<div className="icone">👤</div>
<span>Minha conta</span>
</div>

<div className="menuItem">
<div className="icone">🛒</div>
<span>Meu carrinho</span>
</div>

</div>

</header>

{/* PRODUTO */}

<div className="produtoContainer">

<div className="miniaturas">

{imagens.map((img,i)=>(
<img key={i} src={img} onClick={()=>setImagem(img)}/>
))}

</div>

<div className="imagemPrincipal">
<img src={imagem}/>
</div>

<div className="infoProduto">

<h1>
Projetor Hy350 T15Pro Magic Portátil Android 11 4k Hdmi Foco Smart
8000Im Full Hd Bluetooth Wifi 5g
</h1>

<p className="oferta">🔥 OFERTA LIMITADA</p>

<p className="precoAntigo">De R$ 699,90</p>

<p className="preco">Por R$ 129,90</p>

<p className="economia">💰 Economize R$ 570,00 hoje</p>

<p className="pix">💳 10% de desconto pagando no PIX</p>

<button
className="comprar"
onClick={comprar}
disabled={loading}
>
{loading ? "..." : "🛒 COMPRAR AGORA"}
</button>

</div>

</div>

{/* DESCRIÇÃO */}

<div className="descricaoProduto">

<h2>Descrição do Produto</h2>

<p>
Transforme qualquer espaço em um cinema com o Projetor HY350 Magic
Portátil! Com Android 11, resolução 4K, foco automático e 8000 lumens,
ele oferece uma experiência visual incrível. Conecte via HDMI,
Bluetooth, WiFi ou 5G e aproveite Full HD onde você estiver!

Sistema Android Integrado:
- Navegue por suas plataformas favoritas de streaming, baixe aplicativos
e desfrute de uma variedade de conteúdos diretamente no seu projetor.

Tamanho de Projeção Surpreendente:
- Tela ajustável de 40 a 150 polegadas.

Fonte de Luz LED e Tecnologia de Projeção LCD:
- Resolução óptica de 1920x1080.

Portátil e Versátil:
- Apenas 1 kg de peso.

Home Theater de Alta Performance:
- Contraste 10000:1 e brilho de 8000 Lumens.
</p>

<h3>Características</h3>

<ul>

<li>Android 11</li>
<li>Projeção 40-150 polegadas</li>
<li>LED</li>
<li>Wifi 2.4 / 5G</li>
<li>8GB armazenamento</li>
<li>8000 Lumens</li>

</ul>

</div>

{/* AVALIAÇÕES */}

<div className="avaliacoes">

<h2>⭐ Avaliações de clientes</h2>

<div className="avaliacao">
⭐⭐⭐⭐⭐
<p><b>Marcos Silva</b></p>
<p>Produto incrível! A imagem é muito boa.</p>
</div>

<div className="avaliacao">
⭐⭐⭐⭐⭐
<p><b>Juliana Costa</b></p>
<p>Vale muito a pena pelo preço.</p>
</div>

<div className="avaliacao">
⭐⭐⭐⭐⭐
<p><b>Pedro Henrique</b></p>
<p>Chegou rápido e funciona perfeito.</p>
</div>

</div>

</div>

)
}