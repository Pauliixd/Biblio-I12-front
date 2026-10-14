
/* =========================================================
  FRONT.JS - BIBLIOTECA ISFT Nº12
========================================================= */

// IMPORTS

import {
  obtenerInsumos,
  guardarPrestamo
} from "../bbdd/api.js";

import {
  crearTablaGeneral,
  buscarInsumo,
  obtenerFechaActual
} from "./funciones.js";

import {
  alertaAdvertencia,
  alertaError,
  alertaExito
} from "./alerts.js";


// =========================================================
// ELEMENTOS HTML
// =========================================================

const listaInsumos = document.getElementById("listaInsumos");
const btnPrestamo = document.getElementById("btnNuevoPrestamo");
const selectEstado = document.getElementById("selectEstado");
const inputBuscar = document.getElementById("inputBuscar");

const formPrestamo = document.getElementById("formPrestamo");
const inputDestinatario = document.getElementById("inputDestinatario");
const inputFecha = document.getElementById("inputFecha");
const inputObservacion = document.getElementById("Observacion_pres");

const totalInsumos = document.getElementById("totalInsumos");
const insumosPrestados = document.getElementById("insumosPrestados");
const insumosReparacion = document.getElementById("insumosReparacion");

const badgeSeleccionados = document.getElementById("badgeSeleccionados");


// =========================================================
// ELEMENTOS DEL FORMULARIO DE PRÉSTAMO
// =========================================================

const inputCarrera = document.getElementById("inputCarrera");
const inputAnio = document.getElementById("inputAnio");
const inputCurso = document.getElementById("inputCurso");
const inputACargo = document.getElementById("inputACargo");

const contenedorACargo = document.getElementById("contenedorACargo");
const datosEstudiante = document.getElementById("datosEstudiante");

const radiosTipoDestinatario = document.querySelectorAll(
  'input[name="tipoDestinatario"]'
);


// =========================================================
// MODAL DE BOOTSTRAP
// =========================================================

const elementoModal = document.getElementById("modalPrestamo");

const modalPrestamo = bootstrap.Modal.getOrCreateInstance(
  elementoModal
);


// =========================================================
// VARIABLES
// =========================================================

// Guarda los insumos seleccionados.
// Clave: código del insumo
// Valor: objeto completo del insumo

let insumosSeleccionados = new Map();

let insumosActuales = await obtenerInsumos();

const columnasInsumos = [
  {
    clave: "nombre_completo",
    texto: "Insumo"
  }
];


// =========================================================
// TIPO DE DESTINATARIO
// =========================================================

function obtenerTipoDestinatario() {

  const seleccionado = document.querySelector(
    'input[name="tipoDestinatario"]:checked'
  );

  return seleccionado ? seleccionado.value : "";
}


// =========================================================
// MOSTRAR / OCULTAR CAMPOS DEL FORMULARIO
// =========================================================

function actualizarCamposDestinatario() {

  const tipo = obtenerTipoDestinatario();

  const mostrarDatos =
    tipo === "estudiante" || tipo === "profesor";

  const esEstudiante = tipo === "estudiante";

  // Carrera, año y curso para ambos
  datosEstudiante.style.display =
    mostrarDatos ? "block" : "none";

  inputCarrera.required = mostrarDatos;
  inputAnio.required = mostrarDatos;
  inputCurso.required = mostrarDatos;

  // Profesor a cargo solamente para estudiantes
  contenedorACargo.style.display =
    esEstudiante ? "block" : "none";

  inputACargo.required = esEstudiante;

  if (!esEstudiante) {
    inputACargo.value = "";
  }
}


// Eventos de los radio buttons

radiosTipoDestinatario.forEach((radio) => {

  radio.addEventListener(
    "change",
    actualizarCamposDestinatario
  );

});

// Estado inicial del formulario
actualizarCamposDestinatario();


// =========================================================
// ESTADO SELECCIONADO EN EL FILTRO
// =========================================================

function estadoActual() {

  return selectEstado.value === "dispo";

}


// =========================================================
// ACTUALIZAR BADGE DE INSUMOS SELECCIONADOS
// =========================================================

function actualizarBadgeSeleccionados() {

  const cantidad = insumosSeleccionados.size;

  badgeSeleccionados.textContent =
    cantidad === 1
      ? "1 insumo seleccionado"
      : `${cantidad} insumos seleccionados`;

}


// =========================================================
// RENDERIZAR TABLA DE INSUMOS
// =========================================================

async function renderizarTabla() {

  listaInsumos.innerHTML = "";

  // Obtener insumos actualizados
  insumosActuales = await obtenerInsumos();

  const mostrarDisponibles = estadoActual();
  const textoBusqueda = inputBuscar.value.trim();

  let insumosFiltrados = [];

  // Filtrar según estado
  for (let i = 0; i < insumosActuales.length; i++) {

    const insumo = insumosActuales[i];
    const estado = insumo.estado.toLowerCase();

    if (mostrarDisponibles) {

      // Solo mostrar insumos disponibles y habilitados
      if (estado === "disponible" && insumo.activo) {
        insumosFiltrados.push(insumo);
      }

    } else {

      // Mostrar insumos prestados o no disponibles,
      // pero nunca los inhabilitados
      if (estado !== "disponible" && insumo.activo) {
        insumosFiltrados.push(insumo);
      }

    }
  }

  // Filtrar por texto o numeración
  insumosFiltrados = buscarInsumo(
    insumosFiltrados,
    textoBusqueda
  );

  // Crear tabla
  const tabla = crearTablaGeneral(
    insumosFiltrados,
    columnasInsumos,
    {
      seleccionar: mostrarDisponibles,

      seleccionados: new Set(
        insumosSeleccionados.keys()
      ),

      onToggle: (insumo, checked) => {

        if (checked) {

          insumosSeleccionados.set(
            insumo.codigo,
            insumo
          );

        } else {

          insumosSeleccionados.delete(
            insumo.codigo
          );

        }

        actualizarBadgeSeleccionados();
      }
    }
  );

  listaInsumos.appendChild(tabla);

}


