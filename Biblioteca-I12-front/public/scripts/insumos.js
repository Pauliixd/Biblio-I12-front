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

const modalNuevoInsumo = new bootstrap.Modal(document.getElementById('modalNuevoInsumo'));
const modalEditar = new bootstrap.Modal(document.getElementById('modalEditarInsumo'));

const columnasInsumos = [
  { clave: "codigo", texto: "Código" },
  { clave: "nombre", texto: "Nombre" },
  { clave: "estado", texto: "Estado" },
  { clave: "observacion", texto: "Observación" },
];

// FUNCIONES

function crearBotoneraAcciones(insumo) {
  const div = document.createElement('div');
  div.className = 'btn-group btn-group-sm';

  const btnEditar = document.createElement('button');
  btnEditar.className = 'btn btn-outline-primary';
  btnEditar.innerHTML = '<i class="bi bi-pencil-square"></i>';
  btnEditar.title = 'Editar';
  btnEditar.addEventListener('click', () => abrirModalEditarInsumo(insumo));

  const btnEliminar = document.createElement('button');
  btnEliminar.className = 'btn btn-outline-danger';
  btnEliminar.innerHTML = '<i class="bi bi-trash"></i>';
  btnEliminar.title = 'Eliminar';

  btnEliminar.addEventListener("click", async () => {
    if (insumo.estado !== "No Disponible") {
      const ok = await confirmarAccion(
        "¿Seguro que querés eliminar?",
        `Insumo: ${String(insumo.nombre).toUpperCase()} (código: ${insumo.codigo})`
      );
      if (ok) {
        try {
          await eliminarInsumo(insumo.id);
          alertaExito("Se eliminó correctamente");
          await renderizarTablaInsumos();
        } catch (err) {
          alertaError(err.message || "No se pudo eliminar el insumo");
        }
      }
    } else {
      alertaError("No se puede eliminar un insumo no disponible");
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

  if (insumosFiltrados.length > 0) {
    const tablaCompleta = crearTablaGeneral(insumosFiltrados, columnasInsumos, {
      acciones: crearBotoneraAcciones
    });

    const newTbody = tablaCompleta.querySelector("tbody");
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
  const cantidad = parseInt(inputCantidadAlta.value);
  const observacion = textareaObservacionAlta.value.trim();

  if (isNaN(cantidad) || cantidad < 1) {
    alertaAdvertencia('Cantidad inválida', 'La cantidad debe ser un número mayor a cero.');
    return;
  }

  let insumosCreados = 0;
  try {
    // Se crean de a uno, en secuencia, para que el código autogenerado
    // (INS-0001, INS-0002...) no se pise entre sí.
    for (let i = 0; i < cantidad; i++) {
      await guardarInsumo({ nombre, observacion });
      insumosCreados++;
    }

    await renderizarTablaInsumos();
    formRegistroInsumo.reset();
    modalNuevoInsumo.hide();
    alertaExito('Alta exitosa', `${insumosCreados} insumo(s) "${nombre}" registrado(s) con éxito.`);
  } catch (err) {
    alertaError(err.message || `Se crearon ${insumosCreados} de ${cantidad} insumos antes de fallar.`);
    await renderizarTablaInsumos();
  }
});

inputBuscar.addEventListener('input', renderizarTablaInsumos);