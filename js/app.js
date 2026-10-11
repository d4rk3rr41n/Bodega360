/* =========================================================================
   BODEGA360 - Lógica de interacción del front-end
   Evidencia: GA6-220501096-AA4-EV03 - Diseño front-end (SENA)
   ========================================================================= */

"use strict";

/* -------------------------------------------------------------------------
   1. UTILIDADES
   ------------------------------------------------------------------------- */

/**
 * Muestra una notificación flotante (toast) en la esquina inferior.
 * @param {string} mensaje - Texto a mostrar.
 * @param {"exito"|"error"|"alerta"|"info"} tipo - Variante visual.
 * @param {number} duracion - Tiempo visible en milisegundos.
 */
function mostrarToast(mensaje, tipo = "info", duracion = 3500) {
    // Crea el contenedor de toasts si aún no existe en la página
    let contenedor = document.querySelector(".toast-contenedor");
    if (!contenedor) {
        contenedor = document.createElement("div");
        contenedor.className = "toast-contenedor";
        contenedor.setAttribute("aria-live", "polite");
        document.body.appendChild(contenedor);
    }

    // Icono según el tipo de mensaje
    const iconos = {
        exito: "ph-check-circle",
        error: "ph-x-circle",
        alerta: "ph-warning",
        info: "ph-info"
    };

    const toast = document.createElement("div");
    toast.className = `toast toast--${tipo}`;
    toast.setAttribute("role", "status");
    toast.innerHTML = `<i class="ph-fill ${iconos[tipo] || iconos.info}"></i><span></span>`;
    // Se usa textContent para evitar inyección de HTML
    toast.querySelector("span").textContent = mensaje;
    contenedor.appendChild(toast);

    // Retira el toast con animación de salida
    setTimeout(() => {
        toast.classList.add("toast--saliendo");
        toast.addEventListener("animationend", () => toast.remove());
    }, duracion);
}

/**
 * Marca un campo como inválido y muestra el mensaje de error.
 * @param {HTMLElement} input - Control del formulario.
 * @param {string} mensaje - Mensaje de error.
 */
function mostrarError(input, mensaje) {
    const campo = input.closest(".campo");
    if (!campo) return;
    campo.classList.add("campo--error");
    input.setAttribute("aria-invalid", "true");
    const error = campo.querySelector(".campo__error");
    if (error) {
        error.innerHTML = `<i class="ph ph-warning-circle"></i> `;
        error.append(mensaje);
    }
}

/**
 * Limpia el estado de error de un campo.
 * @param {HTMLElement} input - Control del formulario.
 */
function limpiarError(input) {
    const campo = input.closest(".campo");
    if (!campo) return;
    campo.classList.remove("campo--error");
    input.removeAttribute("aria-invalid");
    const error = campo.querySelector(".campo__error");
    if (error) error.textContent = "";
}

/**
 * Valida el formato de un correo electrónico.
 * @param {string} correo
 * @returns {boolean}
 */
function esCorreoValido(correo) {
    const patron = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return patron.test(correo);
}

/**
 * Obtiene el nombre del archivo HTML actual (ej. "dashboard.html").
 * @returns {string}
 */
function obtenerPaginaActual() {
    const ruta = window.location.pathname.split("/").pop();
    return ruta === "" ? "index.html" : ruta;
}

/**
 * Formatea un número con separador de miles en español (Colombia).
 * @param {number} numero
 * @returns {string}
 */
function formatearNumero(numero) {
    return new Intl.NumberFormat("es-CO").format(numero);
}

/* -------------------------------------------------------------------------
   2. LOGIN SIMULADO (RF04)
   ------------------------------------------------------------------------- */