// =========================================================
// CONTADORES DE INSUMOS
// =========================================================

async function actualizarContadores() {

  const insumos = await obtenerInsumos();

  let disponibles = 0;
  let prestados = 0;
  let enReparacion = 0;

  for (let i = 0; i < insumos.length; i++) {

    // No contar insumos inhabilitados
    if (!insumos[i].activo) {
      continue;
    }

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


// =========================================================
// INICIALIZACIÓN
// =========================================================

await actualizarContadores();
await renderizarTabla();

actualizarBadgeSeleccionados();


// =========================================================
// EVENTOS DE FILTROS
// =========================================================

// Filtro por estado

selectEstado.addEventListener(
  "change",
  renderizarTabla
);

// Buscador

inputBuscar.addEventListener(
  "input",
  renderizarTabla
);


// =========================================================
// BOTÓN NUEVO PRÉSTAMO
// =========================================================

btnPrestamo.addEventListener("click", (e) => {

  if (insumosSeleccionados.size === 0) {

    e.preventDefault();

    alertaAdvertencia(
      "Atención",
      "Seleccioná al menos un insumo disponible."
    );

    return;
  }

});


// =========================================================
// FECHA AUTOMÁTICA AL ABRIR EL MODAL
// =========================================================

elementoModal.addEventListener(
  "show.bs.modal",
  () => {

    // Colocar fecha actual
    inputFecha.value = obtenerFechaActual();

    // Actualizar campos visibles
    actualizarCamposDestinatario();

  }
);


// =========================================================
// REGISTRAR PRÉSTAMO
// =========================================================

formPrestamo.addEventListener("submit", async (e) => {

  e.preventDefault();

  // -------------------------------------------------------
  // DATOS DEL DESTINATARIO
  // -------------------------------------------------------

  const nombreDestinatario =
    inputDestinatario.value.trim();

  const tipo = obtenerTipoDestinatario();

  // Datos académicos comunes
  const carrera = inputCarrera.value;
  const anio = inputAnio.value;
  const curso = inputCurso.value.trim();

  // Solo estudiantes tienen profesor a cargo
  const aCargo = tipo === "estudiante"
    ? inputACargo.value.trim()
    : null;

  // -------------------------------------------------------
  // DATOS DEL PRÉSTAMO
  // -------------------------------------------------------

  const fecha = inputFecha.value;
  const observacion = inputObservacion.value.trim();


  // =======================================================
  // VALIDACIONES
  // =======================================================

  // Verificar selección de insumos
  if (insumosSeleccionados.size === 0) {

    alertaAdvertencia(
      "Sin selección",
      "No hay insumos seleccionados para el préstamo."
    );

    return;
  }

  // Verificar tipo
  if (tipo !== "estudiante" && tipo !== "profesor") {

    alertaAdvertencia(
      "Tipo de destinatario",
      "Seleccioná si el destinatario es estudiante o profesor."
    );

    return;
  }

  // Verificar datos obligatorios
  if (
    !nombreDestinatario ||
    !carrera ||
    !anio ||
    !curso
  ) {

    alertaAdvertencia(
      "Campos incompletos",
      "Completá nombre, carrera, año y curso."
    );

    return;
  }

  // Verificar profesor a cargo para estudiantes
  if (tipo === "estudiante" && !aCargo) {

    alertaAdvertencia(
      "Campo obligatorio",
      "Ingresá el nombre del profesor a cargo."
    );

    return;
  }

  // Verificar fecha
  if (!fecha) {

    alertaAdvertencia(
      "Fecha obligatoria",
      "Ingresá la fecha del préstamo."
    );

    return;
  }


  // =======================================================
  // GUARDAR PRÉSTAMOS
  // =======================================================

  try {

    // Registrar cada insumo seleccionado
    for (const insumo of insumosSeleccionados.values()) {

      await guardarPrestamo({

        id_insumo: insumo.id,

        // Destinatario
        id_destinatario: nombreDestinatario,
        tipo_destinatario: tipo,

        // Datos académicos
        carrera: carrera,
        anio: anio,
        curso: curso,
        a_cargo: aCargo,

        // Préstamo
        fecha_entrega: fecha,
        obs: observacion

      });

    }


    // =====================================================
    // LIMPIAR FORMULARIO
    // =====================================================

    formPrestamo.reset();

    insumosSeleccionados.clear();

    actualizarCamposDestinatario();

    actualizarBadgeSeleccionados();


    // =====================================================
    // ACTUALIZAR INTERFAZ
    // =====================================================

    await renderizarTabla();
    await actualizarContadores();


    // =====================================================
    // CERRAR MODAL
    // =====================================================

    modalPrestamo.hide();

    alertaExito(
      "Préstamo registrado",
      "El préstamo se registró correctamente."
    );

  } catch (error) {

    alertaError(
      error.message || "Ocurrió un error al registrar el préstamo."
    );

  }

});