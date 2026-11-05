// prestamos.js

import {
  obtenerPrestamosPorEstado,
  actualizarEstadoPrestamo,
  marcarComoDevuelto,
  modificarPrestamo
} from "../bbdd/api.js";

import { crearTablaPrestamo } from "./funciones.js";


// ---------------------------------------------------------
// ELEMENTOS HTML
// ---------------------------------------------------------

const contenedorActivos =
  document.getElementById("prestamosActivos");

const contenedorMorosos =
  document.getElementById("prestamosMorosos");

const contenedorHistorial =
  document.getElementById("prestamosHistorial");

const inputBuscar =
  document.getElementById("inputBuscar");


// ---------------------------------------------------------
// COLUMNAS
// ---------------------------------------------------------

const columnas = [

  {
    clave: "insumo",
    texto: "Insumo",

    render: (item) =>
      `${item.insumo}${item.numeracion ? " Nº " + item.numeracion : ""}`
  },

  {
    clave: "destinatario",
    texto: "Destinatario",

    onClick: (item) => {
      abrirModalDetalle(item);
    }
  },

  {
    clave: "fecha",
    texto: "Fecha"
  }

];

const columnasHistorial = [
    ...columnas,
    {
        clave: "fecha_devolucion",
        texto: "Fecha de devolución",
        render: (item) => item.fecha_devolucion || "—"
    }
];


// ---------------------------------------------------------
// MODAL INFORMACIÓN
// ---------------------------------------------------------

const modalDetalle = new bootstrap.Modal(
  document.getElementById("modalDetallePrestamo")
);
// ---------------------------------------------------------
// MODAL EDITAR
// ---------------------------------------------------------

const modalEditarPrestamo = bootstrap.Modal.getOrCreateInstance(
  document.getElementById("modalEditarPrestamo")
);
const formEditarPrestamo = document.getElementById("formEditarPrestamo");
const editPrestamoTipo = document.getElementById("editPrestamoTipo");
const editContenedorACargo = document.getElementById("editContenedorACargo");


function mostrarDato(valor) {

  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return "—";
  }

  return valor;
}


function abrirModalDetalle(prestamo) {

  document.getElementById("detalleInsumo").textContent =
    `${prestamo.insumo}${prestamo.numeracion ? " Nº " + prestamo.numeracion : ""}`;


  document.getElementById("detalleDestinatario").textContent =
    mostrarDato(prestamo.destinatario);

  document.getElementById("detalleFechaDevolucion").textContent =
    mostrarDato(prestamo.fecha_devolucion);

  // DETERMINAR TIPO DE DESTINATARIO

  let tipoDestinatario = "No especificado";

  if (prestamo.tipo_destinatario === "estudiante") {

    tipoDestinatario = "Estudiante";

  } else if (prestamo.tipo_destinatario === "profesor") {

    tipoDestinatario = "Profesor";

  } else if (prestamo.a_cargo) {

    // Compatibilidad con préstamos anteriores
    tipoDestinatario = "Estudiante";

  }

  document.getElementById("detalleTipo").textContent =
    tipoDestinatario;


  // DATOS ACADÉMICOS

  document.getElementById("detalleCarrera").textContent =
    mostrarDato(prestamo.carrera);

  document.getElementById("detalleAnio").textContent =
    mostrarDato(prestamo.anio);

  document.getElementById("detalleCurso").textContent =
    mostrarDato(prestamo.curso);

  document.getElementById("detalleACargo").textContent =
    mostrarDato(prestamo.a_cargo);


  // DATOS DEL PRÉSTAMO

  document.getElementById("detalleFecha").textContent =
    mostrarDato(prestamo.fecha);

  document.getElementById("detalleEstado").textContent =
    mostrarDato(prestamo.estado);

  document.getElementById("detalleObservacion").textContent =
    mostrarDato(prestamo.observacion);


  // MOSTRAR MODAL

  modalDetalle.show();
}

function actualizarCamposEdicion() {
  const esEstudiante = editPrestamoTipo.value === "estudiante";

  editContenedorACargo.style.display =
    esEstudiante ? "block" : "none";
}

editPrestamoTipo.addEventListener("change", actualizarCamposEdicion);


function abrirModalEditarPrestamo(prestamo) {

  document.getElementById("editPrestamoId").value =
    prestamo.idTransaccion;

  document.getElementById("editPrestamoDestinatario").value =
    prestamo.destinatario || "";

  editPrestamoTipo.value =
    prestamo.tipo_destinatario || "";

  document.getElementById("editPrestamoCarrera").value =
    prestamo.carrera || "";

  document.getElementById("editPrestamoAnio").value =
    prestamo.anio ?? "";

  document.getElementById("editPrestamoCurso").value =
    prestamo.curso || "";

  document.getElementById("editPrestamoACargo").value =
    prestamo.a_cargo || "";

  document.getElementById("editPrestamoFecha").value =
    prestamo.fecha || "";

  document.getElementById("editPrestamoObservacion").value =
    prestamo.observacion || "";

  actualizarCamposEdicion();

  modalEditarPrestamo.show();
}