function inicializarLogin() {
    const formulario = document.getElementById("form-login");
    if (!formulario) return;

    const inputCorreo = document.getElementById("correo");
    const inputClave = document.getElementById("clave");
    const botonIngresar = formulario.querySelector("button[type='submit']");

    // Limpia los errores mientras el usuario escribe
    [inputCorreo, inputClave].forEach((input) => {
        input.addEventListener("input", () => limpiarError(input));
    });

    formulario.addEventListener("submit", (e) => {
        // Evita el envío real del formulario (no hay backend en esta fase)
        e.preventDefault();

        let esValido = true;
        const correo = inputCorreo.value.trim();
        const clave = inputClave.value.trim();

        // Validación del correo
        if (correo === "") {
            mostrarError(inputCorreo, "El correo es obligatorio.");
            esValido = false;
        } else if (!esCorreoValido(correo)) {
            mostrarError(inputCorreo, "Ingresa un correo válido (ej. usuario@empresa.com).");
            esValido = false;
        }

        // Validación de la contraseña
        if (clave === "") {
            mostrarError(inputClave, "La contraseña es obligatoria.");
            esValido = false;
        } else if (clave.length < 6) {
            mostrarError(inputClave, "La contraseña debe tener al menos 6 caracteres.");
            esValido = false;
        }

        if (!esValido) {
            mostrarToast("Revisa los campos marcados en rojo.", "error");
            return;
        }

        // Simula la autenticación: guarda el usuario en la sesión del navegador
        const nombreUsuario = correo.split("@")[0];
        sessionStorage.setItem("bodega360_usuario", nombreUsuario);

        // Retroalimentación visual mientras "carga"
        botonIngresar.disabled = true;
        botonIngresar.innerHTML = `<i class="ph ph-circle-notch"></i> Ingresando...`;
        mostrarToast(`¡Bienvenido(a), ${nombreUsuario}!`, "exito", 1500);

        // Redirección al panel principal
        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 1200);
    });
}

/**
 * Permite mostrar u ocultar la contraseña con el botón del ojo.
 */
function inicializarVerClave() {
    const botones = document.querySelectorAll("[data-ver-clave]");
    botones.forEach((boton) => {
        boton.addEventListener("click", () => {
            const input = document.getElementById(boton.dataset.verClave);
            const icono = boton.querySelector("i");
            const oculto = input.type === "password";
            input.type = oculto ? "text" : "password";
            icono.className = oculto ? "ph ph-eye-slash" : "ph ph-eye";
            boton.setAttribute("aria-label", oculto ? "Ocultar contraseña" : "Mostrar contraseña");
        });
    });
}

/* -------------------------------------------------------------------------
   3. LAYOUT: NAVEGACIÓN ACTIVA, SIDEBAR MÓVIL, USUARIO Y FECHA
   ------------------------------------------------------------------------- */

/**
 * Resalta en el sidebar el enlace correspondiente a la página actual.
 */
function inicializarNavegacionActiva() {
    const paginaActual = obtenerPaginaActual();
    const enlaces = document.querySelectorAll(".sidebar__enlace");

    enlaces.forEach((enlace) => {
        const destino = enlace.getAttribute("href");
        if (destino === paginaActual) {
            enlace.classList.add("activo");
            enlace.setAttribute("aria-current", "page");
        } else {
            enlace.classList.remove("activo");
            enlace.removeAttribute("aria-current");
        }
    });
}

/**
 * Controla la apertura y cierre del sidebar en dispositivos móviles.
 */
function inicializarSidebarMovil() {
    const sidebar = document.querySelector(".sidebar");
    const botonMenu = document.querySelector(".topbar__menu");
    const overlay = document.querySelector(".overlay");
    if (!sidebar || !botonMenu || !overlay) return;

    const abrir = () => {
        sidebar.classList.add("sidebar--abierto");
        overlay.classList.add("overlay--visible");
        botonMenu.setAttribute("aria-expanded", "true");
    };

    const cerrar = () => {
        sidebar.classList.remove("sidebar--abierto");
        overlay.classList.remove("overlay--visible");
        botonMenu.setAttribute("aria-expanded", "false");
    };

    botonMenu.addEventListener("click", () => {
        sidebar.classList.contains("sidebar--abierto") ? cerrar() : abrir();
    });

    // Cierra al tocar fuera del menú
    overlay.addEventListener("click", cerrar);

    // Cierra con la tecla Escape (accesibilidad)
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") cerrar();
    });

    // Si se agranda la ventana a desktop, se restablece el estado
    window.addEventListener("resize", () => {
        if (window.innerWidth >= 992) cerrar();
    });
}

/**
 * Muestra el nombre del usuario "logueado" y sus iniciales en el sidebar.
 */
