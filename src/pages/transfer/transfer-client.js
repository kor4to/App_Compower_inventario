document.addEventListener('DOMContentLoaded', () => {
  try {
    // Cliente para la UI de transferencias
    const tipoEl = document.getElementById('tipo');
    const codigoEl = document.getElementById('codigo');
    const nombreEl = document.getElementById('nombre');
    const unidadEl = document.getElementById('unidad');
    const valorEl = document.getElementById('valor_unitario');
    const sedeOrigenEl = document.getElementById('sede_origen');
    const destinoTipoEl = document.getElementById('destino_tipo');
    const destinoAlmacenEl = document.getElementById('destino-almacen');
    const destinoCentroEl = document.getElementById('destino-centro_costo');
    const destinoSiteEl = document.getElementById('destino-site');
    const sedeDestinoEl = document.getElementById('sede_destino');
    const centroCostoEl = document.getElementById('centro_costo');
    const siteDestinoEl = document.getElementById('site_destino');
    const cantidadEl = document.getElementById('cantidad');
    const form = document.getElementById('transfer-form');
    const resultDiv = document.getElementById('transfer-result');

    if (!form) return console.warn('Transfer form not found');

    destinoTipoEl.addEventListener('change', () => {
      const v = destinoTipoEl.value;
      destinoAlmacenEl.classList.toggle('hidden', v !== 'almacen');
      destinoCentroEl.classList.toggle('hidden', v !== 'centro_costo');
      destinoSiteEl.classList.toggle('hidden', v !== 'site');
    });

    // RUC field
    const rucInput = document.getElementById('ruc_destino');

    // Items array and table handling
    const items = [];
    const itemsTableBody = document.querySelector('#items-table tbody');
    function renderItems() {
      if (!itemsTableBody) return;
      itemsTableBody.innerHTML = '';
      items.forEach((it, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td class="p-2">${it.codigo}</td><td class="p-2">${it.nombre}</td><td class="p-2">${it.cantidad}</td><td class="p-2"><button data-idx="${idx}" class="remove-item text-red-600 underline">Quitar</button></td>`;
        itemsTableBody.appendChild(tr);
      });
      // attach remove handlers
      document.querySelectorAll('.remove-item').forEach(btn => btn.addEventListener('click', (e) => {
        const idx = Number(e.currentTarget.getAttribute('data-idx'));
        items.splice(idx,1);
        renderItems();
      }));
    }

    const addBtn = document.getElementById('add-item');
    if (addBtn) {
      addBtn.addEventListener('click', async () => {
        const codigo = codigoEl.value.trim();
        const cantidad = Number(cantidadEl.value || 0);
        if (!codigo) return alert('Ingresa código');
        if (!cantidad || cantidad <= 0) return alert('Ingresa cantidad válida');
        // intentar autocompletar si no hay nombre
        if (!nombreEl.value) {
          const tipo = tipoEl.value;
          const sede = sedeOrigenEl.value;
          try {
            const res = await fetch(`/api/inventario/crud?tipo=${tipo}&sede=${sede}&action=buscar&codigo=${encodeURIComponent(codigo)}`);
            if (res.ok) {
              const data = await res.json();
              if (data) {
                nombreEl.value = data.nombre ?? '';
                unidadEl.value = data.unid_med ?? '';
                valorEl.value = data.valor_unitario ?? '';
              }
            }
          } catch (e) { console.error(e); }
        }
        items.push({ codigo, nombre: nombreEl.value, cantidad });
        renderItems();
        // limpiar campos de item
        codigoEl.value = '';
        nombreEl.value = '';
        unidadEl.value = '';
        valorEl.value = '';
        cantidadEl.value = '';
      });
    }

    const clearBtn = document.getElementById('clear-item');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        codigoEl.value = '';
        nombreEl.value = '';
        unidadEl.value = '';
        valorEl.value = '';
        cantidadEl.value = '';
      });
    }

    // Al perder foco del código intentamos autocompletar
    if (codigoEl) {
      codigoEl.addEventListener('blur', async () => {
        const tipo = tipoEl.value;
        const sede = sedeOrigenEl.value;
        const codigo = codigoEl.value.trim();
        if (!codigo) return;
        try {
          const res = await fetch(`/api/inventario/crud?tipo=${tipo}&sede=${sede}&action=buscar&codigo=${encodeURIComponent(codigo)}`);
          if (!res.ok) return;
          const data = await res.json();
          if (data) {
            nombreEl.value = data.nombre ?? '';
            unidadEl.value = data.unid_med ?? '';
            valorEl.value = data.valor_unitario ?? '';
          }
        } catch (e) {
          console.error(e);
        }
      });
    }

    // Previsualizar guía (simplemente muestra la info que se enviará)
    const previewBtn = document.getElementById('preview-guia');
    if (previewBtn) {
      previewBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const payload = buildPayload();
        resultDiv.innerHTML = `<pre class="p-3 bg-slate-50 border rounded">${JSON.stringify(payload, null, 2)}</pre>`;
      });
    }

    function buildPayload() {
      const payload = {
        guia: {
          numero: document.getElementById('guia_numero').value || null,
          fecha: document.getElementById('guia_fecha').value || new Date().toISOString().slice(0,10),
          transportista: document.getElementById('guia_transportista').value || null,
          motivo: document.getElementById('motivo').value || null,
          ruc_entidad_destino: rucInput ? rucInput.value || null : null,
        },
        items: items.map(i => ({ tipo: tipoEl.value, codigo: i.codigo, nombre: i.nombre, cantidad: i.cantidad })),
        destino: {
          tipo: destinoTipoEl.value,
          sede_destino: sedeDestinoEl.value,
          centro_costo: centroCostoEl.value,
          site: siteDestinoEl.value,
        },
        sede_origen: sedeOrigenEl.value,
      };
      return payload;
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      resultDiv.innerHTML = '';
      const payload = buildPayload();
      // Validaciones básicas
      if (!items.length) return alert('Agrega al menos un item');
      if (payload.destino.tipo === 'almacen' && payload.destino.sede_destino === payload.sede_origen) return alert('La sede destino debe ser distinta a la origen');
      // validar RUC
      const rucVal = rucInput ? rucInput.value || '' : '';
      if (!rucVal || !/^\d{11}$/.test(rucVal)) return alert('Ingresa un RUC válido de 11 dígitos');

      // Crear guía (opcional en servidor) - intentamos llamar a /api/guia/create
      let guiaId = null;
      try {
        const guiaRes = await fetch('/api/guia/create', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ guia: payload.guia, destino: payload.destino, sede_origen: payload.sede_origen, items: payload.items }) });
        if (guiaRes.ok) {
          const gjson = await guiaRes.json();
          guiaId = gjson.id || null;
        }
      } catch (e) { console.warn('No se pudo crear guía en servidor', e); }

      // Enviar transferencias por cada item (podemos optimizar en batch si el API lo acepta)
      const resultados = [];
      for (const it of payload.items) {
        const body = {
          action: 'transferir',
          tipo: it.tipo,
          codigo: it.codigo,
          cantidad: it.cantidad,
          sede_origen: payload.sede_origen,
          sede_destino: payload.destino.sede_destino || payload.destino.site || payload.destino.centro_costo,
          data: { codigo: it.codigo, nombre: it.nombre },
          guia: { id: guiaId, ...payload.guia }
        };
        try {
          const res = await fetch('/api/inventario/transfer', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
          if (!res.ok) {
            const text = await res.text();
            resultados.push({ item: it, ok: false, error: text });
          } else {
            resultados.push({ item: it, ok: true });
          }
        } catch (err) {
          resultados.push({ item: it, ok: false, error: String(err) });
        }
      }

      // Mostrar resumen
      const successCount = resultados.filter(r => r.ok).length;
      const fail = resultados.filter(r => !r.ok);
      if (fail.length) {
        resultDiv.innerHTML = `<div class="text-red-600">${successCount} transfers succeeded, ${fail.length} failed.<pre>${JSON.stringify(fail, null, 2)}</pre></div>`;
      } else {
        resultDiv.innerHTML = `<div class="text-green-600">Todas las transferencias se realizaron correctamente. Guía: ${payload.guia.numero || guiaId || 'N/A'}</div>`;
        // limpiar items
        items.length = 0; renderItems();
      }
    });
  } catch (e) {
    console.error('Error inicializando script de transfer:', e);
  }
});
