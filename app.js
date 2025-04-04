const API_URL = "https://script.google.com/macros/s/AKfycbylrk1ajPkZ7QI6e1ofKMUsHYtw149vfnCpTpp7fD2eyIgTd2cyn7NlXNjOpLnL68Jh7A/exec";

// Ejemplo: Obtener áreas
async function obtenerAreas() {
  const response = await fetch(`${API_URL}?action=obtenerAreas`);
  return response.json();
}

// Ejemplo: Registrar actividad (POST)
async function registrarActividad(datos) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(datos)
    });
    return await response.json();
  } catch (error) {
    // Guardar en IndexedDB si hay error
    guardarOffline(datos);
    return { status: "offline", message: "Datos guardados localmente" };
  }
}

// Función para guardar datos offline
function guardarOffline(datos) {
  // Usar IndexedDB o localStorage
  const pendientes = JSON.parse(localStorage.getItem("pendientes") || []);
  pendientes.push(datos);
  localStorage.setItem("pendientes", JSON.stringify(pendientes));
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js') // Ruta relativa
    .then(() => console.log('SW Registrado'))
    .catch(err => console.log('Error SW:', err));
}

// Guardar registros offline
async function guardarOffline(datos) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("offlineDB", 1);
    
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      db.createObjectStore("pendientes", { autoIncrement: true });
    };
    
    request.onsuccess = (e) => {
      const db = e.target.result;
      const tx = db.transaction("pendientes", "readwrite");
      const store = tx.objectStore("pendientes");
      store.add(datos);
      resolve();
    };
    
    request.onerror = reject;
  });
}

// Sincronizar al recuperar conexión
window.addEventListener("online", async () => {
  const db = await indexedDB.open("offlineDB");
  const tx = db.transaction("pendientes", "readwrite");
  const store = tx.objectStore("pendientes");
  const pendientes = await store.getAll();

  pendientes.forEach(async (item) => {
    try {
      await google.script.run.registrarActividad(item);
      await store.delete(item.id);
    } catch (error) {
      console.error("Error sincronizando:", error);
    }
  });
});



    let areaUsuario = "";
    function showLoading() {
      document.getElementById("loadingOverlay").style.display = "flex";
    }
    function hideLoading() {
      document.getElementById("loadingOverlay").style.display = "none";
    }
    /* Sección Calendario Anual: se carga solo al ingresar al tab */
    // Función modificada en el HTML (asegurar minúsculas)
function initCalendarioAnual() {
  google.script.run.withSuccessHandler(function(areaUsuario) {
    let select = document.getElementById("areaCalendario");
    select.innerHTML = "";
    
    if (!areaUsuario) {
      select.innerHTML = '<option value="">Área no configurada en Acceso Supervisor</option>';
      return;
    }
    
    // Normalizar a minúsculas y trim
    const areaUsuarioNormalizada = areaUsuario.toLowerCase().trim();
    
    if (areaUsuarioNormalizada === "todas") {
      const areasPermitidas = ["Sistemas", "Comercial", "GDH", "Legal", "Operaciones"];
      areasPermitidas.forEach(area => {
        const option = document.createElement("option");
        option.value = area;
        option.textContent = area;
        select.appendChild(option);
      });
    } else {
      const option = document.createElement("option");
      option.value = areaUsuario;
      option.textContent = areaUsuario;
      select.appendChild(option);
      select.disabled = true;
    }
  }).obtenerAreaUsuarioActivo();
}
    document.addEventListener("DOMContentLoaded", function() {
      var calendarTab = document.getElementById("calendarioTab");
      calendarTab.addEventListener("shown.bs.tab", function(event) {
        initCalendarioAnual();
      });
    });
    function mostrarPantallaMeses() {
      document.getElementById("pantallaMeses").style.display = "block";
      document.getElementById("pantallaDetalle").style.display = "none";
    }
    function mostrarPantallaDetalle() {
      document.getElementById("pantallaMeses").style.display = "none";
      document.getElementById("pantallaDetalle").style.display = "block";
    }
    // Modificar la función seleccionarMes para que use el valor actual del select
function seleccionarMes(mes) {
    const areaSeleccionada = document.getElementById("areaCalendario").value;
    
    if (!areaSeleccionada) {
        alert("Seleccione un área válida.");
        return;
    }

    showLoading();
    google.script.run
        .withSuccessHandler(function(detalle) {
            hideLoading();
            dibujarDetalleMes(mes, detalle);
        })
        .withFailureHandler(function(error) {
            hideLoading();
            alert("Error al cargar el mes: " + error.message);
        })
        .obtenerResumenMensualDetalle(areaSeleccionada, mes);
}


