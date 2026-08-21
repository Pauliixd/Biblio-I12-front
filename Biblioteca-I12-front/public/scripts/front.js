// front.js

// IMPORTS

//import { guardarPrestamo,actualizarInsumosPrestados,obtenerInsumos } from "../bbdd/bd.js";

import { obtenerInsumos, guardarPrestamo } from "../bbdd/api.js";



import { crearTablaGeneral, buscarInsumo  } from "./funciones.js";

import { alertaAdvertencia, alertaError, alertaExito } from "./alerts.js";

// ELEMENTOS HTML
const listaInsumos = document.getElementById("listaInsumos");
const btnPrestamo = document.getElementById("btnNuevoPrestamo");
const selectEstado = document.getElementById("selectEstado");
const inputBuscar = document.getElementById("inputBuscar"); 
const formPrestamo = document.getElementById("formPrestamo");
const inputDestinatario = document.getElementById("inputDestinatario");
const inputFecha = document.getElementById("inputFecha");
const inputobservacion = document.getElementById ("Observacion_pres")
const totalInsumos = document.getElementById("totalInsumos")
const insumosPrestados = document.getElementById("insumosPrestados")
const insumosReparacion = document.getElementById("insumosReparacion")


const modalPrestamo = new bootstrap.Modal(document.getElementById('modalPrestamo')); // Instancia del modal de Bootstrap

// VARIABLES
// let insumosSeleccionados = [];
let insumosSeleccionados = new Map(); // codigo -> insumo completo
let insumosActuales = await obtenerInsumos(); // Inicializar con todos los insumos

const columnasInsumos = [
  { clave: "codigo", texto: "Código" },
  { clave: "nombre", texto: "Nombre" },
  { clave: "estado", texto: "Estado" },
];

// FUNCIONES

function estadoActual() {
  if (selectEstado.value === "dispo") {
    return true;
  } else {
    return false;
  }
}
/*
function obtenerInsumosSeleccionados() {
  // crearTablaGeneral no le pone ID, por eso se busca dentro de listaInsumos.
  const checkboxes = listaInsumos.querySelectorAll('input[type="checkbox"]:checked');
  const seleccionados = [];
  checkboxes.forEach((checkbox) => {
    const fila = checkbox.closest("tr");
    // Se ajustan los índices de las celdas (si 'seleccionar' está true, es la 2da y 3ra celda)
    const codigo = fila.querySelector("td:nth-child(2)").textContent;
    const nombre = fila.querySelector("td:nth-child(3)").textContent;
    seleccionados.push({ codigo: parseInt(codigo), nombre });
  });
  return seleccionados;
}
  */
function obtenerInsumosSeleccionados() {
  const checkboxes = listaInsumos.querySelectorAll('input[type="checkbox"]:checked');
  const seleccionados = [];

  checkboxes.forEach((checkbox) => {
    const fila = checkbox.closest("tr");
    // Obtenemos el código mostrado en la segunda celda (ej: INS-0001)
    const codigoTexto = fila.querySelector("td:nth-child(2)").textContent.trim();
    
    // Buscamos el insumo completo dentro de la lista actual en memoria
    const insumoEncontrado = insumosActuales.find(ins => ins.codigo === codigoTexto);
    if (insumoEncontrado) {
      seleccionados.push(insumoEncontrado);
    }
  });

  return seleccionados;
}

async function renderizarTabla() {
  listaInsumos.innerHTML = ""; 
  insumosActuales = await obtenerInsumos();
  let mostrarDisponibles = estadoActual();
  let textoBusqueda = inputBuscar.value.trim();

  let insumosFiltrados = [];
  let insumosFiltradosNoDispo = [];

  for (let i = 0; i < insumosActuales.length; i++) {
    let insumo = insumosActuales[i];
    let estado = insumo.estado.toLowerCase();
    if (mostrarDisponibles && estado === "disponible") {
      insumosFiltrados.push(insumo);
    } else if (!mostrarDisponibles && estado !== "disponible") {
      insumosFiltradosNoDispo.push(insumo);
    }
  }

  let tabla;
  insumosFiltrados = buscarInsumo(insumosFiltrados, textoBusqueda);

  if (insumosFiltrados.length > 0) {
  tabla = crearTablaGeneral(insumosFiltrados, columnasInsumos, {
    seleccionar: true,
    seleccionados: new Set(insumosSeleccionados.keys()),
    onToggle: (insumo, checked) => {
      if (checked) {
        insumosSeleccionados.set(insumo.codigo, insumo);
      } else {
        insumosSeleccionados.delete(insumo.codigo);
      }
    }
  });
} else {
  tabla = crearTablaGeneral(insumosFiltradosNoDispo, columnasInsumos, { seleccionar: false });
}

  listaInsumos.appendChild(tabla);
}