function mostrarUsuario() {
    const nombre = sessionStorage.getItem("bodega360_usuario");
    if (!nombre) return;

    const elNombre = document.querySelector(".sidebar__usuario-nombre");
    const elAvatar = document.querySelector(".sidebar__avatar");
    if (elNombre) elNombre.textContent = nombre;
    if (elAvatar) elAvatar.textContent = nombre.substring(0, 2).toUpperCase();
}

/**
 * Escribe la fecha actual en los elementos con el atributo [data-fecha-actual].
 */
function mostrarFechaActual() {
    const elementos = document.querySelectorAll("[data-fecha-actual]");
    if (!elementos.length) return;

    const fecha = new Date().toLocaleDateString("es-CO", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });
    // Primera letra en mayúscula
    const texto = fecha.charAt(0).toUpperCase() + fecha.slice(1);
    elementos.forEach((el) => (el.textContent = texto));
}

/* -------------------------------------------------------------------------
   4. CERRAR SESIÓN CON CONFIRMACIÓN
   ------------------------------------------------------------------------- */
function inicializarCerrarSesion() {
    const botones = document.querySelectorAll("[data-accion='cerrar-sesion']");
    botones.forEach((boton) => {
        boton.addEventListener("click", (e) => {
            e.preventDefault();
            const confirmar = window.confirm("¿Estás seguro(a) de que deseas cerrar sesión?");
            if (confirmar) {
                sessionStorage.removeItem("bodega360_usuario");
                window.location.href = "index.html";
            }
        });
    });
}

/* -------------------------------------------------------------------------
   5. DASHBOARD: ANIMACIÓN DEL GRÁFICO Y BARRAS DE PROGRESO
   ------------------------------------------------------------------------- */
function inicializarDashboard() {
    const barras = document.querySelectorAll(".grafico__barra[data-valor]");
    const progresos = document.querySelectorAll(".progreso__relleno[data-porcentaje]");
    if (!barras.length && !progresos.length) return;

    // Calcula la altura de cada barra en proporción al valor máximo
    const valores = Array.from(barras).map((b) => Number(b.dataset.valor));
    const maximo = Math.max(...valores, 1);

    // Se usa requestAnimationFrame para que la transición CSS se ejecute
    requestAnimationFrame(() => {
        barras.forEach((barra) => {
            const porcentaje = (Number(barra.dataset.valor) / maximo) * 100;
            barra.style.setProperty("--altura", `${porcentaje}%`);
        });

        progresos.forEach((progreso) => {
            const porcentaje = Math.min(Number(progreso.dataset.porcentaje), 100);
            progreso.style.setProperty("--porcentaje", `${porcentaje}%`);
        });
    });
}

/* -------------------------------------------------------------------------
   6. INVENTARIO: BÚSQUEDA, FILTROS Y ACCIONES
   ------------------------------------------------------------------------- */
