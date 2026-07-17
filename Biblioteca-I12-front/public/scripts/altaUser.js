/* altaUser.js - Maneja la lógica del formulario de Alta de Usuario
import { alertaExito, alertaError } from './alerts.js';
import {renderizarTablaUsuarios} from './usuarios.js'

//import  {obtenerUsuarios, guardarUsuario,CLAVE_USUARIOS, obtenerSiguienteCodigo } from '../bbdd/bd.js';

import { obtenerUsuarios, guardarUsuario, CLAVE_USUARIOS, obtenerSiguienteCodigo, crearUsuario } from '../bbdd/api.js';

// ELEMENTOS HTML
const formAltaUsuario = document.getElementById("altaUsuarioForm");
const inputNombre = document.getElementById("nombreYApellido");
const inputDni = document.getElementById("dni");
const inputEmail = document.getElementById("email");
const selectCargo = document.getElementById("cargo");
const inputPassword1 = document.getElementById("altaPassword");
const mensajeDiv = document.getElementById("mensaje");
const modalAltaUsuario = new bootstrap.Modal(document.getElementById('modalAltaUsuario'));

//FUNCIONES

// busca si ya existe un usuario con el mismo DNI ( reciclada :) )
function buscarIndicePorDni(array, dni) {
  let i = 0;
  let indice = -1;

  if (array.length === 0) {
    return indice;
  } else {
    do {
      if (array[i].dni === dni) {
        indice = i;
      }
      i++;
    } while (indice === -1 && i < array.length);
  }
  return indice;
}



//EVENTOS

// EVENTO DE ALTA DE USUARIO
formAltaUsuario.addEventListener("submit", (e) => {
  e.preventDefault();
  mensajeDiv.textContent = "";

  const nombreYApellido = inputNombre.value.trim();
  const dni = inputDni.value.trim();
  const email = inputEmail.value.trim();
  const cargo = selectCargo.value;
  const password = inputPassword1.value;

  // Validaciones básicas
  if (password !== dni) {
    mensajeDiv.textContent = "La contraseña debe coincidir con el DNI ingresado.";
    return;
  }

  if (!nombreYApellido || !dni || !email || !cargo || !password) {
    mensajeDiv.textContent = "Por favor, completá todos los campos.";
    return;
  }

  // Obtener usuarios actuales
  const usuarios = obtenerUsuarios();

  // Verificar si ya existe el usuario por DNI
  if (buscarIndicePorDni(usuarios, dni) !== -1) {
    alertaError('Alta Usuario', 'Ya existe un usuario con ese DNI.');
    return;
  }

  // Crear el nuevo usuario
  const nuevoUsuario = {
    codigo: obtenerSiguienteCodigo(CLAVE_USUARIOS),
    dni: dni,
    nombreYApellido: nombreYApellido,
    email: email,
    cargo: cargo,
    passwordSystem: dni,
    active: true,
  };

  // Guardar usuario 
    const usuarioGuardado = guardarUsuario(nuevoUsuario);

if (usuarioGuardado) {
    formAltaUsuario.reset();
    modalAltaUsuario.hide();
    alertaExito('Alta Usuario', `Usuario ${nombreYApellido} registrado con éxito.`);

    renderizarTablaUsuarios();
    
  } else {
    alertaError('Alta Usuario', 'Error al intentar guardar el usuario.');
  }
}); */

// altaUser.js - Maneja la lógica del formulario de Alta de Usuario
import { alertaExito, alertaError } from './alerts.js';
import { renderizarTablaUsuarios } from './usuarios.js';
import { crearUsuario } from '../bbdd/api.js';

// ELEMENTOS HTML
const formAltaUsuario = document.getElementById("altaUsuarioForm");
const inputNombre = document.getElementById("nombreYApellido");
const inputDni = document.getElementById("dni");
const inputEmail = document.getElementById("email");
// NOTA: selectCargo se deja en el HTML pero no se usa todavía: el backend
// no tiene roles cargados ni acepta id_rol al crear un usuario. Cuando esté
// listo del lado del back, se vuelve a conectar acá.
const inputPassword1 = document.getElementById("altaPassword");
const mensajeDiv = document.getElementById("mensaje");
const modalAltaUsuario = new bootstrap.Modal(document.getElementById('modalAltaUsuario'));

// FUNCIONES

// El backend pide nombre y apellido por separado, pero el form tiene un solo
// campo "Nombre y Apellido". Se separa tomando la primera palabra como nombre
// y el resto como apellido. Es una aproximación razonable para nombres
// simples, pero conviene en algún momento separar esto en dos inputs en el HTML.
function separarNombreApellido(nombreCompleto) {
  const partes = nombreCompleto.trim().split(/\s+/);
  const nombre = partes[0] || "";
  const apellido = partes.slice(1).join(" ") || nombre;
  return { nombre, apellido };
}

// EVENTOS

formAltaUsuario.addEventListener("submit", async (e) => {
  e.preventDefault();
  mensajeDiv.textContent = "";

  const nombreYApellido = inputNombre.value.trim();
  const dni = inputDni.value.trim();
  const email = inputEmail.value.trim();

  // Validaciones básicas (se mantienen igual que antes)
  if (!nombreYApellido || !dni || !email) {
    mensajeDiv.textContent = "Por favor, completá todos los campos.";
    return;
  }

  const { nombre, apellido } = separarNombreApellido(nombreYApellido);

  try {
    // La contraseña inicial es el propio DNI (misma regla que antes).
    await crearUsuario({ dni, nombre, apellido, email });

    formAltaUsuario.reset();
    modalAltaUsuario.hide();
    alertaExito('Alta Usuario', `Usuario ${nombreYApellido} registrado con éxito.`);

    await renderizarTablaUsuarios();
  } catch (err) {
    // El backend devuelve 400 si el DNI (username) o el email ya existen
    alertaError('Alta Usuario', err.message || 'Error al intentar guardar el usuario.');
  }
});