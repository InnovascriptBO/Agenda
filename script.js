async function cargarReservas() {
  try {
    const response = await fetch("https://script.google.com/a/macros/innovaschools.edu.pe/s/AKfycbxe-bvIrpexcnCU_ltHOjFji_bT7T1RoQ_AQPOiuuP7c2LQGdIjsW35foOBVaMOB-am/exec?accion=obtenerDatos&hoja=Reservas");
    const data = await response.json();
    
    if (data.error) {
      console.error("Error:", data.error);
      return;
    }

    console.log("Reservas recibidas:", data.datos);
    mostrarReservasEnTabla(data.datos);
  } catch (error) {
    console.error("Error al cargar reservas:", error);
  }
}

function mostrarReservasEnTabla(datos) {
  let tbody = document.getElementById("tbodyReservas");
  tbody.innerHTML = ""; // Limpiar la tabla

  datos.slice(1).forEach(row => { // Omitimos la primera fila (encabezados)
    let tr = document.createElement("tr");
    row.forEach(cell => {
      let td = document.createElement("td");
      td.textContent = cell;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}
