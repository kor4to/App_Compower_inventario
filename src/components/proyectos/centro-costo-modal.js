export function openEditModal(row) {
  const modal = document.getElementById("edit-cc-modal");
  fillEditForm(row);
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

export function closeModal(id) {
  const m = document.getElementById(id);
  if (m) {
    m.classList.add("hidden");
    m.classList.remove("flex");
  }
}

function fillEditForm(row) {
  document.getElementById("edit-id").value = row.id;
  document.getElementById("edit-codigo").value = (row.codigo ?? "").toUpperCase();
  document.getElementById("edit-cliente").value = (row.cliente ?? "-").toUpperCase();
  document.getElementById("edit-coordinador").value = (row.coordinador ?? "-").toUpperCase();
  document.getElementById("edit-proyecto").value = (row.proyecto ?? "-").toUpperCase();
  document.getElementById("edit-presupuesto").value = row.presupuesto ?? 0;
}

export async function submitEditForm(event){
    event.preventDefault();
    const form = event.target;
    const id = document.getElementById("edit-id").value;
    const codigo = document.getElementById("edit-codigo").value.trim().toUpperCase();
    const cliente = document.getElementById("edit-cliente").value.trim().toUpperCase();
    const coordinador = document.getElementById("edit-coordinador").value.trim().toUpperCase();
    const proyecto = document.getElementById("edit-proyecto").value.trim().toUpperCase();
    const presupuesto = parseFloat(document.getElementById("edit-presupuesto").value) || 0;
    const payload = { id, codigo, cliente, coordinador, proyecto, presupuesto };

    if(!codigo || !cliente || !presupuesto || presupuesto <= 0){
        alert("Por favor, complete todos los campos obligatorios y asegúrese de que el presupuesto sea mayor que cero.");
        return;
    }

    const res = await fetch('/api/proyectos/presupuesto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'editar', ...payload })
    });

    if(res.ok){
        const modal = document.getElementById("edit-cc-modal");
        const successDiv = modal.querySelector(".modal-success");
        successDiv.classList.remove("hidden");
        successDiv.classList.add("flex");
    }

}