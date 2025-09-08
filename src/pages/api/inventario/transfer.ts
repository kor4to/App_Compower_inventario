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
  tipo,
  sede,
  codigo,
}: {
  tipo: Tipo;
  sede: Sede;
  codigo: string;
}) {
  const tabla = tableName(tipo, sede);
  const { data, error } = await supabase
    .from(tabla)
    .select("*")
    .eq("codigo", codigo)
    .single();

  console.log("funcion: buscarItemPorCodigo", { tipo, sede, codigo });
  if (error && error.code !== "PGRST116") throw new Error(error.message);
  return data; // null si no existe
}

// Obtener cantidad actual de un item
export async function obtenerCantidad({
  tipo,
  sede,
  codigo,
}: {
  tipo: Tipo;
  sede: Sede;
  codigo: string;
}) {
  const item = await buscarItemPorCodigo({ tipo, sede, codigo });
  console.log("funcion: obtenerCantidad", { tipo, sede, codigo });
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
  const tabla = tableName(tipo, sede);
  const { error } = await supabase.from(tabla).delete().eq("codigo", codigo);
  console.log("funcion: eliminarItem", { tipo, sede, codigo });
  if (error) throw new Error(error.message);
  return true;
}

export async function transferKardex({
  data,
  detalle,
  nuevaCantidad
}: {
  data: any;
  detalle: string;
  nuevaCantidad: number;
}){
  const valor = Number(data?.valor_unitario ?? 0) * Number(data?.cantidad ?? 0);
  const { error } = await supabase.from("kardex").insert({
    tipo: "Transferencia",
    valor_unitario: data?.valor_unitario ?? 0,
    detalle,
    cantidad: data?.cantidad ?? 0,
    valor,
    cantidad_saldo: nuevaCantidad,
    valor_saldo: nuevaCantidad * Number(data?.valor_unitario ?? 0),
  });
  if (error) {
    console.log(error.message);
    throw new Error(error.message);
  }
}

// Sumar cantidad a un item (o crear si no existe)
export async function sumarOAgregarItem({
  tipo,
  sede,
  codigo,
  data,
  cantidad,
}: {
  tipo: Tipo;
  sede: Sede;
  codigo: string;
  data: any;
  cantidad: number;
}) {
  console.log("funcion: sumarOAgregarItem - inicio", {
    tipo,
    sede,
    codigo,
    cantidad,
  });
  const tabla = tableName(tipo, sede);
  const item = await buscarItemPorCodigo({ tipo, sede, codigo });
  if (item) {
    // Sumar cantidad
    const nuevaCantidad = Number(item.cantidad) + Number(cantidad);
    const detalle = "Transferencia de " + (data?.nombre ?? "N/A") + " desde " + data?.sedeOrigen + " hasta " + data?.sedeDestino;
    const { error } = await supabase
    .from(tabla)
    .update({ cantidad: nuevaCantidad })
    .eq("codigo", codigo);
    
    await transferKardex({data, detalle, nuevaCantidad});
    if (error) {
      console.log("Error al actualizar item:", error);
      throw new Error(error.message);
    }
  } else {
    // Agregar nuevo
    const { error } = await supabase
      .from(tabla)
      .insert([{ ...data, codigo, cantidad }]);
    if (error) {
      console.log("Error al insertar item:", error);
      throw new Error(error.message);
    }
  }

  console.log("funcion: sumarOAgregarItem", { tipo, sede, codigo, cantidad });
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
  console.log("funcion: transferirItem", {
    tipo,
    codigo,
    cantidad,
    sedeOrigen,
    sedeDestino,
    data,
  });

  // 1. Verificar cantidad en origen
  const cantidadActual = await obtenerCantidad({
    tipo,
    sede: sedeOrigen,
    codigo,
  });
  console.log("Cantidad actual en origen:", cantidadActual);
  if (cantidadActual < cantidad)
    throw new Error("Cantidad insuficiente en origen");

  // 2. Sumar o agregar en destino
  await sumarOAgregarItem({ tipo, sede: sedeDestino, codigo, data, cantidad });

  // 3. Restar o eliminar en origen
  if (cantidadActual === cantidad) {
    await eliminarItem({ tipo, sede: sedeOrigen, codigo });
  } else {
    const tabla = tableName(tipo, sedeOrigen);
    const nuevaCantidad = cantidadActual - cantidad;
    const { error } = await supabase
      .from(tabla)
      .update({ cantidad: nuevaCantidad })
      .eq("codigo", codigo);

    console.log("La tabla es: ", tabla, "nueva cantidad:", nuevaCantidad);
    if (error) throw new Error(error.message);
  }

  return true;
}
