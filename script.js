function obtenerDatosDeHoja(hojaNombre) {
  fetch(`https://script.google.com/a/macros/innovaschools.edu.pe/s/AKfycbxe-bvIrpexcnCU_ltHOjFji_bT7T1RoQ_AQPOiuuP7c2LQGdIjsW35foOBVaMOB-am/exec?accion=obtenerDatos&hoja=${encodeURIComponent(hojaNombre)}`)
    .then(response => response.json())
    .then(data => {
      console.log(`Datos de ${hojaNombre}:`, data);
      // Aquí puedes actualizar la UI con los datos recibidos
    })
    .catch(error => console.error("Error al obtener datos:", error));
}

// Ejemplo: Obtener datos de la hoja "Reservas"
document.addEventListener("DOMContentLoaded", function() {
  obtenerDatosDeHoja("Reservas");
});
