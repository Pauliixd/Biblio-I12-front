// funciones.js

export function crearTablaGeneral(datos, columnas, opciones) {

  const seleccionar = opciones && opciones.seleccionar;
  const acciones = opciones && opciones.acciones;
  const seleccionados = (opciones && opciones.seleccionados) || new Set();
  const onToggle = opciones && opciones.onToggle;

  const tabla = document.createElement("table");
  tabla.className = "table table-hover align-middle";

  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");
  const trHead = document.createElement("tr");


  // ENCABEZADOS
  for (let i = 0; i < columnas.length; i++) {

    const th = document.createElement("th");

    th.textContent = columnas[i].texto;

    trHead.appendChild(th);
  }


  if (acciones) {

    const th = document.createElement("th");

    th.textContent = "Acciones";

    trHead.appendChild(th);
  }

  thead.appendChild(trHead);


  // FILAS
  for (let i = 0; i < datos.length; i++) {

    const tr = document.createElement("tr");
    const item = datos[i];


    // COLUMNAS
    for (let j = 0; j < columnas.length; j++) {

      const td = document.createElement("td");
      const columna = columnas[j];

      if (columna.render) {

        td.textContent = columna.render(item);

      } else {

        td.textContent = item[columna.clave] || "";

      }

      tr.appendChild(td);
    }


    // SELECCIONAR FILA
    if (seleccionar) {

      tr.classList.add("fila-seleccionable");

      if (seleccionados.has(item.codigo)) {
        tr.classList.add("fila-seleccionada");
      }

      tr.addEventListener("click", () => {

        const marcada =
          tr.classList.toggle("fila-seleccionada");

        if (onToggle) {
          onToggle(item, marcada);
        }

      });
    }


    // ACCIONES
    if (acciones) {

      const td = document.createElement("td");

      td.appendChild(
        acciones(item)
      );

      tr.appendChild(td);
    }


    tbody.appendChild(tr);
  }


  tabla.appendChild(thead);
  tabla.appendChild(tbody);

  return tabla;
}

// -----------------------------------------------------------------------

export function buscarInsumo(insumos, valor) {
  const texto = valor.trim().toLowerCase();
  if (texto === "") {
    return insumos;
  }

  const resultado = [];

  for (let i = 0; i < insumos.length; i++) {
    const insumo = insumos[i];
    let nombre = "";
    let numeracion = "";
    
    if (insumo.nombre) {
      nombre = insumo.nombre.toLowerCase();
    }
    if (insumo.numeracion) {
      numeracion = String(insumo.numeracion).toLowerCase();
    }

    if (nombre.includes(texto) || numeracion.includes(texto)) {
      resultado.push(insumo);
    }
  }

  return resultado;
}


// -----------------------------------------------------------------------
//generar tabla para prestamos, activos, morosos y devueltos