function dibujarDetalleMes(mes, detalle) {
  mostrarPantallaDetalle();
  document.getElementById("tituloMes").innerText = `Área: ${areaUsuario} - Mes: ${mes}`;
  let anio = 2025;

  // 1. Obtener todos los días hábiles del mes
  let workingDays = [];
  let finMes = new Date(anio, mes, 0).getDate();
  for (let day = 1; day <= finMes; day++) {
    let currentDate = new Date(anio, mes - 1, day);
    if (currentDate.getDay() >= 1 && currentDate.getDay() <= 5) {
      workingDays.push(new Date(currentDate));
    }
  }

  // 2. Agrupar en semanas
  let weeks = [];
  let firstWeek = [];
  if (workingDays.length > 0) {
    let firstWorkingDay = workingDays[0];
    let friday = new Date(firstWorkingDay);
    while (friday.getDay() !== 5 && friday.getMonth() === firstWorkingDay.getMonth()) {
      friday.setDate(friday.getDate() + 1);
    }
    while (workingDays.length > 0 && workingDays[0] <= friday) {
      firstWeek.push(workingDays.shift());
    }
    weeks.push(firstWeek);
  }
  while (workingDays.length > 0) {
    let week = [];
    for (let i = 0; i < 5; i++) {
      if (workingDays.length === 0) break;
      week.push(workingDays.shift());
    }
    weeks.push(week);
  }

  // 3. Generar el HTML de la tabla por semana
  let html = "";
  // Normalizamos el valor del área seleccionada
  let areaCal = document.getElementById("areaCalendario").value.trim().toLowerCase();
  
  weeks.forEach((week, idx) => {
    html += `<h5 class="mt-3">Semana ${idx + 1}</h5>`;
    html += `<table class="detalle-table fadeIn">`;
    html += "<thead><tr><th>Nombre</th>";
    week.forEach(cell => {
      let dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
      let label = cell ? dayNames[cell.getDay()] + " " + cell.getDate() : "";
      html += `<th>${label}</th>`;
    });
    html += "</tr></thead><tbody>";

    let colaboradores = Object.keys(detalle).sort();
    colaboradores.forEach(col => {
      html += `<tr><td>${col}</td>`;
      week.forEach(cell => {
        if (cell) {
          let dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
          let label = dayNames[cell.getDay()] + " " + cell.getDate();
          let info = detalle[col][label];

           if (info) {
            if (Array.isArray(info)) {
              let content = info.map(ev => {
                // CASO 1: Es un objeto (sede - actividad)
                if (typeof ev === "object" && ev.sede && ev.actividad) {
                  return `${ev.sede} - ${ev.actividad}`;
                } 
                // CASO 2: Es un string (actividad sin sede o Legal)
                else if (typeof ev === "string") {
                  // Solo para Legal procesamos "Nombre - Actividad"
                  if (areaCal === "legal" && ev.includes(" - ")) {
                    let [nombreExtraido, ...actividadParts] = ev.split(" - ");
                    let actividad = actividadParts.join(" - ");
                    return `${nombreExtraido} - ${actividad}`;
                  } 
                  // Para otras áreas, mostramos el string directo (sin "todas - ")
                  else {
                    return ev;
                  }
                }
                return ev.toString();
              }).filter(item => item !== "").join("<br>");
              html += `<td>${content}</td>`;
            } else if (typeof info === "object") {
              html += `<td>${info.sede} - ${info.actividad}</td>`;
            } else {
              html += `<td>${info}</td>`;
            }
          } else {
            html += `<td></td>`;
          }
        } else {
          html += `<td></td>`;
        }
      });
      html += "</tr>";
    });
    html += "</tbody></table>";
  });

  document.getElementById("detalleMesContainer").innerHTML = html;

  if (window.detalleInterval) clearInterval(window.detalleInterval);
  window.detalleInterval = setInterval(() => {
    if (!areaUsuario) return;
    google.script.run
      .withSuccessHandler(nuevoDetalle => {
        if (JSON.stringify(nuevoDetalle) !== JSON.stringify(detalle)) {
          dibujarDetalleMes(mes, nuevoDetalle); // Solo actualiza si hay cambios
        }
        hideLoading();
      })
      .obtenerResumenMensualDetalle(areaUsuario, mes);
  }, 30000); // 30 segundos
}




    
    function cargarCalendarioAnual() {
      let areaSel = document.getElementById("areaCalendario").value;
      if (!areaSel) {
        alert("No se ha seleccionado un área.");
        return;
      }
      showLoading();
      google.script.run.withSuccessHandler(function(calendario) {
        hideLoading();
        window.calendarioGlobal = calendario;
        dibujarCalendarioAnual(calendario);
      }).obtenerReservasCalendarioPorArea(areaSel);
    }
    function dibujarCalendarioAnual(calendario) {
      let container = document.getElementById("calendarAnualContainer");
      container.innerHTML = "";
      let filtroHTML = `<div class="mb-3">
                          <label for="filtroMes" class="form-label">Filtrar por Mes:</label>
                          <select id="filtroMes" class="form-select" onchange="filtrarCalendario()">
                            <option value="todos">Todos</option>
                            <option value="3">Marzo</option>
                            <option value="4">Abril</option>
                            <option value="5">Mayo</option>
                            <option value="6">Junio</option>
                            <option value="7">Julio</option>
                            <option value="8">Agosto</option>
                            <option value="9">Septiembre</option>
                            <option value="10">Octubre</option>
                            <option value="11">Noviembre</option>
                            <option value="12">Diciembre</option>
                          </select>
                        </div>`;
      let navTabs = '<ul class="nav nav-tabs" id="mesTabs" role="tablist">';
      let tabContent = '<div class="tab-content" id="mesTabContent">';
      const nombresMes = {
        3: "Marzo", 4: "Abril", 5: "Mayo", 6: "Junio", 7: "Julio",
        8: "Agosto", 9: "Septiembre", 10: "Octubre", 11: "Noviembre", 12: "Diciembre"
      };
      for (let mes in calendario) {
        navTabs += `
          <li class="nav-item" role="presentation">
            <button class="nav-link ${mes === "3" ? 'active' : ''}" id="tab-${mes}" data-bs-toggle="tab" data-bs-target="#content-${mes}" type="button" role="tab">
              ${nombresMes[mes] || 'Mes ' + mes}
            </button>
          </li>`;
        let tablaMes = generarTablaMes(mes, calendario[mes]);
        tabContent += `
          <div class="tab-pane fade ${mes === "3" ? 'show active' : ''}" id="content-${mes}" role="tabpanel">
            ${tablaMes}
          </div>`;
      }
      navTabs += '</ul>';
      tabContent += '</div>';
      container.innerHTML = filtroHTML + navTabs + tabContent;
    }
    function filtrarCalendario() {
      let filtro = document.getElementById("filtroMes").value;
      if (filtro === "todos") {
        dibujarCalendarioAnual(window.calendarioGlobal);
      } else {
        let objFiltrado = {};
        if (window.calendarioGlobal[filtro]) {
          objFiltrado[filtro] = window.calendarioGlobal[filtro];
        }
        dibujarCalendarioAnual(objFiltrado);
      }
    }

    function generarTablaMes(mes, mesData) {
  let anio = 2025;
  let inicioMes = new Date(anio, mes - 1, 1);
  let finMes = new Date(anio, mes, 0);
  let diasHabiles = [];
  
  // Recopilar días hábiles (lunes a viernes) del mes
  for (let d = new Date(inicioMes); d <= finMes; d.setDate(d.getDate() + 1)) {
    if (d.getDay() >= 1 && d.getDay() <= 5) {
      diasHabiles.push(new Date(d));
    }
  }
  
  // Agrupar en semanas:
  let weeks = [];
  
  // Primera semana: desde el primer día hábil hasta el viernes de esa misma semana
  let firstWeek = [];
  if (diasHabiles.length > 0) {
    let firstDay = diasHabiles[0];
    let friday = new Date(firstDay);
    while (friday.getDay() !== 5 && friday.getMonth() === firstDay.getMonth()) {
      friday.setDate(friday.getDate() + 1);
    }
    while (diasHabiles.length > 0 && diasHabiles[0] <= friday) {
      firstWeek.push(diasHabiles.shift());
    }
    weeks.push(firstWeek);
  }
  
  // Agrupar los días restantes en bloques de hasta 5 días hábiles
  while (diasHabiles.length > 0) {
    let week = diasHabiles.splice(0, 5);
    weeks.push(week);
  }
  
  // Generar el HTML de la tabla
  let html = "";
  weeks.forEach((week, idx) => {
    html += `<h5 class="mt-3">Semana ${idx + 1}</h5>`;
    html += `<table class="detalle-table fadeIn">`;
    html += "<thead><tr><th>Nombre</th>";
    week.forEach(cell => {
      let dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
      let label = cell ? dayNames[cell.getDay()] + " " + cell.getDate() : "";
      html += `<th>${label}</th>`;
    });
    html += "</tr></thead><tbody>";
  
    // Recorremos los colaboradores (clave en el objeto mesData)
    let colaboradores = Object.keys(mesData).sort();
    colaboradores.forEach(col => {
      html += `<tr><td>${col}</td>`;
      week.forEach(cell => {
        if (cell) {
          let dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
          let key = dayNames[cell.getDay()] + " " + cell.getDate();
          let cellData = mesData[col][key];
          if (cellData) {
            // Si hay más de un registro, se unen con saltos de línea
            if (Array.isArray(cellData)) {
              let cellContent = cellData.map(item => {
                // Para Legal se muestra el registro completo (Sede-Actividad)
                if (document.getElementById("areaCalendario").value === "Legal") {
                  return item.toString();
                }
                // Para otros, se puede aplicar otra lógica o mostrar el registro completo
                return item.toString();
              }).join("<br>");
              html += `<td>${cellContent}</td>`;
            } else {
              html += `<td>${cellData}</td>`;
            }
          } else {
            html += `<td></td>`;
          }
        } else {
          html += `<td></td>`;
        }
      });
      html += "</tr>";
    });
    html += "</tbody></table>";
  });
  
  return html;
}




    /* Sección Registro y Reservas */
    function cargarAreas() {
      google.script.run.withSuccessHandler(function(areas) {
        let areaSelect = document.getElementById("area");
        areaSelect.innerHTML = '<option value="">Seleccione un área</option>';
        areas.forEach(function(area) {
          let option = document.createElement("option");
          option.value = area;
          option.textContent = area;
          areaSelect.appendChild(option);
        });
      }).obtenerAreas();
    }
    function cargarColaboradores() {
      let area = document.getElementById("area").value;
      if (!area) {
        document.getElementById("colaborador").innerHTML = '<option value="">Seleccione un colaborador</option>';
        return;
      }
      google.script.run.withSuccessHandler(function(colaboradores) {
        let colaboradorSelect = document.getElementById("colaborador");
        colaboradorSelect.innerHTML = '<option value="">Seleccione un colaborador</option>';
        colaboradores.forEach(function(colaborador) {
          let option = document.createElement("option");
          option.value = colaborador;
          option.textContent = colaborador;
          colaboradorSelect.appendChild(option);
        });
      }).obtenerColaboradoresPorArea(area);
    }
    function cargarSedes() {
      let area = document.getElementById("area").value;
      let colaborador = document.getElementById("colaborador").value;
      if (!area || !colaborador) {
        document.getElementById("sede").innerHTML = '<option value="">Seleccione una sede</option>';
        return;
      }
      google.script.run.withSuccessHandler(function(sedes) {
        let sedeSelect = document.getElementById("sede");
        sedeSelect.innerHTML = '<option value="">Seleccione una sede</option>';
        sedes.forEach(function(sede) {
          let option = document.createElement("option");
          option.value = sede;
          option.textContent = sede;
          sedeSelect.appendChild(option);
        });
      }).obtenerSedesPorColaborador(area, colaborador);
    }
    function registrarActividad() {
      let datos = {
        area: document.getElementById("area").value,
        colaborador: document.getElementById("colaborador").value,
        sede: document.getElementById("sede").value,
        fecha: document.getElementById("fecha").value,
        actividad: document.getElementById("actividad").value
      };

      if (!navigator.onLine) {
    guardarOffline(datos)
      .then(() => mostrarModal("Datos guardados localmente. Se sincronizarán con conexión."))
      .catch(err => mostrarModal("Error guardando offline: " + err));
    return;
  }

  google.script.run
    .withSuccessHandler(/* ... */)
    .registrarActividad(datos);
      google.script.run.withSuccessHandler(function(mensaje) {
        mostrarModal(mensaje);
        cargarReservas();
      }).registrarActividad(datos);
    }

    function cargarReservas() {
  let area = document.getElementById("area").value;
  const areasPermitidas = ["Sistemas", "Comercial", "GDH", "Legal", "Operaciones"];
  
  if (!areasPermitidas.includes(area)) {
    document.getElementById("tablaReservas").style.display = "none";
    return;
  }
  
  let sede = document.getElementById("sede").value;
  let fecha = document.getElementById("fecha").value;
  
  if (!sede || !fecha) {
    document.getElementById("tablaReservas").style.display = "none";
    return;
  }
  
  google.script.run.withSuccessHandler(function(reservas) {
    hideLoading();
    let tbody = document.getElementById("tbodyReservas");
    tbody.innerHTML = "";
    
    if (reservas.length === 0) {
      document.getElementById("tablaReservas").style.display = "none";
      return;
    }
    
    reservas.forEach(function(reserva) {
      let tr = document.createElement("tr");
      
      // Para móviles (versión tarjeta)
      if (window.innerWidth < 576) {
        tr.innerHTML = `
          <td data-label="Colaborador">${reserva.colaborador}</td>
          <td data-label="Actividad">${reserva.actividad}</td>
          <td data-label="Fecha">${reserva.fecha}</td>
          <td class="d-none d-md-table-cell">${reserva.area}</td>
        `;
      } 
      // Para tablets/desktop
      else {
        tr.innerHTML = `
          <td>${reserva.colaborador}</td>
          <td>${reserva.actividad}</td>
          <td>${reserva.fecha}</td>
          <td class="d-none d-md-table-cell">${reserva.area}</td>
        `;
      }
      
      tbody.appendChild(tr);
    });
    
    document.getElementById("tablaReservas").style.display = "table";
  }).obtenerReservasPorSedeTodas(sede, fecha);
}