function inicializarInventario() {
    const tabla = document.getElementById("tabla-inventario");
    if (!tabla) return;

    const buscador = document.getElementById("buscar-producto");
    const filtroCategoria = document.getElementById("filtro-categoria");
    const filtroEstado = document.getElementById("filtro-estado");
    const contador = document.getElementById("contador-productos");
    const filaVacia = document.getElementById("fila-vacia");
    const cuerpo = tabla.querySelector("tbody");

    /**
     * Aplica búsqueda por texto, categoría y estado sobre las filas.
     */
    const filtrar = () => {
        const texto = buscador.value.trim().toLowerCase();
        const categoria = filtroCategoria.value;
        const estado = filtroEstado ? filtroEstado.value : "";
        const filas = cuerpo.querySelectorAll("tr[data-categoria]");
        let visibles = 0;

        filas.forEach((fila) => {
            const contenido = fila.textContent.toLowerCase();
            const coincideTexto = texto === "" || contenido.includes(texto);
            const coincideCategoria = categoria === "" || fila.dataset.categoria === categoria;
            const coincideEstado = estado === "" || fila.dataset.estado === estado;
            const mostrar = coincideTexto && coincideCategoria && coincideEstado;

            fila.hidden = !mostrar;
            if (mostrar) visibles++;
        });

        // Muestra mensaje cuando no hay resultados
        if (filaVacia) filaVacia.hidden = visibles !== 0;
        if (contador) contador.textContent = `Mostrando ${visibles} de ${filas.length} productos`;
    };

    buscador.addEventListener("input", filtrar);
    filtroCategoria.addEventListener("change", filtrar);
    if (filtroEstado) filtroEstado.addEventListener("change", filtrar);

    // Delegación de eventos para los botones de acción de cada fila
    cuerpo.addEventListener("click", (e) => {
        const boton = e.target.closest("[data-accion]");
        if (!boton) return;

        const fila = boton.closest("tr");
        const nombre = fila.querySelector(".tabla__producto-nombre").textContent;

        switch (boton.dataset.accion) {
            case "editar":
                mostrarToast(`Edición de "${nombre}" disponible en la siguiente fase.`, "info");
                break;

            case "eliminar": {
                const confirmar = window.confirm(`¿Deseas eliminar el producto "${nombre}"? Esta acción no se puede deshacer.`);
                if (confirmar) {
                    fila.remove();
                    filtrar();
                    mostrarToast(`Producto "${nombre}" eliminado.`, "exito");
                }
                break;
            }
        }
    });

    // Botón "+ Nuevo producto"
    const botonNuevo = document.getElementById("btn-nuevo-producto");
    if (botonNuevo) {
        botonNuevo.addEventListener("click", () => {
            mostrarToast("El formulario de nuevo producto estará disponible en la siguiente fase.", "info");
        });
    }

    filtrar();
}

/* -------------------------------------------------------------------------
   7. MOVIMIENTOS: VALIDACIÓN DEL FORMULARIO (RF02)
   ------------------------------------------------------------------------- */
