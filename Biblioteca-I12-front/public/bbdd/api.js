// api.js
// Reemplazo de bd.js: habla con el backend real (FastAPI) en vez de localStorage.
// Va en public/bbdd/api.js, al lado de bd.js.

const BASE_URL = "http://localhost:8000"; // cambiar si el back corre en otro puerto/host

// ---------------------------------------------------------
// IDs fijos de EstadoInsumo 

export const ESTADOS_INSUMO = {
  "Disponible": 1,
  "No Disponible": 2,
};

// Mapa inverso, para mostrar el nombre del estado a partir del id
const ESTADOS_INSUMO_POR_ID = Object.fromEntries(
  Object.entries(ESTADOS_INSUMO).map(([nombre, id]) => [id, nombre])
);

// ---------------------------------------------------------
// MANEJO DEL TOKEN (JWT)
// ---------------------------------------------------------

const CLAVE_TOKEN = "token";

export function guardarToken(token) {
  localStorage.setItem(CLAVE_TOKEN, token);
}

export function obtenerToken() {
  return localStorage.getItem(CLAVE_TOKEN);
}

export function borrarToken() {
  localStorage.removeItem(CLAVE_TOKEN);
}

export function estaLogueado() {
  return !!obtenerToken();
}

function headersAuth() {
  return {
    "Authorization": `Bearer ${obtenerToken()}`,
    "Content-Type": "application/json",
  };
}

// Helper interno: hace fetch, tira error legible si algo sale mal
async function pedido(url, opciones) {
  const res = await fetch(url, opciones);

  if (res.status === 401) {
    throw new Error("No autorizado: el token no es válido o expiró");
  }
  if (!res.ok) {
    let detalle = "";
    try {
      const data = await res.json();
      detalle = data.detail || JSON.stringify(data);
    } catch {
      detalle = res.statusText;
    }
    throw new Error(detalle || "Error en el pedido al backend");
  }

  // DELETE en /insumos/ y algunas respuestas pueden no traer body
  const texto = await res.text();
  return texto ? JSON.parse(texto) : null;
}

// ---------------------------------------------------------
// AUTENTICACIÓN
// ---------------------------------------------------------

