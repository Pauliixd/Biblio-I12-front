// usuarios.js - Maneja el listado y acciones de la tabla de usuarios

import {
  obtenerUsuarios,
  eliminarUsuario,
  actualizarUsuario
} from "../bbdd/api.js";

import {
  alertaError,
  alertaExito
} from "./alerts.js";

import {
  crearTablaGeneral
} from "./funciones.js";


// ======================================================
// ELEMENTOS HTML
// ======================================================

let usuariosTableBody =
  document.getElementById("usuariosTableBody");

const botonConfirmarEdicion =
  document.getElementById("submitEditarUsuario");

const editCodigo =
  document.getElementById("editCodigo");

const editNombreYApellido =
  document.getElementById("editNombreYApellido");

const editEmail =
  document.getElementById("editEmail");

const editCargo =
  document.getElementById("editCargo");

const editPasswordSystem =
  document.getElementById("editPasswordSystem");

const modalEditar =
  new bootstrap.Modal(
    document.getElementById("modalEditarUsuario")
  );


// ======================================================
// ROLES
// ======================================================

function obtenerNombreRol(idRol) {

  switch (idRol) {

    case 1:
      return "Administrador";

    case 2:
      return "Bibliotecario";

    case 3:
      return "Secretario";

    default:
      return "Sin rol";
  }
}


// ======================================================
// COLUMNAS DE LA TABLA
// ======================================================

const columnasUsuarios = [

  {
    clave: "nombreYApellido",
    texto: "Nombre y Apellido"
  },

  {
    clave: "dni",
    texto: "DNI"
  },

  {
    clave: "email",
    texto: "Email"
  },

  {
    clave: "cargo",
    texto: "Cargo"
  }

];


// ======================================================
// ADAPTAR USUARIO DEL BACKEND
// ======================================================

function adaptarUsuario(usuario) {

  return {

    dni: usuario.username,

    nombreYApellido:
      `${usuario.nombre} ${usuario.apellido}`,

    email:
      usuario.email,

    cargo:
      obtenerNombreRol(usuario.id_rol),

    id_rol:
      usuario.id_rol,

    _original:
      usuario

  };

}


// ======================================================
// COMPROBAR SI ES ADMINISTRADOR
// ======================================================

function esAdmin(usuario) {

  return usuario.id_rol === 1;

}


// ======================================================
// CREAR BOTONES DE ACCIONES
// ======================================================

function crearBotoneraAcciones(usuario) {

  const div =
    document.createElement("div");

  div.className =
    "btn-group btn-group-sm";


  // -------------------------
  // BOTÓN EDITAR
  // -------------------------

  const btnEditar =
    document.createElement("button");

  btnEditar.className =
    "btn btn-outline-primary";

  btnEditar.innerHTML =
    '<i class="bi bi-pencil-square"></i>';

  btnEditar.title =
    "Editar Usuario";

  btnEditar.addEventListener(
    "click",
    () => abrirModalEditarUsuario(usuario)
  );


  // -------------------------
  // BOTÓN ELIMINAR
  // -------------------------

  const btnEliminar =
    document.createElement("button");

  btnEliminar.className =
    "btn btn-outline-danger";

  btnEliminar.innerHTML =
    '<i class="bi bi-trash"></i>';

  btnEliminar.title =
    "Eliminar Usuario";


  btnEliminar.addEventListener(
    "click",
    () => {

      if (esAdmin(usuario)) {

        alertaError(
          "No se puede eliminar un Administrador"
        );

        return;
      }


      Swal.fire({

        title: "¿Estás seguro?",

        text:
          `¿Seguro que querés eliminar a ${String(
            usuario.nombreYApellido
          ).toUpperCase()}?`,

        icon: "warning",

        showCancelButton: true,

        confirmButtonText:
          "Sí, eliminar",

        cancelButtonText:
          "Cancelar"

      }).then(async (result) => {

        if (!result.isConfirmed) {
          return;
        }


        try {

          await eliminarUsuario(
            usuario.dni
          );

          await renderizarTablaUsuarios();

          alertaExito(
            "Se eliminó correctamente"
          );

        } catch (err) {

          alertaError(
            err.message ||
            "No se pudo eliminar el usuario"
          );

        }

      });

    }
  );


  div.appendChild(btnEditar);

  div.appendChild(btnEliminar);

  return div;

}


// ======================================================
// ABRIR MODAL EDITAR
// ======================================================

