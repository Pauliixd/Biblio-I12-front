/* usuarios.js - Maneja el listado y acciones de la tabla de usuarios

import { obtenerUsuarios, eliminarUsuario, actualizarUsuario } from "../bbdd/bd.js";
import { alertaError, alertaExito } from "./alerts.js";

import { crearTablaGeneral } from "./funciones.js";

// ELEMENTOS HTML
let usuariosTableBody = document.getElementById("usuariosTableBody");

const botonConfirmarEdicion = document.getElementById("submitEditarUsuario")
const editCodigo = document.getElementById('editCodigo');
const editNombreYApellido = document.getElementById('editNombreYApellido');
const editCargo = document.getElementById('editCargo');
const editEmail = document.getElementById('editEmail');
const editPasswordSystem = document.getElementById('editPasswordSystem');
const modalEditar = new bootstrap.Modal(document.getElementById('modalEditarUsuario'));


const columnasUsuarios = [
    { clave: "nombreYApellido", texto: "Nombre y Apellido" },
    { clave: "dni", texto: "DNI" },
    { clave: "email", texto: "Email" },
    { clave: "cargo", texto: "Cargo" },
];

// FUNCIONES
function crearBotoneraAcciones(usuario) {
    const div = document.createElement('div');
    div.className = 'btn-group btn-group-sm';

    // Botón Editar
    const btnEditar = document.createElement('button');
    btnEditar.className = 'btn btn-outline-primary';
    btnEditar.innerHTML = '<i class="bi bi-pencil-square"></i>';
    btnEditar.title = 'Editar Usuario';
    btnEditar.addEventListener('click', () => abrirModalEditarUsuario(usuario));

    // Botón Eliminar
    const btnEliminar = document.createElement('button');
    btnEliminar.className = 'btn btn-outline-danger';
    btnEliminar.innerHTML = '<i class="bi bi-trash"></i>';
    btnEliminar.title = 'Eliminar Usuario';

    btnEliminar.addEventListener('click', () => {
    if (String(usuario.cargo).toUpperCase() !== "ADMIN") {

        Swal.fire({
            title: '¿Estás seguro?',
            text: `¿Seguro que querés eliminar a ${String(usuario.nombreYApellido).toUpperCase()}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                eliminarUsuario(Number(usuario.codigo));
                renderizarTablaUsuarios();
                alertaExito("Se eliminó correctamente");
            }
        });

    } else {
        alertaError("No se puede eliminar admin");
    }
});

    div.appendChild(btnEditar);
    div.appendChild(btnEliminar);
    return div;
}



function abrirModalEditarUsuario(usuario) {
    editCodigo.value = usuario.codigo;
    editNombreYApellido.value = usuario.nombreYApellido;
    editCargo.value = usuario.cargo;
    editEmail.value = usuario.email;
    editPasswordSystem.value = usuario.passwordSystem;


    if (String(usuario.cargo).toUpperCase() !== "ADMIN") {

        modalEditar.show();

        let usuarioActualizado = {}

        botonConfirmarEdicion.addEventListener("click", (e) => {
            e.preventDefault();

            usuarioActualizado = {
                codigo: editCodigo.value,
                nombreYApellido: editNombreYApellido.value,
                cargo: editCargo.value,
                email: editEmail.value,
                passwordSystem: editPasswordSystem.value
            }


            if (actualizarUsuario(usuarioActualizado)) {
                renderizarTablaUsuarios()
                modalEditar.hide();
                alertaExito('Alta exitosa', `Se actualizo el usuario :" ${String(usuarioActualizado.nombreYApellido).toUpperCase()}" correctamente.`)
            } else alertaError("No se pudo modificar")
        })
    }
    else alertaError("No se puede modificar un usuario admin")
}



export function renderizarTablaUsuarios() {
    const usuarios = obtenerUsuarios();

    if (usuarios.length > 0) {

        const tablaCompleta = crearTablaGeneral(usuarios, columnasUsuarios, {
            acciones: crearBotoneraAcciones
        });

        const newTbody = tablaCompleta.querySelector("tbody");
        newTbody.id = "usuariosTableBody";

        usuariosTableBody.replaceWith(newTbody);

        usuariosTableBody = newTbody;

    } else {
        // Si no hay usuarios, deja un mensaje en la tabla diciendo que no hay
        const newTbody = document.createElement("tbody");
        newTbody.id = "usuariosTableBody";
        newTbody.innerHTML = `
            <tr>
                <td colspan="${columnasUsuarios.length + 1}" 
                    class="text-center text-muted">
                    No hay usuarios registrados.
                </td>
            </tr>
        `;

        usuariosTableBody.replaceWith(newTbody);
        usuariosTableBody = newTbody;
    }
}



// EVENTOS
renderizarTablaUsuarios();

// Escuchar el evento de altaUser.js para refrescar la tabla
window.addEventListener('usuarioGuardado', renderizarTablaUsuarios);
*/

// usuarios.js - Maneja el listado y acciones de la tabla de usuarios
import { obtenerUsuarios, eliminarUsuario, actualizarUsuario } from "../bbdd/api.js";
import { alertaError, alertaExito } from "./alerts.js";
import { crearTablaGeneral } from "./funciones.js";