// ---------------------------------------------------------
// MODAL COMENTARIO
// ---------------------------------------------------------

const modalComentario = new bootstrap.Modal(
  document.getElementById("modalComentario")
);

const inputComentario =
  document.getElementById("inputComentario");

const btnGuardarComentario =
  document.getElementById("btnGuardarComentario");

let prestamoComentarioActual = null;


function abrirModalComentario(prestamo) {

  prestamoComentarioActual = prestamo;


  document.getElementById("comentarioInsumo").textContent =
    `${prestamo.insumo}${prestamo.numeracion ? " Nº " + prestamo.numeracion : ""}`;


  document.getElementById("comentarioDestinatario").textContent =
    mostrarDato(prestamo.destinatario);


  // Si ya existe una observación,
  // se muestra para poder editarla

  inputComentario.value =
    prestamo.observacion || "";


  modalComentario.show();
}


// ---------------------------------------------------------
// GUARDAR COMENTARIO
// ---------------------------------------------------------

btnGuardarComentario.addEventListener(
  "click",
  async () => {

    if (!prestamoComentarioActual) {
      return;
    }


    const observacion =
      inputComentario.value.trim();


    try {

      await modificarPrestamo(
        prestamoComentarioActual.idTransaccion,
        {
          obs: observacion
        }
      );


      modalComentario.hide();


      Swal.fire({
        title: "Comentario guardado",
        text: "La observación del préstamo fue actualizada.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false
      });


      await renderizarTablas();


    } catch (error) {

      console.error(
        "Error al guardar comentario:",
        error
      );


      Swal.fire({
        title: "Error",
        text: "No se pudo guardar el comentario.",
        icon: "error"
      });

    }

  }
);


// ---------------------------------------------------------
// DEVOLVER
// ---------------------------------------------------------

function confirmarDevolucion(
  idTransaccion,
  insumoNombre
) {

  Swal.fire({

    title: "¿Seguro de devolver?",

    html:
      `Vas a marcar como devuelto el insumo <strong>${insumoNombre}</strong>.`,

    icon: "warning",

    showCancelButton: true,

    confirmButtonColor: "#28a745",

    cancelButtonColor: "#dc3545",

    confirmButtonText: "Sí, devolver",

    cancelButtonText: "Cancelar"

  }).then(async (result) => {

    if (result.isConfirmed) {

      await marcarComoDevuelto(
        idTransaccion
      );


      await renderizarTablas();


      Swal.fire({

        title: "¡Devuelto!",

        text:
          `El insumo ${insumoNombre} ha sido marcado como devuelto.`,

        icon: "success",

        timer: 2000,

        showConfirmButton: false

      });

    }

  });
}


// ---------------------------------------------------------
// MARCAR MOROSO
// ---------------------------------------------------------

function confirmarMoroso(
  idTransaccion,
  insumoNombre
) {

  Swal.fire({

    title: "¿Marcar como Moroso?",

    html:
      `Vas a marcar el préstamo de <strong>${insumoNombre}</strong> como moroso.`,

    icon: "warning",

    showCancelButton: true,

    confirmButtonColor: "#28a745",

    cancelButtonColor: "#dc3545",

    confirmButtonText: "Sí, Marcar Moroso",

    cancelButtonText: "Cancelar"

  }).then(async (result) => {

    if (result.isConfirmed) {

      await actualizarEstadoPrestamo(
        idTransaccion,
        "moroso"
      );


      await renderizarTablas();


      Swal.fire({

        title: "¡Moroso!",

        text:
          `${insumoNombre} ha sido movido a la sección de Morosos.`,

        icon: "info",

        timer: 2000,

        showConfirmButton: false

      });

    }

  });
}


// ---------------------------------------------------------
// BOTÓN COMENTARIO
// ---------------------------------------------------------

function crearBotonComentario(prestamo) {

  const btnComentario =
    document.createElement("button");


  btnComentario.type =
    "button";


  if (prestamo.observacion) {

    btnComentario.className =
      "btn btn-warning btn-sm";

    btnComentario.innerHTML =
      '<i class="bi bi-chat-left-text-fill"></i>';

    btnComentario.title =
      "Editar comentario";

  } else {

    btnComentario.className =
      "btn btn-outline-secondary btn-sm";

    btnComentario.innerHTML =
      '<i class="bi bi-chat-left-text"></i>';

    btnComentario.title =
      "Agregar comentario";
  }



  btnComentario.addEventListener(
    "click",
    (e) => {

      e.stopPropagation();

      abrirModalComentario(
        prestamo
      );

    }
  );


  return btnComentario;
}

