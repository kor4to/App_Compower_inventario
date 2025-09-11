import { supabase } from '../../../lib/supabase/SupabaseClient';
import type { APIRoute } from 'astro';

import { transferKardex } from '../inventario/transfer';
import { buscarItemPorCodigo } from '../inventario/transfer'; 
import { eliminarItem } from '../inventario/transfer'; 
import { obtenerCantidad } from '../inventario/transfer'; 
import { tableName } from '../inventario/get';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      centro_costo, // código del centro de costo
      item_id,      // código del item
      cantidad,     // cantidad a transferir
      centro_de_costo_nombre, // nombre del centro de costo (corregido)
      valor,        // costo del item
      item_name,    // nombre del producto
      tipo,
      sede,
    } = body;

    if (!centro_costo || !item_id || !cantidad || !centro_de_costo_nombre || !valor || !item_name) {
      // Mostrar en consola los datos recibidos y los campos faltantes
      console.error('Datos recibidos:', { centro_costo, item_id, cantidad, centro_de_costo_nombre, valor, item_name });
      const faltantes = [];
      if (!centro_costo) faltantes.push('centro_costo');
      if (!item_id) faltantes.push('item_id');
      if (!cantidad) faltantes.push('cantidad');
      if (!centro_de_costo_nombre) faltantes.push('centro_de_costo_nombre');
      if (!valor) faltantes.push('valor');
      if (!item_name) faltantes.push('item_name');
      console.error('Campos faltantes:', faltantes);
      return new Response(JSON.stringify({ error: 'Faltan campos requeridos.', faltantes }), { status: 400 });
    }

    const cantidadActual = await obtenerCantidad({
      tipo,
      sedeOrigen: sede,
      codigo: item_id,
    });
    if (cantidadActual < cantidad) {
      return new Response(JSON.stringify({ error: "Cantidad insuficiente en origen" }), { status: 400 });
    }

    const detalle = `Transferencia a centro de costo ${centro_costo} - ${centro_de_costo_nombre}`;
    const { data, error } = await supabase
      .from('centro_costo_inventario')
      .insert([
        {
          centro_costo,
          item_id,
          cantidad,
          centro_de_costo_nombre,
          valor,
          item_name
        }
      ]);

    // Registrar en el kardex
    console.log(tipo, sede);
    const item = await buscarItemPorCodigo({ tipo, sedeDestino: sede, codigo: item_id });
    const cantidad_saldo = item.cantidad - Number(cantidad);
    
    const datos = {
      valor_unitario: Number(valor),
      cantidad_saldo,
    };
    await transferKardex({
      data: datos,
      cantidad: Number(cantidad),
      detalle,
      cantidad_saldo,
    });
    
    if (error) {
      // Mostrar el error en la consola del servidor para debug
      console.error('Error al insertar en centro_costo_inventario:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
    
    if (item.cantidad === cantidad) {
      await eliminarItem({ tipo, sede, codigo: item_id });
    } else {
      const tabla = tableName(tipo, sede);
      const nuevaCantidad = item.cantidad - cantidad;
      const { error: updateError } = await supabase
        .from(tabla)
        .update({ cantidad: nuevaCantidad })
        .eq("codigo", item_id);
      if (updateError) {
        console.error('Error al actualizar cantidad en inventario:', updateError);
        return new Response(JSON.stringify({ error: updateError.message }), { status: 500 });
      }
    }
    return new Response(JSON.stringify({ success: true, data }), { status: 200 });
  } catch (err: any) {
    console.error('Error en POST centro_costos/transfer:', err);
    return new Response(JSON.stringify({ error: err?.message || 'Error interno del servidor' }), { status: 500 });
  }
};