function mostrarModal(mensaje) {
      let modalBody = document.getElementById("modalBody");
      modalBody.innerText = mensaje;
      let myModal = new bootstrap.Modal(document.getElementById("mensajeModal"));
      myModal.show();
    }

// Función única para cargar el Calendario Regional para un mes dado (ej. marzo)
function cargarCalendarioRegional() {
  const region = document.getElementById("regionSelect").value;
  const mes = document.getElementById("regionMonthSelect").value;
  
  if (!region || !mes) {
    alert("Seleccione región y mes");
    return;
  }
  
  showLoading();
  google.script.run
    .withSuccessHandler(data => {
      hideLoading();
      dibujarCalendarioRegional(data, mes);
    })
    .obtenerResumenRegional(region, mes);
}

// Función para dibujar la tabla del Calendario Regional, agrupada por semanas (lunes a viernes)
function dibujarCalendarioRegional(regionalResumen, mes) {
  if (window.intervalCalRegional) clearInterval(window.intervalCalRegional);
  let container = document.getElementById("regionalCalendarContainer");
  container.innerHTML = "";
  
  let anio = 2025;
  let inicioMes = new Date(anio, mes - 1, 1);
  let finMes = new Date(anio, mes, 0);
  let diasHabiles = [];
  
  // Generar etiquetas para cada día hábil (lunes a viernes)
  for (let d = new Date(inicioMes); d <= finMes; d.setDate(d.getDate() + 1)) {
    if (d.getDay() >= 1 && d.getDay() <= 5) {
      let dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
      let label = `${dayNames[d.getDay()]} ${d.getDate()}`;
      diasHabiles.push({ label: label, day: d.getDate() });
    }
  }
  
  // Agrupar en semanas (grupos de 5 días consecutivos)
  let weeks = [];
  let diasRestantes = diasHabiles.map(d => new Date(anio, mes - 1, d.day)); // Convertir a Dates
  
  // Primera semana: desde el primer día hasta el viernes de esa semana
  if (diasRestantes.length > 0) {
    let firstWeek = [];
    let firstDay = diasRestantes[0];
    let friday = new Date(firstDay);
    
    // Buscar el viernes de la primera semana
    while (friday.getDay() !== 5 && friday.getMonth() === firstDay.getMonth()) {
      friday.setDate(friday.getDate() + 1);
    }
    
    // Agregar días hasta el viernes encontrado
    while (diasRestantes.length > 0 && diasRestantes[0] <= friday) {
      let dia = diasRestantes.shift();
      // Convertir de nuevo al formato original {label, day}
      let originalDia = diasHabiles.find(d => d.day === dia.getDate());
      firstWeek.push(originalDia);
    }
    weeks.push(firstWeek);
  }

  // Agrupar el resto en semanas completas
  while (diasRestantes.length > 0) {
    let week = [];
    for (let i = 0; i < 5; i++) {
      if (diasRestantes.length === 0) break;
      let dia = diasRestantes.shift();
      // Convertir de nuevo al formato original {label, day}
      let originalDia = diasHabiles.find(d => d.day === dia.getDate());
      week.push(originalDia);
    }
    weeks.push(week);
  }

  // Obtener las sedes ordenadas
  let sedes = Object.keys(regionalResumen).sort();
  let html = "";
  
  weeks.forEach((week, idx) => {
    html += `<h5 class="mt-3">Semana ${idx + 1}</h5>`;
    html += '<table class="regional-table fadeIn">';
    html += "<thead><tr><th>Sede</th>";
    week.forEach(dia => {
      html += `<th>${dia.label}</th>`;
    });
    html += "</tr></thead><tbody>";
    
    sedes.forEach(sede => {
      html += `<tr><td>${sede}</td>`;
      week.forEach(dia => {
        let dato = regionalResumen[sede][dia.day];
        let usuarios = [];
        if (Array.isArray(dato)) {
          usuarios = dato;
        } else if (dato && typeof dato === "string") {
          usuarios = [dato];
        }
        // Formatear cada valor: en lugar de dividir por espacios o guiones,
        // simplemente reemplazamos los saltos de línea con <br>
        let formattedUsuarios = usuarios.map(function(item) {
          // Convertir a string y reemplazar saltos de línea por <br>
          return item.toString().replace(/(\r\n|\n|\r)/g, "<br>");
        });
        html += `<td>${formattedUsuarios.length ? formattedUsuarios.join("<br>") : ""}</td>`;
      });
      html += "</tr>";
    });
    
    html += "</tbody></table>";
  });
  
  container.innerHTML = html;
  const actualizarCalendario = () => {
    const region = document.getElementById("regionSelect").value;
    const mesActual = document.getElementById("regionMonthSelect").value;
    
    if (!region || !mesActual) return;
    
    google.script.run
      .withSuccessHandler(nuevosDatos => {
        if (JSON.stringify(nuevosDatos) !== JSON.stringify(regionalResumen)) {
          dibujarCalendarioRegional(nuevosDatos, mesActual);
          mostrarNotificacion("¡Calendario actualizado!");
        }
      })
      .withFailureHandler(error => console.error("Error actualizando:", error))
      .obtenerResumenRegional(region, mesActual);
  };

  // Configurar intervalo de actualización
  window.intervalCalRegional = setInterval(actualizarCalendario, 30000);
  
  // Actualizar inmediatamente al cambiar región/mes
  document.getElementById("regionSelect").onchange = actualizarCalendario;
  document.getElementById("regionMonthSelect").onchange = actualizarCalendario;
}