function crearBotonEditar(prestamo) {
  const boton = document.createElement("button");

  boton.type = "button";
  boton.className = "btn btn-outline-primary btn-sm";
  boton.innerHTML = '<i class="bi bi-pencil-square"></i>';
  boton.title = "Editar préstamo";

  boton.addEventListener("click", (e) => {
    e.stopPropagation();
    abrirModalEditarPrestamo(prestamo);
  });

  return boton;
}


// ---------------------------------------------------------
// RENDERIZAR TABLAS
// ---------------------------------------------------------

async function renderizarTablas() {

  try {

    const {
      activos,
      morosos,
      devueltos
    } = await obtenerPrestamosPorEstado();


    const textoBusqueda =
      inputBuscar.value
        .trim()
        .toLowerCase();


    // -----------------------------------------------------
    // FILTRAR
    // -----------------------------------------------------

    function filtrarPorDestinatario(lista) {

      if (textoBusqueda === "") {
        return lista;
      }


      return lista.filter(
        (prestamo) =>

          prestamo.destinatario &&

          prestamo.destinatario
            .toLowerCase()
            .includes(textoBusqueda)
      );
    }


    const activosFiltrados =
      filtrarPorDestinatario(activos);


    const morososFiltrados =
      filtrarPorDestinatario(morosos);


    const devueltosFiltrados =
      filtrarPorDestinatario(devueltos)
        .sort(
          (a, b) =>
            new Date(b.fecha) -
            new Date(a.fecha)
        );


    // -----------------------------------------------------
    // LIMPIAR
    // -----------------------------------------------------

    contenedorActivos.innerHTML =
      "";

    contenedorMorosos.innerHTML =
      "";

    contenedorHistorial.innerHTML =
      "";


    // -----------------------------------------------------
    // ACTIVOS
    // -----------------------------------------------------

    if (activosFiltrados.length > 0) {

      contenedorActivos.appendChild(

        crearTablaPrestamo(

          activosFiltrados,

          columnas,

          {

            acciones: (prestamo) => {

              const div =
                document.createElement("div");


              // Contenedor principal
              div.className =
                "d-flex align-items-center justify-content-between";


              // -------------------------------------------------
              // BOTONES DE ESTADO
              // -------------------------------------------------

              const divEstados =
                document.createElement("div");


              divEstados.className =
                "d-flex gap-2";


              // -------------------------------------------------
              // BOTÓN DEVOLVER
              // -------------------------------------------------

              const btnDevolver =
                document.createElement("button");


              btnDevolver.className =
                "btn btn-success btn-sm";


              btnDevolver.textContent =
                "Marcar devuelto";


              btnDevolver.addEventListener(
                "click",
                (e) => {

                  e.stopPropagation();

                  confirmarDevolucion(

                    prestamo.idTransaccion,

                    prestamo.insumo

                  );

                }
              );


              // -------------------------------------------------
              // BOTÓN MOROSO
              // -------------------------------------------------

              const btnMoroso =
                document.createElement("button");


              btnMoroso.className =
                "btn btn-warning btn-sm";


              btnMoroso.textContent =
                "Marcar moroso";


              btnMoroso.addEventListener(
                "click",
                (e) => {

                  e.stopPropagation();

                  confirmarMoroso(

                    prestamo.idTransaccion,

                    prestamo.insumo

                  );

                }
              );


              // Agregar botones de estado
              divEstados.append(
                btnDevolver,
                btnMoroso
              );


              // -------------------------------------------------
              // BOTÓN COMENTARIO
              // -------------------------------------------------

              const btnComentario =
                crearBotonComentario(
                  prestamo
                );


              // Botón editar
              const btnEditar = crearBotonEditar(prestamo);

              // Contenedor de acciones
              const divAcciones = document.createElement("div");
              divAcciones.className = "d-flex gap-2 ms-3";

              // Agrupar botones
              divAcciones.append(btnEditar, btnComentario);

              // Agregar al contenedor principal
              div.append(divEstados, divAcciones);


              return div;
            }

          }

        )

      );

    } else {

      contenedorActivos.innerHTML =
        "<p class='text-muted text-center'>No hay préstamos activos.</p>";

    }


    // -----------------------------------------------------
    // MOROSOS
    // -----------------------------------------------------

    if (morososFiltrados.length > 0) {

      const tablaMorosos =
        crearTablaPrestamo(

          morososFiltrados,

          columnas,

          {

            acciones: (prestamo) => {

              const div =
                document.createElement("div");


              div.className =
                "d-flex align-items-center justify-content-between";


              // -------------------------------------------------
              // BOTONES DE ESTADO
              // -------------------------------------------------

              const divEstados =
                document.createElement("div");


              divEstados.className =
                "d-flex gap-2";


              // -------------------------------------------------
              // BOTÓN DEVOLVER
              // -------------------------------------------------

              const btnDevolver =
                document.createElement("button");


              btnDevolver.className =
                "btn btn-success btn-sm";


              btnDevolver.textContent =
                "Marcar devuelto";


              btnDevolver.addEventListener(
                "click",
                (e) => {

                  e.stopPropagation();

                  confirmarDevolucion(

                    prestamo.idTransaccion,

                    prestamo.insumo

                  );

                }
              );


              // Agregar botón de devolver
              divEstados.append(
                btnDevolver
              );


              // -------------------------------------------------
              // BOTÓN COMENTARIO
              // -------------------------------------------------

              const btnComentario =
                crearBotonComentario(
                  prestamo
                );


              // Agregar al contenedor
              const btnEditar = crearBotonEditar(prestamo);

              const divAcciones = document.createElement("div");
              divAcciones.className = "d-flex gap-2 ms-3";

              divAcciones.append(btnEditar, btnComentario);

              div.append(divEstados, divAcciones);


              return div;
            }

          }

        );


      contenedorMorosos.appendChild(
        tablaMorosos
      );


    } else {

      contenedorMorosos.innerHTML =
        "<p class='text-muted text-center'>No hay préstamos morosos.</p>";

    }


    // -----------------------------------------------------
    // HISTORIAL
    // -----------------------------------------------------

    if (devueltosFiltrados.length > 0) {

      contenedorHistorial.appendChild(

        crearTablaPrestamo(

          devueltosFiltrados,

          columnasHistorial,

          {

            acciones: (prestamo) => {

              const div =
                document.createElement("div");


              div.className =
                "d-flex align-items-center justify-content-between";


              // Botón comentario
              const btnComentario =
                crearBotonComentario(
                  prestamo
                );


              const divAcciones = document.createElement("div");
              divAcciones.className = "d-flex gap-2 ms-3";

              divAcciones.append(btnComentario);

              div.append(divAcciones);


              return div;
            }

          }

        )

      );

    } else {

      contenedorHistorial.innerHTML =
        "<p class='text-muted text-center'>No hay historial de préstamos devueltos.</p>";

    }


  } catch (error) {

    console.error(
      "Error al cargar los préstamos:",
      error
    );


    contenedorActivos.innerHTML =
      "<p class='text-danger text-center'>Error al cargar los préstamos.</p>";

  }

}

