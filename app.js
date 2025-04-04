if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('?file=sw')
    .then(function(registration) {
      console.log('Service Worker registrado con éxito:', registration.scope);
    })
    .catch(function(error) {
      console.error('Error al registrar el Service Worker:', error);
    });
}

    let areaUsuario = "";
    function showLoading() {
      document.getElementById("loadingOverlay").style.display = "flex";
    }
    function hideLoading() {
      document.getElementById("loadingOverlay").style.display = "none";
    }
    /* Sección Calendario Anual: se carga solo al ingresar al tab */
    function initCalendarioAnual() {
      google.script.run.withSuccessHandler(function(area) {
        areaUsuario = area;
        let select = document.getElementById("areaCalendario");
        select.innerHTML = "";
        if (area) {
          let option = document.createElement("option");
          option.value = area;
          option.textContent = area;
          select.appendChild(option);
        } else {
          let option = document.createElement("option");
          option.value = "";
          option.textContent = "Área no detectada";
          select.appendChild(option);
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
    function seleccionarMes(mes) {
      if (!areaUsuario) {
        alert("Área no detectada.");
        return;
      }
      showLoading();
      google.script.run.withSuccessHandler(function(detalle) {
        hideLoading();
        dibujarDetalleMes(mes, detalle);
      }).obtenerResumenMensualDetalle(areaUsuario, mes);
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
                if (typeof ev === "object" && ev.sede && ev.actividad) {
                  return `${ev.sede} - ${ev.actividad}`;
                } else if (typeof ev === "string" && ev.includes(" - ")) {
                  let parts = ev.split(" - ");
                  let nombreExtraido = parts[0].trim();
                  let actividad = parts.slice(1).join(" - ").trim();
                  // Normalizamos para la comparación
                  let nombreEvento = nombreExtraido.toLowerCase();
                  let nombreFila = col.trim().toLowerCase();
                  
                  // Depuración (puedes comentar o eliminar después)
                  console.log("Comparando:", { nombreFila, nombreEvento, original: ev });
                  
                  if (areaCal === "legal") {
                    // Si el valor de la fila está vacío o es "no especificado", se muestra el evento
                    if (!nombreFila || nombreFila === "no especificado") {
                      return `${nombreExtraido} - ${actividad}`;
                    }
                    // Si hay un nombre en la fila, se compara con el extraído
                    if (nombreFila.trim().toLowerCase() === nombreEvento.trim().toLowerCase()) {
                      return `${nombreExtraido} - ${actividad}`;
                    }
                  } else {
                    return actividad;
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
      google.script.run.withSuccessHandler(function(mensaje) {
        mostrarModal(mensaje);
        cargarReservas();
      }).registrarActividad(datos);
    }
    function cargarReservas() {
  let area = document.getElementById("area").value;
  const areasPermitidas = ["Sistemas", "Comercial", "GDH", "Legal", "Operaciones"];
  // Si el área no es una de las permitidas, salimos sin calcular la tabla de reservas
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
    let tbody = document.getElementById("tbodyReservas");
    tbody.innerHTML = "";
    if (reservas.length === 0) {
      document.getElementById("tablaReservas").style.display = "none";
      return;
    }
    reservas.forEach(function(reserva) {
      let tr = document.createElement("tr");
      tr.innerHTML = "<td>" + reserva.colaborador + "</td>" +
                     "<td>" + reserva.actividad + "</td>" +
                     "<td>" + reserva.fecha + "</td>" +
                     "<td>" + reserva.area + "</td>";
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
  let region = document.getElementById("regionSelect").value;
  let mes = document.getElementById("regionMonthSelect").value;
  if (!region) {
    alert("Seleccione una región.");
    return;
  }
  if (!mes) {
    alert("Seleccione un mes.");
    return;
  }
  showLoading();
  google.script.run.withSuccessHandler(function(regionalResumen) {
    hideLoading();
    dibujarCalendarioRegional(regionalResumen, parseInt(mes));
  }).obtenerResumenRegional(region, parseInt(mes));
}

// Función para dibujar la tabla del Calendario Regional, agrupada por semanas (lunes a viernes)
function dibujarCalendarioRegional(regionalResumen, mes) {
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
  for (let i = 0; i < diasHabiles.length; i += 5) {
    weeks.push(diasHabiles.slice(i, i + 5));
  }
  
  // Obtener las sedes ordenadas
  let sedes = Object.keys(regionalResumen).sort();
  let html = "";
  
  weeks.forEach((week, idx) => {
    html += `<h5 class="mt-3">Semana ${idx + 1}</h5>`;
    html += '<table class="calendar-table fadeIn">';
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

    window.onload = function() {
      cargarAreas();
    }

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open('mi-cache-v1').then(function(cache) {
      return cache.addAll([
        '/',  // La raíz de tu app
        '/formulario_agenda.html', // Archivo principal, si aplica
        '/script.js',  // Puedes cachear también tus scripts
        '/styles.css'  // Y estilos, por ejemplo
        // Agrega aquí otros recursos estáticos que quieras cachear
      ]);
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      // Devuelve el recurso cacheado o, si no existe, realiza la solicitud a la red.
      return response || fetch(event.request);
    })
  );
});

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById('installBtn').style.display = 'block';
});

document.getElementById('installBtn').addEventListener('click', () => {
  deferredPrompt.prompt();
});