function mostrarNotificacion(mensaje) {
  const toast = document.createElement("div");
  toast.className = "actualizando-toast";
  toast.textContent = mensaje;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.remove(), 2000);
}


function cargarActividades() {
  let area = document.getElementById("area").value;
  let actividadSelect = document.getElementById("actividad");
  if (!area) {
    actividadSelect.innerHTML = '<option value="">Seleccione un área</option>';
    return;
  }
  google.script.run.withSuccessHandler(function(actividades) {
    actividadSelect.innerHTML = '<option value="">Seleccione una actividad</option>';
    actividades.forEach(function(act) {
      let option = document.createElement("option");
      option.value = act;
      option.textContent = act;
      actividadSelect.appendChild(option);
    });
  }).obtenerActividadesPorArea(area);
}

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById('installButton').classList.remove('d-none');
});

document.getElementById('installButton').addEventListener('click', () => {
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then((choiceResult) => {
    if (choiceResult.outcome === 'accepted') {
      console.log('Usuario instaló la app');
    }
    deferredPrompt = null;
  });
});

    window.onload = function() {
      cargarAreas();
    }

    // Manejar cambios de tamaño de pantalla
window.addEventListener('resize', function() {
  if (document.getElementById("tablaReservas").style.display === "table") {
    cargarReservas(); // Reprocesar tabla al cambiar tamaño
  }
});
