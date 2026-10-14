// insumos.js

// IMPORTS
import {
  obtenerInsumos, guardarInsumo, actualizarInsumo, eliminarInsumo,
} from "../bbdd/api.js";

import { crearTablaGeneral, buscarInsumo } from "./funciones.js";

import { alertaAdvertencia, alertaError, alertaExito, confirmarAccion } from "./alerts.js";

// ELEMENTOS HTML
let insumosTablaBody = document.getElementById("insumosTablaBody");
const formRegistroInsumo = document.getElementById("registroInsumo");
const inputNombreAlta = document.getElementById("nombre");
const inputCantidadAlta = document.getElementById("cantidad");
const textareaObservacionAlta = document.getElementById("observacion");
const inputBuscar = document.getElementById("inputBuscar");
const botonConfirmarEdicion = document.getElementById("submitEditar");
const editCodigo = document.getElementById('editCodigo'); // ahora guarda el id numérico del backend
const editNombre = document.getElementById('editNombre');
const editEstado = document.getElementById('editEstado');
const editObservacion = document.getElementById('editObservacion');
const inputNumeroInventarioAlta = document.getElementById("numeroInventario");
const inputNumeracionAlta = document.getElementById("numeracion");
const modalNuevoInsumo = new bootstrap.Modal(document.getElementById('modalNuevoInsumo'));
const modalEditar = new bootstrap.Modal(document.getElementById('modalEditarInsumo'));

const columnasInsumos = [
  { clave: "numero_inventario", texto: "N.º Inventario" },
  { clave: "nombre_completo", texto: "Nombre" },
  { clave: "observacion", texto: "Observación" },
];

// FUNCIONES


function crearBotoneraAcciones(insumo) {

  const div = document.createElement("div");
  div.className = "btn-group btn-group-sm";

  const estaPrestado = insumo.estado === "Prestado";
  const estaInhabilitado = insumo.activo === false;

  // INSUMO INHABILITADO: SIN ACCIONES
  if (estaInhabilitado) {
    const texto = document.createElement("span");

    texto.className = "text-muted small";
    texto.innerHTML =
      '<i class="bi bi-lock-fill me-1"></i>Inhabilitado';

    div.appendChild(texto);
    return div;
  }

  // BOTÓN EDITAR
  const btnEditar = document.createElement("button");

  btnEditar.className = "btn btn-outline-primary";
  btnEditar.innerHTML =
    '<i class="bi bi-pencil-square"></i>';

  btnEditar.title = estaPrestado
    ? "No se puede editar un insumo prestado"
    : "Editar";

  btnEditar.disabled = estaPrestado;

  btnEditar.addEventListener("click", () => {
    abrirModalEditarInsumo(insumo);
  });

  // BOTÓN ELIMINAR (BAJA LÓGICA)
  const btnEliminar = document.createElement("button");

  btnEliminar.className = "btn btn-outline-danger";
  btnEliminar.innerHTML =
    '<i class="bi bi-trash"></i>';

  btnEliminar.title = estaPrestado
    ? "No se puede inhabilitar un insumo prestado"
    : "Inhabilitar insumo";

  btnEliminar.disabled = estaPrestado;

  btnEliminar.addEventListener("click", async () => {

    const confirmado = await confirmarAccion(
      "¿Inhabilitar este insumo?",
      `El insumo "${insumo.nombre_completo}" dejará de estar disponible. Solo soporte técnico podrá volver a habilitarlo.`
    );

    if (!confirmado) return;

    try {

      await eliminarInsumo(insumo.id);

      await renderizarTablaInsumos();

      alertaExito(
        "Insumo inhabilitado",
        "El insumo se inhabilitó correctamente."
      );

    } catch (error) {

      alertaError(
        error.message || "No se pudo inhabilitar el insumo."
      );

    }
  });

  div.appendChild(btnEditar);
  div.appendChild(btnEliminar);

  return div;
}

