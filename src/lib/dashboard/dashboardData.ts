import { supabase } from '../../lib/supabase/SupabaseClient';


export async function getDashboardData() {
  // 1. Valor total de almacén de Cusco
  let valorCusco = 0;
  let valorSurco = 0;
  const tablasCusco = ['cusco_activo', 'cusco_material', 'cusco_herramienta'];
  const tablasSurco = ['surco_activo', 'surco_material', 'surco_herramienta'];
  for (const tabla of tablasCusco) {
    const { data, error } = await supabase
      .from(tabla)
      .select('cantidad, valor_unitario');
    if (!error && data) {
      valorCusco += data.reduce((acc, r) => acc + (Number(r.cantidad) * Number(r.valor_unitario)), 0);
    }
  }
  for (const tabla of tablasSurco) {
    const { data, error } = await supabase
      .from(tabla)
      .select('cantidad, valor_unitario');
    if (!error && data) {
      valorSurco += data.reduce((acc, r) => acc + (Number(r.cantidad) * Number(r.valor_unitario)), 0);
    }
  }
  const almacenValores = { cusco: valorCusco, surco: valorSurco };

  // 2. Total de transferencias realizadas (todas las filas de kardex)
  const { count: totalTransferencias } = await supabase
    .from('kardex')
    .select('*', { count: 'exact', head: true });

  // 3. Listado de centro_costo_inventario agrupado por centro_costo
  const { data: centroCostoData, error: ccError } = await supabase
    .from('centro_costo_inventario')
    .select('centro_costo, valor, cantidad')
    .order('centro_costo', { ascending: true });

  // Agrupar y sumar (cantidad * valor) por centro_costo
  const resumenCentroCosto = {};
  if (centroCostoData) {
    for (const row of centroCostoData) {
      if (!resumenCentroCosto[row.centro_costo]) resumenCentroCosto[row.centro_costo] = 0;
      resumenCentroCosto[row.centro_costo] += (Number(row.valor) || 0) * (Number(row.cantidad) || 0);
    }
  }

  return {
    almacenValores,
    totalTransferencias: totalTransferencias || 0,
    resumenCentroCosto
  };
}