function abrirModalEditarUsuario(usuario) {

  // No permitir modificar administradores
  if (esAdmin(usuario)) {

    alertaError(
      "No se puede modificar un usuario Administrador"
    );

    return;
  }


  // Código / DNI
  editCodigo.value =
    usuario.dni;


  // Nombre y apellido
  editNombreYApellido.value =
    usuario.nombreYApellido;


  // Email
  editEmail.value =
    usuario.email;


  // Rol
  editCargo.value =
    usuario.id_rol ?? "";


  // Limpiar contraseña
  editPasswordSystem.value =
    "";


  // Mostrar modal
  modalEditar.show();

}


// ======================================================
// GUARDAR EDICIÓN
// ======================================================

botonConfirmarEdicion.addEventListener(
  "click",
  async (e) => {

    e.preventDefault();


    // ------------------------------------------
    // Separar nombre y apellido
    // ------------------------------------------

    const partes =
      editNombreYApellido.value
        .trim()
        .split(/\s+/);


    const nombre =
      partes[0] || "";


    const apellido =
      partes.slice(1).join(" ") ||
      nombre;


    // ------------------------------------------
    // Validaciones
    // ------------------------------------------

    if (!nombre) {

      alertaError(
        "El nombre es obligatorio"
      );

      return;
    }


    if (!editEmail.value.trim()) {

      alertaError(
        "El email es obligatorio"
      );

      return;
    }


    if (!editCargo.value) {

      alertaError(
        "Seleccioná un cargo"
      );

      return;
    }


    // ------------------------------------------
    // Datos a enviar
    // ------------------------------------------

    const datos = {

      nombre:
        nombre,

      apellido:
        apellido,

      email:
        editEmail.value.trim(),

      id_rol:
        Number(editCargo.value)

    };


    // ------------------------------------------
    // Contraseña
    // ------------------------------------------

    // Solo enviamos new_password si
    // el usuario escribió una contraseña nueva.

    if (
      editPasswordSystem.value.trim() !== ""
    ) {

      datos.new_password =
        editPasswordSystem.value.trim();

    }


    // ------------------------------------------
    // Enviar al backend
    // ------------------------------------------

    try {

      await actualizarUsuario(
        editCodigo.value,
        datos
      );


      // Actualizar tabla
      await renderizarTablaUsuarios();


      // Cerrar modal
      modalEditar.hide();


      // Limpiar contraseña
      editPasswordSystem.value =
        "";


      alertaExito(
        "Actualización exitosa",
        `Se actualizó el usuario "${nombre} ${apellido}".`
      );


    } catch (err) {

      console.error(
        "Error al modificar usuario:",
        err
      );


      alertaError(
        err.message ||
        "No se pudo modificar el usuario"
      );

    }

  }
);


// ======================================================
// RENDERIZAR TABLA
// ======================================================

export async function renderizarTablaUsuarios() {

  let usuarios;


  try {

    const respuesta =
      await obtenerUsuarios();


    usuarios =
      respuesta.map(
        adaptarUsuario
      );


  } catch (err) {

    console.error(
      "Error obteniendo usuarios:",
      err
    );


    alertaError(
      err.message ||
      "No se pudieron cargar los usuarios"
    );


    usuarios = [];

  }


  // ------------------------------------------
  // Hay usuarios
  // ------------------------------------------

  if (usuarios.length > 0) {

    const tablaCompleta =
      crearTablaGeneral(
        usuarios,
        columnasUsuarios,
        {
          acciones:
            crearBotoneraAcciones
        }
      );


    const newTbody =
      tablaCompleta.querySelector(
        "tbody"
      );


    newTbody.id =
      "usuariosTableBody";


    usuariosTableBody.replaceWith(
      newTbody
    );


    usuariosTableBody =
      newTbody;

  }


  // ------------------------------------------
  // No hay usuarios
  // ------------------------------------------

  else {

    const newTbody =
      document.createElement(
        "tbody"
      );


    newTbody.id =
      "usuariosTableBody";


    newTbody.innerHTML = `

      <tr>

        <td
          colspan="${columnasUsuarios.length + 1}"
          class="text-center text-muted"
        >

          No hay usuarios registrados.

        </td>

      </tr>

    `;


    usuariosTableBody.replaceWith(
      newTbody
    );


    usuariosTableBody =
      newTbody;

  }

}


// ======================================================
// INICIALIZAR
// ======================================================

renderizarTablaUsuarios();


// Escuchar cuando se crea un usuario
window.addEventListener(
  "usuarioGuardado",
  renderizarTablaUsuarios
);
