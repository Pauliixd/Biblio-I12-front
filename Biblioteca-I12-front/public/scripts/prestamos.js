
// prestamos.js

import {
  obtenerPrestamosPorEstado,
  actualizarEstadoPrestamo,
  marcarComoDevuelto
} from "../bbdd/api.js";

import { crearTablaGeneral } from "./funciones.js";

// ELEMENTOS HTML
const contenedorActivos = document.getElementById("prestamosActivos");
const contenedorMorosos = document.getElementById("prestamosMorosos");
const contenedorHistorial = document.getElementById("prestamosHistorial");
const inputBuscar = document.getElementById("inputBuscar");

const columnas = [
  { clave: "codigoInsumo", texto: "Código de Insumo" },
  { clave: "insumo", texto: "Insumo" },
  { clave: "destinatario", texto: "Destinatario" },
  { clave: "fecha", texto: "Fecha" },
  { clave: "observacion", texto: "Observacion" },
  { clave: "estado", texto: "Estado" },
];


// ---------------------------------------------------------
// DEVOLVER
// ---------------------------------------------------------

function confirmarDevolucion(idTransaccion, insumoNombre) {

    Swal.fire({
        title: "¿Seguro de devolver?",
        html: `Vas a marcar como devuelto el insumo <strong>${insumoNombre}</strong>.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#28a745",
        cancelButtonColor: "#dc3545",
        confirmButtonText: "Sí, devolver",
        cancelButtonText: "Cancelar"
    }).then(async (result) => {

        if (result.isConfirmed) {

            await marcarComoDevuelto(idTransaccion);

            await renderizarTablas();

            Swal.fire({
                title: "¡Devuelto!",
                text: `El insumo ${insumoNombre} ha sido marcado como devuelto.`,
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

function confirmarMoroso(idTransaccion, insumoNombre) {

    Swal.fire({
        title: "¿Marcar como Moroso?",
        html: `Vas a marcar el préstamo de <strong>${insumoNombre}</strong> como moroso.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#28a745",
        cancelButtonColor: "#dc3545",
        confirmButtonText: "Sí, Marcar Moroso",
        cancelButtonText: "Cancelar"
    }).then(async (result) => {

        if (result.isConfirmed) {

            await actualizarEstadoPrestamo(idTransaccion, "moroso");

            await renderizarTablas();

            Swal.fire({
                title: "¡Moroso!",
                text: `${insumoNombre} ha sido movido a la sección de Morosos.`,
                icon: "info",
                timer: 2000,
                showConfirmButton: false
            });
        }
    });
}


// ---------------------------------------------------------
// RENDERIZAR TABLAS
// ---------------------------------------------------------

async function renderizarTablas() {

  try {

    const { activos, morosos, devueltos } =
      await obtenerPrestamosPorEstado();
      console.log("ACTIVOS:", activos);
      console.log("MOROSOS:", morosos);
      console.log("DEVUELTOS:", devueltos);

    const textoBusqueda = inputBuscar.value.trim().toLowerCase();


    // Filtrar por destinatario
    function filtrarPorDestinatario(lista) {

      if (textoBusqueda === "") {
        return lista;
      }

      return lista.filter(prestamo =>
        prestamo.destinatario &&
        prestamo.destinatario.toLowerCase().includes(textoBusqueda)
      );
    }


    const activosFiltrados =
      filtrarPorDestinatario(activos);

    const morososFiltrados =
      filtrarPorDestinatario(morosos);

    const devueltosFiltrados =
      filtrarPorDestinatario(devueltos);


    // Limpiar contenedores
    contenedorActivos.innerHTML = "";
    contenedorMorosos.innerHTML = "";
    contenedorHistorial.innerHTML = "";


    // -----------------------------------------------------
    // ACTIVOS
    // -----------------------------------------------------

    if (activosFiltrados.length > 0) {

      contenedorActivos.appendChild(

        crearTablaGeneral(
          activosFiltrados,
          columnas,
          {
            acciones: (prestamo) => {

              const div = document.createElement("div");

              div.className = "btn-group btn-group-sm";


              // BOTÓN DEVOLVER

              const btnDevolver =
                document.createElement("button");

              btnDevolver.className =
                "btn btn-success btn-sm";

              btnDevolver.textContent =
                "Marcar devuelto";

              btnDevolver.addEventListener("click", () => {

                confirmarDevolucion(
                  prestamo.idTransaccion,
                  prestamo.insumo
                );

              });


              // BOTÓN MOROSO

              const btnMoroso =
                document.createElement("button");

              btnMoroso.className =
                "btn btn-warning btn-sm";

              btnMoroso.textContent =
                "Marcar moroso";

              btnMoroso.addEventListener("click", () => {

                confirmarMoroso(
                  prestamo.idTransaccion,
                  prestamo.insumo
                );

              });


              div.append(
                btnDevolver,
                btnMoroso
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
        crearTablaGeneral(
          morososFiltrados,
          columnas,
          {
            acciones: (prestamo) => {

              const btnDevolver =
                document.createElement("button");

              btnDevolver.className =
                "btn btn-success btn-sm";

              btnDevolver.textContent =
                "Marcar devuelto";

              btnDevolver.addEventListener("click", () => {

                confirmarDevolucion(
                  prestamo.idTransaccion,
                  prestamo.insumo
                );

              });

              return btnDevolver;
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

        crearTablaGeneral(
          devueltosFiltrados,
          columnas
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