// index.js
import { login } from "../bbdd/api.js";

const formulario = document.getElementById("forms");
const parrafo = document.getElementById("parrafo");

formulario.addEventListener("submit", async function (e) {
  e.preventDefault();

  let dni = document.getElementById("dni").value;
  let password = document.getElementById("password").value;

  parrafo.textContent = "";

  try {
    await login(dni, password);
    window.location.href = "paginas/home.html";
  } catch (err) {
    console.error("Error real del login:", err);
    parrafo.textContent = "Usuario o contraseña incorrecta";
  }
});