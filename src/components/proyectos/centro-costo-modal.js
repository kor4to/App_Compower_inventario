export function openEditModal(row) {
  const modal = document.getElementById("edit-cc-modal");
  fillEditForm(row);
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

export function openDeleteModal(id) {
  const modal = document.getElementById("delete-modal");
  document.getElementById("delete-id").value = id;
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

export function openNewModal(){
  const modal = document.getElementById("new-cc-modal");
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

export async function submitNewForm(event){
    event.preventDefault();
    const form = event.target;
    const codigo = document.getElementById("new-codigo").value.trim().toUpperCase();
    const cliente = document.getElementById("new-cliente").value.trim().toUpperCase();
    const coordinador = document.getElementById("new-coordinador").value.trim().toUpperCase();
    const proyecto = document.getElementById("new-proyecto").value.trim().toUpperCase();
    const presupuesto = parseFloat(document.getElementById("new-presupuesto").value) || 0;
    const payload = { codigo, cliente, coordinador, proyecto, presupuesto };

    if(!codigo || !cliente || !presupuesto || presupuesto <= 0){
        alert("Por favor, complete todos los campos obligatorios y asegúrese de que el presupuesto sea mayor que cero.");
        return;
    }

    const res = await fetch('/api/proyectos/presupuesto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'nuevo', ...payload })
    });

    if(res.ok){
        const modal = document.getElementById("new-cc-modal");
        const successDiv = modal.querySelector(".modal-success");
        successDiv.classList.remove("hidden");
        successDiv.classList.add("flex");
    }

}

export async function submitDeleteForm(e) {
  e.preventDefault();
  const form = e.target;
  const id = form["delete-id"].value;
  const res = await fetch("/api/proyectos/presupuesto", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "eliminar", id }),
  });
  if (res.ok) {
    showModalSuccess("delete-modal", "¡Eliminado correctamente!");
    const modal = document.getElementById("delete-modal");
        const successDiv = modal.querySelector(".modal-success");
        successDiv.classList.remove("hidden");
        successDiv.classList.add("flex");
  } else {
    showModalError("delete-modal", "Error al eliminar");
  }
}

function showModalSuccess(modalId, msg) {
  let ok = document.querySelector(`#${modalId} .modal-success`);
  if (!ok) {
    ok = document.createElement("div");
    ok.className = "modal-success text-green-600 mb-2 text-center font-bold";
    document.getElementById(modalId).querySelector("form").prepend(ok);
  }
  ok.textContent = msg;
}

function showModalError(modalId, msg) {
  let err = document.querySelector(`#${modalId} .modal-error`);
  if (!err) {
    err = document.createElement("div");
    err.className = "modal-error text-red-600 mb-2 text-center";
    document.getElementById(modalId).querySelector("form").prepend(err);
  }
  err.textContent = msg;
}