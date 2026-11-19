
function selecionarTipoLogin(tipo) {
    const btnCliente = document.getElementById("btnCliente");
    const btnPrestador = document.getElementById("btnPrestador");
    const texto = document.getElementById("textoTipoLogin");

    const clienteSelecionado = tipo === "cliente";

    btnCliente.classList.toggle("ativo", clienteSelecionado);
    btnPrestador.classList.toggle("ativo", !clienteSelecionado);

    btnCliente.setAttribute("aria-pressed", clienteSelecionado);
    btnPrestador.setAttribute("aria-pressed", !clienteSelecionado);

    texto.textContent = clienteSelecionado
        ? "Encontre o profissional certo para o seu serviço"
        : "Encontre ou ofereça serviços profissionais";
}
//LOGIN NO IJOB
function login(){
    const tipoLogin = document.getElementById("btnCliente").classList.contains("ativo") ? "cliente" : "prestador";
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;
if(email === "" || senha === ""){
    alert("Por favor, preencha todos os campos.");
    return;
}
const clienteSelecionado = document.getElementById("btnCliente").classList.contains("ativo");
document.getElementById("loginOverlay").style.display = "none";
if(clienteSelecionado){
document.getElementById("Pagina_do_Cliente").style.display = "block";
}else{
    document.getElementById("Pagina_do_Profissional").style.display = "block";
}
}
function firstlogin() {
    const tipoLogin = document.getElementById("btnCliente").classList.contains("ativo") ? "cliente" : "prestador";
    
const clienteSelecionado = document.getElementById("btnCliente").classList.contains("ativo");

    document.getElementById("loginOverlay").style.display = "none";

    if (clienteSelecionado) {
        document.getElementById("Cadastro_Cliente").style.display = "block";
    } else {
        document.getElementById("Cadastro_Profissional").style.display = "block";
    }
}
function mostrarSenha(){

    const senha = document.getElementById("senha");
    const icone = document.querySelector(".btnMostrarSenha i");
    if(senha.type === "password"){
        senha.type = "text";
        icone.classList.remove("fa-eye-slash");
        icone.classList.add("fa-eye");
    }else{
        senha.type = "password";
        icone.classList.remove("fa-eye");
        icone.classList.add("fa-eye-slash");
    }
}
function voltarLogin() {
    document.getElementById("Cadastro_Cliente").style.display = "none";
    document.getElementById("Cadastro_Profissional").style.display = "none";
    document.getElementById("loginOverlay").style.display = "block";
}
function solicitarservico(){
    document.getElementById("Pagina_do_Cliente").style.display = "none";
    document.getElementById("Localizacao").style.display = "block";
}
// LOCALIZAÇÃO
function localizacao() {
    window.open("https://www.google.com/maps", "_blank");
}
//Confirmar localização
function ConfirmarLocalizacao() {
    const endereco = document.getElementById("enderecoServico");
    const link = endereco.value.trim();
    if (link === "") {
        alert("Por favor, insira o endereço(link) do serviço.");
        return;
    }
    //validação do endereço de link
    try{
        const url = new URL(link);
         const dominioValido =
            url.protocol === "https:" && (url.hostname === "google.com" || url.hostname.endsWith(".google.com") || url.hostname === "maps.app.goo.gl" || url.hostname === "goo.gl");
    if (!dominioValido) {
        alert("Por favor, insira um link válido do Google Maps.");
        return;
    }
        }
    catch (error) {
        alert("O link informado é invalido!");
    }
    //guarda localização
    window.localizacaoServico = link;
    sessionStorage.setItem("localizacaoServico", link);
    //direciona para a criação do serviço
     document.getElementById("Localizacao").style.display = "none";
    document.getElementById("criarservico").style.display = "block";

}
