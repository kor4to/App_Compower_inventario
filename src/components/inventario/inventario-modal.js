// Modal de transferencia
export function openTransferModal(row) {
  const modal = document.getElementById('transfer-modal');
  document.getElementById('transfer-id').value = row.id;
  document.getElementById('transfer-tipo').value = row.tipo;
  document.getElementById('transfer-sede-origen').value = row.sede;
  document.getElementById('transfer-nombre').value = row.nombre;
  document.getElementById('transfer-cantidad').value = '';
  document.getElementById('transfer-sede-destino').value = '';
  modal.classList.remove('hidden');
}

export async function submitTransferForm(e) {
  e.preventDefault();
  const form = e.target;
  const id = form['transfer-id'].value;
  const tipo = form['transfer-tipo'].value;
  const sede_origen = form['transfer-sede-origen'].value;
  const nombre = form['transfer-nombre'].value;
  const cantidad = Number(form['transfer-cantidad'].value);
  const sede_destino = form['transfer-sede-destino'].value;
  let errorMsg = '';
  if (!cantidad || cantidad <= 0) errorMsg = 'Cantidad inválida.';
  else if (!sede_destino || sede_destino === sede_origen) errorMsg = 'Selecciona un almacén destino diferente.';
  if (errorMsg) {
    showModalError('transfer-modal', errorMsg);
    return;
  }
  // Aquí deberías hacer la petición al backend para transferir


  // Por ahora solo muestra éxito simulado
  showModalSuccess('transfer-modal', '¡Transferencia realizada!');
  setTimeout(() => window.location.reload(), 1200);
}
// inventario-modal.js
// Lógica para abrir/cerrar modales y enviar peticiones fetch para editar/eliminar

export function openEditModal(row) {
  const modal = document.getElementById('edit-modal');
  fillEditForm(row);
  modal.classList.remove('hidden');
}

export function openNewModal() {
  const modal = document.getElementById('new-modal');
  modal.classList.remove('hidden');
}

export function openDeleteModal(row) {
  const modal = document.getElementById('delete-modal');
  document.getElementById('delete-id').value = row.id;
  document.getElementById('delete-tipo').value = row.tipo;
  document.getElementById('delete-nombre').textContent = row.nombre;
  modal.classList.remove('hidden');
}

export function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

function fillEditForm(row) {
  document.getElementById('edit-id').value = row.id;
  document.getElementById('edit-tipo').value = row.tipo;
  document.getElementById('edit-codigo').value = row.codigo ?? '';
  document.getElementById('edit-nombre').value = row.nombre;
  document.getElementById('edit-categoria').value = row.categoria ?? '';
  document.getElementById('edit-unid_med').value = row.unid_med ?? '';
  document.getElementById('edit-cantidad').value = row.cantidad ?? 0;
  document.getElementById('edit-valor_unitario').value = row.valor_unitario ?? 0;
}

export async function submitEditForm(e) {
  e.preventDefault();
  const form = e.target;
  // Validaciones
  const nombre = form['edit-nombre'].value.trim();
  const codigo = form['edit-codigo'].value.trim();
  const cantidad = form['edit-cantidad'].value;
  const valor_unitario = form['edit-valor_unitario'].value;
  let errorMsg = '';
  if (!codigo) errorMsg = 'El código es obligatorio.';
  else if (!nombre) errorMsg = 'El nombre es obligatorio.';
  else if (isNaN(Number(cantidad)) || Number(cantidad) < 0) errorMsg = 'Cantidad inválida.';
  else if (isNaN(Number(valor_unitario)) || Number(valor_unitario) < 0) errorMsg = 'Valor unitario inválido.';
  if (errorMsg) {
    showModalError('edit-modal', errorMsg);
    return;
  }
  const data = {
    id: form['edit-id'].value,
    tipo: form['edit-tipo'].value,
    codigo,
    nombre,
    categoria: form['edit-categoria'].value,
    unid_med: form['edit-unid_med'].value,
    cantidad,
    valor_unitario,
  };
  const res = await fetch('/api/inventario/crud', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'editar', ...data })
  });
  if (res.ok) {
    showModalSuccess('edit-modal', '¡Editado correctamente!');
    setTimeout(() => window.location.href = `?tipo=${tipo}&sede=${sede}`, 1200);
  } else {
    const errText = await res.text();
    showModalError('edit-modal', errText || 'Error al editar');
  }
}

export async function submitNewForm(e) {
  e.preventDefault();
  const form = e.target;
  const tipo = form['tipo'].value; // campo oculto
  const sede = form['sede'].value; // campo oculto
  const nombre = form['new-nombre'].value.trim();
  const codigo = form['new-codigo'].value.trim();
  const cantidad = form['new-cantidad'].value;
  const valor_unitario = form['new-valor_unitario'].value;

  // Categoría
  let categoria = form['new-categoria'].value;
  if (categoria === 'otro') {
    categoria = form['nueva-categoria'].value.trim();
  }

  // Unidad de medida
  let unid_med = form['new-unid_med'].value;
  if (unid_med === 'otro') {
    unid_med = form['nueva-unidad'].value.trim();
  }

  // Validaciones básicas
  let errorMsg = '';
  if (!codigo) errorMsg = 'El código es obligatorio.';
  else if (!nombre) errorMsg = 'El nombre es obligatorio.';
  else if (!categoria) errorMsg = 'La categoría es obligatoria.';
  else if (!unid_med) errorMsg = 'La unidad de medida es obligatoria.';
  else if (isNaN(Number(cantidad)) || Number(cantidad) < 0) errorMsg = 'Cantidad inválida.';
  else if (isNaN(Number(valor_unitario)) || Number(valor_unitario) < 0) errorMsg = 'Valor unitario inválido.';

  if (errorMsg) {
    showModalError('new-modal', errorMsg);
    return;
  }

  const data = {
    tipo, sede,
    codigo,
    nombre,
    categoria,
    unid_med,
    cantidad,
    valor_unitario,
  };

  const res = await fetch('/api/inventario/crud', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'agregar', ...data})
  });

  if (res.ok) {
    showModalSuccess('new-modal', '¡Agregado correctamente!');
    setTimeout(() => window.location.href = `?tipo=${tipo}&sede=${sede}`, 5000);
  } else {
    const errText = await res.text();
    showModalError('new-modal', errText || 'Error al agregar');
  }
}

function showModalError(modalId, msg) {
  let err = document.querySelector(`#${modalId} .modal-error`);
  if (!err) {
    err = document.createElement('div');
    err.className = 'modal-error text-red-600 mb-2 text-center';
    document.getElementById(modalId).querySelector('form').prepend(err);
  }
  err.textContent = msg;
}

export async function submitDeleteForm(e) {
  e.preventDefault();
  const form = e.target;
  const id = form['delete-id'].value;
  const tipo = form['delete-tipo'].value;
  const sede = form['delete-sede'].value;
  const res = await fetch('/api/inventario/crud', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'eliminar', tipo, id, sede })
  });
  if (res.ok) {
    showModalSuccess('delete-modal', '¡Eliminado correctamente!');
    setTimeout(() => window.location.href = `?tipo=${tipo}&sede=${sede}`, 5000);
  } else {
    showModalError('delete-modal', 'Error al eliminar');
  }
}

function showModalSuccess(modalId, msg) {
  let ok = document.querySelector(`#${modalId} .modal-success`);
  if (!ok) {
    ok = document.createElement('div');
    ok.className = 'modal-success text-green-600 mb-2 text-center font-bold';
    document.getElementById(modalId).querySelector('form').prepend(ok);
  }
  ok.textContent = msg;
}
