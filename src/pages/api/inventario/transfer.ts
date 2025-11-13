import type { APIRoute } from "astro";
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { action, ...params } = body;
    if (action === "transferir") {
      const { tipo, codigo, cantidad, sede_origen, sede_destino, data } =
        params;
      await transferirItem({
        tipo,
        codigo,
        cantidad: Number(cantidad),
        sedeOrigen: sede_origen,
        sedeDestino: sede_destino,
        data,
      });
      return new Response("OK");
    } else {
      return new Response("Acción no soportada", { status: 400 });
    }
  } catch (e: any) {
    return new Response("Acción no soportada", { status: 400 });
  }
};

import { supabase } from "../../../lib/supabase/SupabaseClient";
import type { Tipo } from "./get";
import type { Sede } from "./get";
import { tableName } from "./get";

// Buscar un item por código en una sede/tipo
export async function buscarItemPorCodigo({
  tipo, sedeDestino, codigo,
}: {
  tipo: Tipo;
  sedeDestino: Sede;
  codigo: string;
}) {
  const tipo1 = tipo.toUpperCase();
  const sede = sedeDestino.toUpperCase();
  const { data, error } = await supabase
    .from("inventario")
    .select("*")
    .eq("codigo", codigo)
    .eq("sede", sede)
    .eq("tipo", tipo1)
    .single();

  if (error && error.code !== "PGRST116") throw new Error(error.message);
  return data; // null si no existe
}

// Obtener cantidad actual de un item
export async function obtenerCantidad({
  tipo,
  sedeOrigen,
  codigo,
}: {
  tipo: Tipo;
  sedeOrigen: Sede;
  codigo: string;
}) {
  const item = await buscarItemPorCodigo({ tipo, sedeDestino: sedeOrigen, codigo });
   return item ? Number(item.cantidad) : 0;
}

// Eliminar un item por código
export async function eliminarItem({
  tipo,
  sede,
  codigo,
}: {
  tipo: Tipo;
  sede: Sede;
  codigo: string;
}) {
  const sede1 = sede.toUpperCase();
  const tipo1 = tipo.toUpperCase();
  const { error } = await supabase.from("inventario").delete().eq("codigo", codigo).eq("sede", sede1).eq("tipo", tipo1);
  if (error) throw new Error(error.message);
  return true;
}

export async function transferKardex({
  data,
  cantidad,
  detalle,
  cantidad_saldo
}: {
  data: any;
  detalle: string;
  cantidad_saldo: number;
  cantidad: number;
}){
  const valor = Number(data?.valor_unitario ?? 0) * Number(cantidad);
  const { error } = await supabase.from("kardex").insert({
    tipo: "Transferencia",
    valor_unitario: data?.valor_unitario ?? 0,
    detalle,
    cantidad,
    valor,
    cantidad_saldo,
    valor_saldo: cantidad_saldo * Number(data?.valor_unitario ?? 0),
  });
  if (error) {
    console.log(error.message);
    throw new Error(error.message);
  }
}

// Sumar cantidad a un item (o crear si no existe)
export async function sumarOAgregarItem({
  tipo,
  sedeOrigen,
  sedeDestino,
  codigo,
  data,
  cantidad,
}: {
  tipo: Tipo;
  sedeOrigen: Sede;
  sedeDestino: Sede;
  codigo: string;
  data: any;
  cantidad: number;
}) {
  const tipo1 = tipo.toUpperCase();
  const sedeD = sedeDestino.toUpperCase();
  const item = await buscarItemPorCodigo({ tipo, sedeDestino, codigo });
  if (item) {
    // Sumar cantidad
    const nuevaCantidad = Number(item.cantidad) + Number(cantidad);
   
    const { error } = await supabase
    .from("inventario")
    .update({ cantidad: nuevaCantidad })
    .eq("codigo", codigo)
    .eq("sede", sedeD)
    .eq("tipo", tipo1);
    console.log("item: ",item);
    if (error) {
      console.log("Error al actualizar item:", error);
      throw new Error(error.message);
    }
  } else {
    // Agregar nuevo
    const { error } = await supabase
      .from("inventario")
      .insert([{ ...data, codigo, cantidad, sede: sedeD, tipo: tipo1 }]);
    console.log("data a insertar: ",{ ...data, codigo, cantidad, sede: sedeD, tipo: tipo1 });

    console.log("data: ", data)
    if (error) {
      console.log("Error al insertar item:", error);
      throw new Error(error.message);
    }
  }

   return true;
}

// Transferir item entre sedes
export async function transferirItem({
  tipo,
  codigo,
  cantidad,
  sedeOrigen,
  sedeDestino,
  data,
}: {
  tipo: Tipo;
  codigo: string;
  cantidad: number;
  sedeOrigen: Sede;
  sedeDestino: Sede;
  data: any;
}) {


  // 1. Verificar cantidad en origen
  const cantidadActual = await obtenerCantidad({
    tipo,
    sedeOrigen,
    codigo,
  });
  if (cantidadActual < cantidad)
    throw new Error("Cantidad insuficiente en origen");

  // 2. Sumar o agregar en destino
  await sumarOAgregarItem({ tipo, sedeOrigen, sedeDestino, codigo, data, cantidad });
 const detalle = "Transferencia de " + (codigo) + " desde " + sedeOrigen + " hasta " + sedeDestino;
    
  // 3. Registrar en kardex: salida en origen
  await transferKardex({
    data,
    cantidad: cantidad, // salida
    detalle,
    cantidad_saldo: cantidadActual - cantidad
  });

  
  if (cantidadActual === cantidad) {
    await eliminarItem({ tipo, sede: sedeOrigen, codigo });
  } else {
    const tipo1 = tipo.toUpperCase();
    const sedeO = sedeOrigen.toUpperCase();
    const tabla = tableName(tipo, sedeOrigen);
    const nuevaCantidad = cantidadActual - cantidad;
    const { error } = await supabase
      .from("inventario")
      .update({ cantidad: nuevaCantidad })
      .eq("codigo", codigo)
      .eq("sede", sedeO)
      .eq("tipo", tipo1);

    if (error) throw new Error(error.message);
  }

  return true;
}
