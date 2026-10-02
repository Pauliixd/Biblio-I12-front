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


// ---------------------------------------------------------
// MODAL INFORMACIÓN
// ---------------------------------------------------------

const modalDetalle = new bootstrap.Modal(
  document.getElementById("modalDetallePrestamo")
);


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


  // Determinar si es estudiante o profesor
  const esEstudiante =
    prestamo.carrera ||
    prestamo.anio ||
    prestamo.curso ||
    prestamo.a_cargo;


  document.getElementById("detalleTipo").textContent =
    esEstudiante ? "Estudiante" : "Profesor";


  document.getElementById("detalleCarrera").textContent =
    mostrarDato(prestamo.carrera);


  document.getElementById("detalleAnio").textContent =
    mostrarDato(prestamo.anio);


  document.getElementById("detalleCurso").textContent =
    mostrarDato(prestamo.curso);


  document.getElementById("detalleACargo").textContent =
    mostrarDato(prestamo.a_cargo);


  document.getElementById("detalleFecha").textContent =
    mostrarDato(prestamo.fecha);


  document.getElementById("detalleEstado").textContent =
    mostrarDato(prestamo.estado);


  document.getElementById("detalleObservacion").textContent =
    mostrarDato(prestamo.observacion);


  modalDetalle.show();
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


              // Separación del comentario
              btnComentario.classList.add(
                "ms-4"
              );


              // Agregar al contenedor principal
              div.append(
                divEstados,
                btnComentario
              );


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


              btnComentario.classList.add(
                "ms-4"
              );


              // Agregar al contenedor
              div.append(
                divEstados,
                btnComentario
              );


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

          columnas,

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


              btnComentario.classList.add(
                "ms-4"
              );


              div.append(
                btnComentario
              );


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