// ELEMENTOS HTML
let usuariosTableBody = document.getElementById("usuariosTableBody");

const botonConfirmarEdicion = document.getElementById("submitEditarUsuario");
const editCodigo = document.getElementById('editCodigo'); // ahora guarda el username (=dni)
const editNombreYApellido = document.getElementById('editNombreYApellido');
const editEmail = document.getElementById('editEmail');
// NOTA: editCargo y editPasswordSystem se dejan en el HTML pero no se usan:
// el backend no soporta todavía asignar rol ni resetear contraseña de otro
// usuario desde este endpoint.
const modalEditar = new bootstrap.Modal(document.getElementById('modalEditarUsuario'));

// Se saca la columna "cargo": el backend no tiene roles cargados todavía.
const columnasUsuarios = [
  { clave: "nombreYApellido", texto: "Nombre y Apellido" },
  { clave: "dni", texto: "DNI" },
  { clave: "email", texto: "Email" },
];

// Adapta un usuario del backend (nombre/apellido separados, username)
// a la forma que espera la tabla del front.
function adaptarUsuario(usuario) {
  return {
    dni: usuario.username,
    nombreYApellido: `${usuario.nombre} ${usuario.apellido}`,
    email: usuario.email,
    _original: usuario,
  };
}

// FUNCIONES

function esAdmin(usuario) {
  // Heurística temporal mientras no haya roles reales: se protege al
  // usuario "admin" para que no se pueda borrar/editar por error.
  return usuario.dni === "admin";
}

function crearBotoneraAcciones(usuario) {
  const div = document.createElement('div');
  div.className = 'btn-group btn-group-sm';

  const btnEditar = document.createElement('button');
  btnEditar.className = 'btn btn-outline-primary';
  btnEditar.innerHTML = '<i class="bi bi-pencil-square"></i>';
  btnEditar.title = 'Editar Usuario';
  btnEditar.addEventListener('click', () => abrirModalEditarUsuario(usuario));

  const btnEliminar = document.createElement('button');
  btnEliminar.className = 'btn btn-outline-danger';
  btnEliminar.innerHTML = '<i class="bi bi-trash"></i>';
  btnEliminar.title = 'Eliminar Usuario';

  btnEliminar.addEventListener('click', () => {
    if (!esAdmin(usuario)) {
      Swal.fire({
        title: '¿Estás seguro?',
        text: `¿Seguro que querés eliminar a ${String(usuario.nombreYApellido).toUpperCase()}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            await eliminarUsuario(usuario.dni);
            await renderizarTablaUsuarios();
            alertaExito("Se eliminó correctamente");
          } catch (err) {
            alertaError(err.message || "No se pudo eliminar el usuario");
          }
        }
      });
    } else {
      alertaError("No se puede eliminar admin");
    }
  });

  div.appendChild(btnEditar);
  div.appendChild(btnEliminar);
  return div;
}

function abrirModalEditarUsuario(usuario) {
  editCodigo.value = usuario.dni;
  editNombreYApellido.value = usuario.nombreYApellido;
  editEmail.value = usuario.email;

  if (esAdmin(usuario)) {
    alertaError("No se puede modificar un usuario admin");
    return;
  }

  modalEditar.show();

  // {once:true} para no ir acumulando listeners cada vez que se abre el modal
  botonConfirmarEdicion.addEventListener("click", async (e) => {
    e.preventDefault();

    const partes = editNombreYApellido.value.trim().split(/\s+/);
    const nombre = partes[0] || "";
    const apellido = partes.slice(1).join(" ") || nombre;

    try {
      await actualizarUsuario(usuario.dni, {
        nombre,
        apellido,
        email: editEmail.value,
      });
      await renderizarTablaUsuarios();
      modalEditar.hide();
      alertaExito('Actualización exitosa', `Se actualizó el usuario "${editNombreYApellido.value.toUpperCase()}" correctamente.`);
    } catch (err) {
      alertaError(err.message || "No se pudo modificar");
    }
  }, { once: true });
}

export async function renderizarTablaUsuarios() {
  let usuarios;
  try {
    usuarios = (await obtenerUsuarios()).map(adaptarUsuario);
  } catch (err) {
    alertaError(err.message || "No se pudieron cargar los usuarios");
    usuarios = [];
  }

  if (usuarios.length > 0) {
    const tablaCompleta = crearTablaGeneral(usuarios, columnasUsuarios, {
      acciones: crearBotoneraAcciones
    });

    const newTbody = tablaCompleta.querySelector("tbody");
    newTbody.id = "usuariosTableBody";

    usuariosTableBody.replaceWith(newTbody);
    usuariosTableBody = newTbody;
  } else {
    const newTbody = document.createElement("tbody");
    newTbody.id = "usuariosTableBody";
    newTbody.innerHTML = `
            <tr>
                <td colspan="${columnasUsuarios.length + 1}" 
                    class="text-center text-muted">
                    No hay usuarios registrados.
                </td>
            </tr>
        `;
    usuariosTableBody.replaceWith(newTbody);
    usuariosTableBody = newTbody;
  }
}

// EVENTOS
renderizarTablaUsuarios();

// Escuchar el evento de altaUser.js para refrescar la tabla
window.addEventListener('usuarioGuardado', renderizarTablaUsuarios);