async function renderizarTablaInsumos() {
  let insumos;
  try {
    insumos = await obtenerInsumos();
  } catch (err) {
    alertaError(err.message || "No se pudieron cargar los insumos");
    insumos = [];
  }

  const textoBusqueda = inputBuscar.value.trim();
  const insumosFiltrados = buscarInsumo(insumos, textoBusqueda);

  insumosFiltrados.sort((a, b) => {
    return Number(b.activo) - Number(a.activo);
  });

  if (insumosFiltrados.length > 0) {
    const tablaCompleta = crearTablaGeneral(insumosFiltrados, columnasInsumos, {
      acciones: crearBotoneraAcciones
    });

    const newTbody = tablaCompleta.querySelector("tbody");
    const filas = newTbody.querySelectorAll("tr");

    filas.forEach((fila, indice) => {
      const insumo = insumosFiltrados[indice];

      if (insumo && insumo.activo === false) {
        fila.classList.add("insumo-inhabilitado");
      }
    });
    
    newTbody.id = "insumosTablaBody";

    insumosTablaBody.replaceWith(newTbody);
    insumosTablaBody = newTbody;
  } else {
    const newTbody = document.createElement("tbody");
    newTbody.id = "insumosTablaBody";
    newTbody.innerHTML = `
            <tr>
                <td colspan="${columnasInsumos.length + 1}" 
                    class="text-center text-muted">
                    No hay insumos para mostrar.
                </td>
            </tr>
        `;
    insumosTablaBody.replaceWith(newTbody);
    insumosTablaBody = newTbody;
  }
}

function abrirModalEditarInsumo(insumo) {
  editCodigo.value = insumo.id; // id real del backend, no el código de negocio
  editNombre.value = insumo.nombre;
  editEstado.value = insumo.estado;
  editObservacion.value = insumo.observacion || '';

  if (insumo.estado === "Prestado") {
    alertaError("No se puede modificar un insumo Prestado");
    return;
  }

  modalEditar.show();

  botonConfirmarEdicion.addEventListener("click", async (e) => {
    e.preventDefault();

    try {
      await actualizarInsumo(insumo.id, {
        nombre: editNombre.value,
        estado: editEstado.value,
        observacion: editObservacion.value,
      });
      await renderizarTablaInsumos();
      modalEditar.hide();
      alertaExito('Actualización exitosa', `Se actualizó el insumo "${editNombre.value.toUpperCase()}" correctamente.`);
    } catch (err) {
      alertaError(err.message || "No se pudo modificar");
    }
  }, { once: true });
}

// EVENTOS

renderizarTablaInsumos();

formRegistroInsumo.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre = inputNombreAlta.value.trim();
  const numero_inventario = inputNumeroInventarioAlta.value.trim();
  const cantidad = parseInt(inputCantidadAlta.value);
  const numeracionValor = inputNumeracionAlta.value.trim();
  const numeracion = numeracionValor === "" ? undefined : parseInt(numeracionValor);
  const observacion = textareaObservacionAlta.value.trim();

  if (isNaN(cantidad) || cantidad < 1) {
    alertaAdvertencia('Cantidad inválida', 'La cantidad debe ser un número mayor a cero.');
    return;
  }

  try {
    // Un solo request: el backend crea las "cantidad" unidades en una
    // misma transacción, generando codigo y numeracion sin pisarse entre sí.
    const resultado = await guardarInsumo({ nombre, numero_inventario, cantidad, numeracion, observacion });

    await renderizarTablaInsumos();
    formRegistroInsumo.reset();
    modalNuevoInsumo.hide();
    alertaExito('Alta exitosa', resultado.mensaje || `${cantidad} insumo(s) "${nombre}" registrado(s) con éxito.`);
  } catch (err) {
    alertaError(err.message || "No se pudieron crear los insumos.");
    await renderizarTablaInsumos();
  }
});

inputBuscar.addEventListener('input', renderizarTablaInsumos);