// ----- Funcionalidad para los cuadros informativos de inicio ----------

async function actualizarContadores() {
  const insumos = await obtenerInsumos();

  let disponibles = 0;
  let prestados = 0;
  let enReparacion = 0;

for (let i = 0; i < insumos.length; i++) {
  const estado = insumos[i].estado.toLowerCase();

  if (estado === "disponible") {
    disponibles++;
  } else if (estado === "prestado") {
    prestados++;
  } else {
    enReparacion++;
  }
}

totalInsumos.textContent = disponibles;
insumosPrestados.textContent = prestados;
insumosReparacion.textContent = enReparacion;
}


// EVENTOS

await actualizarContadores();
await renderizarTabla();


// Filtro de estado
selectEstado.addEventListener("change", renderizarTabla);

//InputBuscar
inputBuscar.addEventListener("input", renderizarTabla);

// Al hacer click en "Nuevo Préstamo" (en el modal)
btnPrestamo.addEventListener("click", async (e) => {
  if (insumosSeleccionados.size === 0) {
    e.preventDefault();
    alertaAdvertencia('Atención','Seleccioná al menos un insumo disponible.');
    return;
  }
});

// Al enviar el formulario de préstamo
/*
formPrestamo.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre = inputDestinatario.value.trim();
  const fecha = inputFecha.value;
  const observacion = inputobservacion.value

  // Verificar si hay insumos seleccionados (solo para seguridad, ya se chequeó al abrir el modal)
  if (insumosSeleccionados.length === 0) {
    alertaAdvertencia('Sin selección','No hay insumos seleccionados para el préstamo.')
    return;
  }

for (let i = 0; i < insumosSeleccionados.length; i++) {
  const insumo = insumosSeleccionados[i];

  const nuevoPrestamo = {
    codigoInsumo: insumo.codigo, // Código del insumo
    insumo: insumo.nombre,
    destinatario: nombre,
    fecha: fecha, // Fecha del préstamo
    observacion: observacion,
    estado: "activo"
  };

  guardarPrestamo(nuevoPrestamo);
  actualizarContadores();
}

  actualizarInsumosPrestados(insumosSeleccionados);

  // Resetear formulario y variables
  formPrestamo.reset();
  insumosSeleccionados = [];

  renderizarTabla();
  actualizarContadores();
  modalPrestamo.hide(); // Cierra el modal

  alertaExito('Préstamo registrado','El préstamo se registró correctamente.')


});
*/
formPrestamo.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombreDestinatario = inputDestinatario.value.trim();
  const fecha = inputFecha.value;
  const observacion = inputobservacion.value;

  if (insumosSeleccionados.size === 0) {
    alertaAdvertencia('Sin selección', 'No hay insumos seleccionados para el préstamo.');
    return;
  }

  try {
    for (const insumo of insumosSeleccionados.values()) {
      await guardarPrestamo({
        id_insumo: insumo.id,
        id_destinatario: nombreDestinatario,
        fecha_entrega: fecha,
        obs: observacion,
      });
    }

    formPrestamo.reset();
    insumosSeleccionados.clear();

    await renderizarTabla();
    await actualizarContadores();

    modalPrestamo.hide();

    alertaExito('Préstamo registrado', 'El préstamo se registró correctamente.');
  } catch (error) {
    alertaError(error.message || 'Ocurrió un error al registrar el préstamo.');
  }
});