function inicializarMovimientos() {
    const formulario = document.getElementById("form-movimiento");
    if (!formulario) return;

    const selectProducto = document.getElementById("producto");
    const inputCantidad = document.getElementById("cantidad");
    const selectMotivo = document.getElementById("motivo");
    const inputObservacion = document.getElementById("observacion");
    const radiosTipo = formulario.querySelectorAll("input[name='tipo']");
    const infoStock = document.getElementById("info-stock");
    const stockTexto = document.getElementById("stock-disponible");
    const stockMinimoTexto = document.getElementById("stock-minimo");
    const listaRecientes = document.getElementById("lista-recientes");
    const ayudaCantidad = document.getElementById("ayuda-cantidad");

    /** Devuelve el tipo de movimiento seleccionado (entrada, salida o ajuste). */
    const obtenerTipo = () => {
        const seleccionado = formulario.querySelector("input[name='tipo']:checked");
        return seleccionado ? seleccionado.value : "";
    };

    /** Devuelve la opción del producto seleccionado. */
    const obtenerOpcion = () => selectProducto.options[selectProducto.selectedIndex];

    /** Actualiza la tarjeta informativa de stock disponible. */
    const actualizarInfoStock = () => {
        const opcion = obtenerOpcion();
        if (!opcion || !opcion.value) {
            infoStock.hidden = true;
            return;
        }
        stockTexto.textContent = formatearNumero(Number(opcion.dataset.stock));
        stockMinimoTexto.textContent = formatearNumero(Number(opcion.dataset.minimo));
        infoStock.hidden = false;
    };

    /** Ajusta el texto de ayuda de la cantidad según el tipo de movimiento. */
    const actualizarAyudaCantidad = () => {
        const tipo = obtenerTipo();
        const opcion = obtenerOpcion();
        const stock = opcion && opcion.value ? Number(opcion.dataset.stock) : null;

        if (tipo === "salida" && stock !== null) {
            ayudaCantidad.textContent = `Máximo permitido: ${formatearNumero(stock)} unidades.`;
            inputCantidad.max = stock;
        } else if (tipo === "ajuste") {
            ayudaCantidad.textContent = "Indica la nueva cantidad física contada en bodega.";
            inputCantidad.removeAttribute("max");
        } else {
            ayudaCantidad.textContent = "Ingresa un número entero mayor a cero.";
            inputCantidad.removeAttribute("max");
        }
    };

    /** Valida todos los campos y devuelve true si el formulario es correcto. */
    const validar = () => {
        let esValido = true;
        const tipo = obtenerTipo();
        const opcion = obtenerOpcion();
        const cantidad = Number(inputCantidad.value);

        // Producto obligatorio
        if (!selectProducto.value) {
            mostrarError(selectProducto, "Selecciona un producto.");
            esValido = false;
        }

        // Tipo de movimiento obligatorio
        const campoTipo = formulario.querySelector(".tipo-movimiento").closest(".campo");
        const errorTipo = campoTipo.querySelector(".campo__error");
        if (!tipo) {
            campoTipo.classList.add("campo--error");
            errorTipo.innerHTML = `<i class="ph ph-warning-circle"></i> Selecciona el tipo de movimiento.`;
            esValido = false;
        } else {
            campoTipo.classList.remove("campo--error");
            errorTipo.textContent = "";
        }

        // Cantidad: entero positivo (en ajuste se permite 0)
        if (inputCantidad.value.trim() === "") {
            mostrarError(inputCantidad, "La cantidad es obligatoria.");
            esValido = false;
        } else if (!Number.isInteger(cantidad)) {
            mostrarError(inputCantidad, "La cantidad debe ser un número entero.");
            esValido = false;
        } else if (tipo === "ajuste" ? cantidad < 0 : cantidad <= 0) {
            mostrarError(inputCantidad, tipo === "ajuste" ? "La cantidad no puede ser negativa." : "La cantidad debe ser mayor a cero.");
            esValido = false;
        } else if (tipo === "salida" && opcion && opcion.value) {
            // REGLA DE NEGOCIO: no se permite una salida mayor al stock disponible
            const stock = Number(opcion.dataset.stock);
            if (cantidad > stock) {
                mostrarError(inputCantidad, `Stock insuficiente. Solo hay ${formatearNumero(stock)} unidades disponibles.`);
                esValido = false;
            }
        }

        // Motivo obligatorio
        if (!selectMotivo.value) {
            mostrarError(selectMotivo, "Selecciona el motivo del movimiento.");
            esValido = false;
        }

        // Observación obligatoria solo en ajustes (trazabilidad)
        if (tipo === "ajuste" && inputObservacion.value.trim().length < 10) {
            mostrarError(inputObservacion, "En los ajustes describe la causa (mínimo 10 caracteres).");
            esValido = false;
        }

        return esValido;
    };

    /** Agrega el movimiento registrado al inicio de la lista de recientes. */
    const agregarMovimientoReciente = (tipo, nombreProducto, cantidad, motivo) => {
        if (!listaRecientes) return;

        const iconos = { entrada: "ph-arrow-down-left", salida: "ph-arrow-up-right", ajuste: "ph-sliders-horizontal" };
        const signos = { entrada: "+", salida: "-", ajuste: "=" };
        const clases = { entrada: "texto-exito", salida: "texto-critico", ajuste: "texto-alerta" };
        const hora = new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });

        const item = document.createElement("li");
        item.className = "movimiento";
        item.innerHTML = `
            <span class="movimiento__icono movimiento__icono--${tipo}"><i class="ph ${iconos[tipo]}"></i></span>
            <div class="movimiento__info">
                <p class="movimiento__titulo"></p>
                <p class="movimiento__detalle"></p>
            </div>
            <span class="movimiento__cantidad ${clases[tipo]}">${signos[tipo]}${formatearNumero(cantidad)}</span>
        `;
        item.querySelector(".movimiento__titulo").textContent = nombreProducto;
        item.querySelector(".movimiento__detalle").textContent = `${motivo} · Hoy, ${hora}`;
        listaRecientes.prepend(item);

        // Mantiene solo los 6 movimientos más recientes
        while (listaRecientes.children.length > 6) {
            listaRecientes.lastElementChild.remove();
        }
    };

    // ---- Eventos de los campos ----
    selectProducto.addEventListener("change", () => {
        limpiarError(selectProducto);
        actualizarInfoStock();
        actualizarAyudaCantidad();
    });

    radiosTipo.forEach((radio) => {
        radio.addEventListener("change", () => {
            const campoTipo = radio.closest(".campo");
            campoTipo.classList.remove("campo--error");
            campoTipo.querySelector(".campo__error").textContent = "";
            limpiarError(inputCantidad);
            actualizarAyudaCantidad();
        });
    });

    inputCantidad.addEventListener("input", () => limpiarError(inputCantidad));
    selectMotivo.addEventListener("change", () => limpiarError(selectMotivo));
    inputObservacion.addEventListener("input", () => limpiarError(inputObservacion));

    // ---- Envío del formulario ----
    formulario.addEventListener("submit", (e) => {
        e.preventDefault();

        if (!validar()) {
            mostrarToast("No se pudo guardar. Corrige los errores indicados.", "error");
            return;
        }

        const tipo = obtenerTipo();
        const opcion = obtenerOpcion();
        const cantidad = Number(inputCantidad.value);
        const stockActual = Number(opcion.dataset.stock);
        const minimo = Number(opcion.dataset.minimo);
        const nombreProducto = opcion.dataset.nombre;
        const motivo = selectMotivo.options[selectMotivo.selectedIndex].text;

        // Calcula el nuevo stock según el tipo de movimiento
        let nuevoStock = stockActual;
        if (tipo === "entrada") nuevoStock = stockActual + cantidad;
        if (tipo === "salida") nuevoStock = stockActual - cantidad;
        if (tipo === "ajuste") nuevoStock = cantidad;

        // Confirmación antes de guardar ajustes (afectan directamente el inventario)
        if (tipo === "ajuste") {
            const confirmar = window.confirm(
                `Vas a ajustar el stock de "${nombreProducto}" de ${stockActual} a ${nuevoStock} unidades. ¿Deseas continuar?`
            );
            if (!confirmar) return;
        }

        // Actualiza el stock en memoria (simulación sin backend)
        opcion.dataset.stock = nuevoStock;

        agregarMovimientoReciente(tipo, nombreProducto, cantidad, motivo);
        mostrarToast(`Movimiento registrado. Nuevo stock de "${nombreProducto}": ${formatearNumero(nuevoStock)}.`, "exito");

        // Aviso si el producto queda por debajo del mínimo
        if (nuevoStock <= minimo) {
            setTimeout(() => {
                mostrarToast(`Atención: "${nombreProducto}" quedó por debajo del stock mínimo (${minimo}).`, "alerta", 5000);
            }, 400);
        }

        // Limpia el formulario conservando el producto seleccionado
        const productoSeleccionado = selectProducto.value;
        formulario.reset();
        selectProducto.value = productoSeleccionado;
        actualizarInfoStock();
        actualizarAyudaCantidad();
    });

    // Botón "Cancelar": limpia el formulario
    formulario.addEventListener("reset", () => {
        formulario.querySelectorAll(".campo--error").forEach((c) => c.classList.remove("campo--error"));
        formulario.querySelectorAll(".campo__error").forEach((e) => (e.textContent = ""));
        setTimeout(() => {
            actualizarInfoStock();
            actualizarAyudaCantidad();
        }, 0);
    });

    // Preselección desde la URL (ej. movimientos.html?producto=VAL-001&tipo=entrada)
    const parametros = new URLSearchParams(window.location.search);
    const codigo = parametros.get("producto");
    const tipoUrl = parametros.get("tipo");
    if (codigo) selectProducto.value = codigo;
    if (tipoUrl) {
        const radio = formulario.querySelector(`input[name='tipo'][value='${CSS.escape(tipoUrl)}']`);
        if (radio) radio.checked = true;
    }

    actualizarInfoStock();
    actualizarAyudaCantidad();
}

/* -------------------------------------------------------------------------
   8. INICIALIZACIÓN GENERAL
   Se ejecuta cuando el DOM está completamente cargado. Cada función
   verifica si los elementos existen, por lo que el mismo archivo sirve
   para todas las páginas.
   ------------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
    // Página de login
    inicializarLogin();
    inicializarVerClave();

    // Layout común de la aplicación
    inicializarNavegacionActiva();
    inicializarSidebarMovil();
    inicializarCerrarSesion();
    mostrarUsuario();
    mostrarFechaActual();

    // Vistas específicas
    inicializarDashboard();
    inicializarInventario();
    inicializarMovimientos();
});