formEditarPrestamo.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = Number(
    document.getElementById("editPrestamoId").value
  );

  const tipo = editPrestamoTipo.value;

  const datos = {
    id_destinatario:
      document.getElementById("editPrestamoDestinatario").value.trim() || null,

    tipo_destinatario: tipo,

    carrera:
      document.getElementById("editPrestamoCarrera").value.trim() || null,

    anio:
      document.getElementById("editPrestamoAnio").value
        ? Number(document.getElementById("editPrestamoAnio").value)
        : null,

    curso:
      document.getElementById("editPrestamoCurso").value.trim() || null,

    a_cargo:
      tipo === "estudiante"
        ? document.getElementById("editPrestamoACargo").value.trim() || null
        : null,

    fecha_entrega:
      document.getElementById("editPrestamoFecha").value,

    obs:
      document.getElementById("editPrestamoObservacion").value.trim()
  };

  const boton = document.getElementById("btnGuardarEdicionPrestamo");

  boton.disabled = true;

  try {
    await modificarPrestamo(id, datos);

    modalEditarPrestamo.hide();

    await renderizarTablas();

    Swal.fire({
      title: "Préstamo actualizado",
      text: "Los cambios se guardaron correctamente.",
      icon: "success",
      timer: 1800,
      showConfirmButton: false
    });

  } catch (error) {
    Swal.fire({
      title: "Error al actualizar",
      text: error.message || "No se pudo modificar el préstamo.",
      icon: "error"
    });

  } finally {
    boton.disabled = false;
  }
});


// ---------------------------------------------------------
// CARGAR AL INICIAR
// ---------------------------------------------------------

renderizarTablas();


// ---------------------------------------------------------
// BUSCADOR
// ---------------------------------------------------------

inputBuscar.addEventListener(
  "input",
  () => {

    renderizarTablas();

  }
);

