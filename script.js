fetch("https://script.google.com/a/macros/innovaschools.edu.pe/s/AKfycbxe-bvIrpexcnCU_ltHOjFji_bT7T1RoQ_AQPOiuuP7c2LQGdIjsW35foOBVaMOB-am/exec")
  .then(response => response.text())
  .then(data => console.log("Respuesta:", data))
  .catch(error => console.error("Error:", error));