// El backend usa "username" como identificador de login, pero en la práctica
// username == dni (así está pensado en el propio backend). Por eso el form
// de login sigue pidiendo "DNI" y acá simplemente se lo manda como username.
export async function login(dni, password) {
  const body = new URLSearchParams();
  body.append("username", dni);
  body.append("password", password);

  const res = await fetch(`${BASE_URL}/users/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    throw new Error("Usuario o contraseña incorrectos");
  }

  const data = await res.json();
  guardarToken(data.access_token);
  return data;
}

export function logout() {
  borrarToken();
}

// ---------------------------------------------------------
// USUARIOS
// ---------------------------------------------------------
// sobre "cargo"/roles:
// La tabla Rol del backend está vacía y /users/register ni siquiera acepta
// id_rol todavía. Por eso estas funciones NO mandan ni gestionan "cargo".
// Es un feature pendiente de terminar en el backend antes de poder integrarlo.

// Trae todos los usuarios (requiere estar logueado)
export async function obtenerUsuarios() {
  return pedido(`${BASE_URL}/users/`, {
    method: "GET",
    headers: headersAuth(),
  });
}

// Crea un usuario nuevo.
// datos = { dni, nombre, apellido, email }
// La contraseña inicial es el propio DNI (igual que hacía altaUser.js con localStorage).
export async function crearUsuario({ dni, nombre, apellido, email }) {
  const body = {
    username: dni,
    email,
    nombre,
    apellido,
    password: dni,
  };

  return pedido(`${BASE_URL}/users/register`, {
    method: "POST",
    headers: headersAuth(),
    body: JSON.stringify(body),
  });
}

// Actualiza datos de un usuario existente.
// datos puede incluir: { nombre, apellido, email }

// desde acá, ni cambiar el username/dni. 

export async function actualizarUsuario(dni, datos) {
  return pedido(`${BASE_URL}/users/${dni}`, {
    method: "PUT",
    headers: headersAuth(),
    body: JSON.stringify(datos),
  });
}

// Elimina (hard delete) un usuario. El backend no tiene "active/disabled"
// gestionable desde acá todavía, así que esto borra el registro de verdad,
// no lo desactiva.
export async function eliminarUsuario(dni) {
  return pedido(`${BASE_URL}/users/${dni}`, {
    method: "DELETE",
    headers: headersAuth(),
  });
}

// ---------------------------------------------------------
// INSUMOS
// ---------------------------------------------------------

// Convierte un insumo tal como lo devuelve el backend (con id_estado numérico)
// a la forma que espera el front (con "estado" como texto), para no tener
// que tocar funciones.js / la tabla.
function adaptarInsumo(insumo) {
  return {
    id: insumo.id,
    codigo: insumo.codigo,
    nombre: insumo.nombre,
    observacion: insumo.ubicacion, // el front usa "observacion", el back usa "ubicacion"
    estado: ESTADOS_INSUMO_POR_ID[insumo.id_estado] || "Desconocido",
  };
}

export async function obtenerInsumos() {
  const insumos = await pedido(`${BASE_URL}/insumos/`, {
    method: "GET",
    headers: headersAuth(),
  });
  return insumos.map(adaptarInsumo);
}

// El campo "codigo" del insumo es único y de máximo 10 caracteres, pero el
// form de alta no le pide un código al usuario (antes bd.js lo autogeneraba).
// Se genera acá mismo, tipo "INS-0001", buscando el correlativo más alto.
async function generarCodigoInsumo() {
  const insumos = await pedido(`${BASE_URL}/insumos/`, {
    method: "GET",
    headers: headersAuth(),
  });

  let maxNumero = 0;
  for (const ins of insumos) {
    const match = /^INS-(\d+)$/.exec(ins.codigo);
    if (match) {
      const numero = parseInt(match[1], 10);
      if (numero > maxNumero) maxNumero = numero;
    }
  }

  return `INS-${String(maxNumero + 1).padStart(4, "0")}`; // ej: INS-0001 (8 caracteres)
}

// Crea un insumo nuevo. Se da de alta siempre como "Disponible",
// igual que hacía insumos.js con localStorage.
// datos = { nombre, observacion }
export async function guardarInsumo({ nombre, observacion }) {
  const codigo = await generarCodigoInsumo();
  const body = {
    codigo,
    nombre,
    ubicacion: observacion || "",
    id_estado: ESTADOS_INSUMO["Disponible"],
  };

  const creado = await pedido(`${BASE_URL}/insumos/`, {
    method: "POST",
    headers: headersAuth(),
    body: JSON.stringify(body),
  });
  return creado;
}

// Actualiza un insumo existente.
// datos = { nombre, estado, observacion } (estado como texto: "Disponible" / "No Disponible")
export async function actualizarInsumo(id, { nombre, estado, observacion }) {
  const body = {};
  if (nombre !== undefined) body.nombre = nombre;
  if (observacion !== undefined) body.ubicacion = observacion;
  if (estado !== undefined) body.id_estado = ESTADOS_INSUMO[estado];

  return pedido(`${BASE_URL}/insumos/${id}`, {
    method: "PUT",
    headers: headersAuth(),
    body: JSON.stringify(body),
  });
}

export async function eliminarInsumo(id) {
  return pedido(`${BASE_URL}/insumos/${id}`, {
    method: "DELETE",
    headers: headersAuth(),
  });
}

// ---------------------------------------------------------
// PRÉSTAMOS
// ---------------------------------------------------------
export async function guardarPrestamo({ id_insumo, id_destinatario, fecha_entrega, obs }) {
  const body = {
    id_insumo,
    id_destinatario,
    fecha_entrega,
    obs: obs || "",
  };

  return pedido(`${BASE_URL}/prestamos/`, {
    method: "POST",
    headers: headersAuth(),
    body: JSON.stringify(body),
  });
}

export async function adaptarPrestamo(prestamo) {
  // Trae el insumo para obtener su código y nombre
  const insumo = await pedido(`${BASE_URL}/insumos/${prestamo.id_insumo}`, {
    method: "GET",
    headers: headersAuth(),
  });

  return {
    ...prestamo,
    insumo: insumo.nombre,
    codigo_insumo: insumo.codigo
  };
}

export async function obtenerPrestamosPorEstado() {
  const prestamos = await pedido(`${BASE_URL}/prestamos/`, {
    method: "GET",
    headers: headersAuth(),
  });
  return prestamo
}

export async function actualizarEstadoPrestamo(id, nuevoEstado) {
  const body = { estado: nuevoEstado };
  return pedido(`${BASE_URL}/prestamos/${id}`, {
    method: "PUT",
    headers: headersAuth(),
    body: JSON.stringify(body),
  });
}

export async function marcarComoDevuelto(id) {
  //liberar el insumo asociado al préstamo
  await pedido(`${BASE_URL}/prestamos/${id}/devolver`, {
    method: "POST",
    headers: headersAuth(),
  });
  
  return actualizarEstadoPrestamo(id, "devuelto");
}


