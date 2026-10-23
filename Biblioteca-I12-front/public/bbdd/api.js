// api.js
// Reemplazo de bd.js: habla con el backend real (FastAPI) en vez de localStorage.
// Va en public/bbdd/api.js, al lado de bd.js.

//const BASE_URL = "http://127.0.0.1:8000"; // cambiar si el back corre en otro puerto/host
const BASE_URL = "https://back-biblio-lfhc.onrender.com";

// ---------------------------------------------------------
// IDs fijos de EstadoInsumo 

export const ESTADOS_INSUMO = {
  "Disponible": 1,
  "No Disponible": 2,
  "Prestado": 3,
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
      if (Array.isArray(data.detail)) {
        // Errores de validación de FastAPI (422)
        detalle = data.detail
          .map(e => `${e.loc?.join(".")}: ${e.msg}`)
          .join(" | ");
      } else {
        detalle = data.detail || JSON.stringify(data);
      }
    } catch {
      detalle = res.statusText;
    }
    throw new Error(detalle || "Error en el pedido al backend");
  }

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
    numero_inventario: insumo.numero_inventario,
    numeracion: insumo.numeracion,
    nombre: insumo.nombre,

    activo: insumo.activo === true,

    nombre_completo:
      `${insumo.nombre} ${insumo.numeracion || ""}`.trim(),

    observacion: insumo.ubicacion || "",

    estado: ESTADOS_INSUMO_POR_ID[insumo.id_estado]
      || "Desconocido",
  };
}

export async function obtenerInsumos() {
  const insumos = await pedido(`${BASE_URL}/insumos/`, {
    method: "GET",
    headers: headersAuth(),
  });
  return insumos.map(adaptarInsumo);
}


export async function obtenerSiguienteNumeracion(nombre) {
  return pedido(
    `${BASE_URL}/insumos/siguiente-numeracion/?nombre=${encodeURIComponent(nombre)}`,
    {
      method: "GET",
      headers: headersAuth()
    }
  );
}


// El campo "codigo" (tipo "INS-0001") ya NO se genera acá: el backend lo
// arma automáticamente para cada unidad creada, con la misma lógica de
// siempre (correlativo INS-XXXX), solo que ahora resuelta del lado del
// servidor porque se pueden crear varias unidades en un mismo alta.
export async function guardarInsumo({
  numero_inventario,
  cantidad,
  numeracion,
  nombre,
  observacion
}) {
  const body = {
    numero_inventario,
    cantidad,
    numeracion,
    nombre,
    observacion: observacion || "",
  };

  const creado = await pedido(`${BASE_URL}/insumos/`, {
    method: "POST",
    headers: headersAuth(),
    body: JSON.stringify(body),
  });

  return creado;
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
export async function modificarPrestamo(id, datos) {

  return pedido(`${BASE_URL}/prestamos/${id}`, {
    method: "PUT",
    headers: headersAuth(),
    body: JSON.stringify(datos)
  });

}

export async function guardarPrestamo({
  id_insumo,
  id_destinatario,
  tipo_destinatario,
  carrera,
  anio,
  curso,
  a_cargo,
  fecha_entrega,
  obs
}) {
  const body = {
    id_insumo: Number(id_insumo),
    id_destinatario: String(id_destinatario),
    tipo_destinatario: tipo_destinatario,
    carrera: carrera || null,
    anio: anio ? Number(anio) : null,
    curso: curso || null,
    a_cargo: a_cargo || null,
    fecha_entrega: fecha_entrega,
    obs: obs || ""
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
  return prestamos;
}

export async function actualizarEstadoPrestamo(id, nuevoEstado) {
  return pedido(`${BASE_URL}/prestamos/${id}/estado?estado=${nuevoEstado}`, {
    method: "PUT",
    headers: headersAuth(),
  });
}

export async function marcarComoDevuelto(id) {
  return pedido(`${BASE_URL}/prestamos/${id}/devolver`, {
    method: "POST",
    headers: headersAuth(),
  });
}

export async function obtenerPrestamos() {
  const prestamos = await pedido(`${BASE_URL}/prestamos/`, {
    method: "GET",
    headers: headersAuth(),
  });
  return prestamos;
}

export async function actualizarInsumosPrestados(insumosPrestados) {
  for (const insumo of insumosPrestados) {
    await pedido(`${BASE_URL}/insumos/${insumo.id}/prestar`, {
      method: "POST",
      headers: headersAuth(),
    });
  }
}

export async function actualizarInsumo(id, datos) {
  const body = {};

  if (datos.nombre !== undefined) {
    body.nombre = datos.nombre;
  }

  if (datos.estado !== undefined) {
    body.id_estado = ESTADOS_INSUMO[datos.estado];
  }

  if (datos.observacion !== undefined) {
    body.ubicacion = datos.observacion;
  }

  return pedido(`${BASE_URL}/insumos/${id}`, {
    method: "PUT",
    headers: headersAuth(),
    body: JSON.stringify(body),
  });
}

