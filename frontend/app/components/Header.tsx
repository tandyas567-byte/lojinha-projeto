import { FaSearch } from "react-icons/fa"

export default function Header(){

return(

<>
<div className="promo">
🔥 FRETE GRÁTIS HOJE • 10% OFF NO PIX • ATÉ 12X SEM JUROS
</div>

<header className="header">

<h1 className="logo">⚡ HyperTech</h1>

<div className="busca">

<input placeholder="O que você está procurando?"/>

<button>
<FaSearch/>
</button>

</div>

</header>

</>

)

}