export function crearTablaPrestamo(datos, columnas, opciones) {
  const seleccionar = opciones && opciones.seleccionar;
  const acciones = opciones && opciones.acciones;
  const seleccionados = (opciones && opciones.seleccionados) || new Set();
  const onToggle = opciones && opciones.onToggle;

  const tabla = document.createElement("table");
  tabla.className = "table table-hover align-middle";

  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");
  const trHead = document.createElement("tr");


  // ENCABEZADOS
  for (let i = 0; i < columnas.length; i++) {
    const th = document.createElement("th");
    th.textContent = columnas[i].texto;
    trHead.appendChild(th);
  }

  if (acciones) {
    const th = document.createElement("th");
    th.textContent = "Acciones";
    trHead.appendChild(th);
  }

  thead.appendChild(trHead);


  // FILAS
  for (let i = 0; i < datos.length; i++) {

    const tr = document.createElement("tr");
    const item = datos[i];


    // CHECKBOX
    if (seleccionar) {

      const td = document.createElement("td");

      const check = document.createElement("input");
      check.type = "checkbox";
      check.dataset.codigo = item.codigo;

      if (seleccionados.has(item.codigo)) {
        check.checked = true;
      }

      check.addEventListener("change", () => {

        if (onToggle) {
          onToggle(item, check.checked);
        }

      });

      td.appendChild(check);
      tr.appendChild(td);
    }


    // COLUMNAS
    for (let j = 0; j < columnas.length; j++) {

      const td = document.createElement("td");
      const columna = columnas[j];

      if (columna.render) {
        td.textContent = columna.render(item);
      } else {
        td.textContent = item[columna.clave] || "";
      }

      if (columna.onClick) {

        td.classList.add("celda-clickable");

        td.addEventListener("click", (e) => {

          e.stopPropagation();

          columna.onClick(item);

        });
      }

      tr.appendChild(td);
    }


    // SELECCIÓN DE FILA
    if (seleccionar) {

      tr.classList.add("fila-seleccionable");

      if (seleccionados.has(item.codigo)) {
        tr.classList.add("fila-seleccionada");
      }

      tr.addEventListener("click", () => {

        const marcada =
          tr.classList.toggle("fila-seleccionada");

        if (onToggle) {
          onToggle(item, marcada);
        }

      });
    }


    // ACCIONES
    if (acciones) {

      const td = document.createElement("td");

      td.appendChild(
        acciones(item)
      );

      tr.appendChild(td);
    }


    tbody.appendChild(tr);
  }


  tabla.appendChild(thead);
  tabla.appendChild(tbody);

  return tabla;
}

// -----------------------------------------------------------------------

export function filtrarTabla(insumos, texto) {
  const termino = texto.toLowerCase();
  const filtrados = [];

  for (let i = 0; i < insumos.length; i++) {
    const insumo = insumos[i];

    let nombre = "";
    let categoria = "";
    let estado = "";

    if (insumo.nombre) {
      nombre = insumo.nombre.toLowerCase();
    }
    if (insumo.categoria) {
      categoria = insumo.categoria.toLowerCase();
    }
    if (insumo.estado) {
      estado = insumo.estado.toLowerCase();
    }

    if (
      nombre.includes(termino) ||
      categoria.includes(termino) ||
      estado.includes(termino)
    ) {
      filtrados.push(insumo);
    }
  }

  return filtrados;
}

// =========================================================
// MARCAR LA PESTAÑA ACTIVA DEL NAVBAR
// =========================================================

const paginaActual = window.location.pathname.split("/").pop();

const enlacesNavbar = {
  "home.html": "linkInicio",
  "prestamos.html": "linkPrestamos",
  "insumos.html": "linkInsumos",
  "usuarios.html": "linkUsuarios"
};

const idEnlace = enlacesNavbar[paginaActual];

if (idEnlace) {
  const enlaceActivo = document.getElementById(idEnlace);

  if (enlaceActivo) {
    enlaceActivo.classList.add("active");
  }
}

// -- Prueba para ver si funciona la función de crear grid de insumos

export function crearGridInsumos(datos, opciones) {
  const seleccionar = opciones && opciones.seleccionar;
  const seleccionados = (opciones && opciones.seleccionados) || new Set();
  const onToggle = opciones && opciones.onToggle;

  const grid = document.createElement("div");
  grid.className = "row g-3";

  for (let i = 0; i < datos.length; i++) {
    const item = datos[i];

    const col = document.createElement("div");
    col.className = "col-6 col-md-4 col-lg-3";

    const card = document.createElement("div");
    card.className = "insumo-card";
    card.innerHTML = `
      <i class="bi bi-box-seam insumo-card-icono"></i>
      <span class="insumo-card-nombre">${item.nombre_completo}</span>
    `;

    if (seleccionar) {
      card.classList.add("insumo-card-seleccionable");

      if (seleccionados.has(item.codigo)) {
        card.classList.add("insumo-card-seleccionada");
      }

      card.addEventListener("click", () => {
        const marcada = card.classList.toggle("insumo-card-seleccionada");
        if (onToggle) {
          onToggle(item, marcada);
        }
      });
    }

    col.appendChild(card);
    grid.appendChild(col);
  }

  return grid;
}

//Fecha actual para el input de fecha en prestamos.html

export function obtenerFechaActual() {
  const hoy = new Date();

  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}