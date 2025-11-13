import type { APIRoute } from "astro";
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { action, ...params } = body;
    if (action === "editar") {
      const { tipo, id, sede, ...data } = params;
      await editarInventario({ tipo, id, sede, data });
      return new Response("OK");
    } else if (action === "eliminar") {
      const { tipo, id, sede } = params;
      await eliminarInventario({ tipo, id, sede });
      return new Response("OK");
    } else if (action === "agregar") {
      const { tipo, sede, ...data } = params;
      await agregarInventario({ tipo, data, sede });
      return new Response("OK");
    } else if (action === "actualizar") {
      const { tipo, sede, ...data } = params;
      await actualizarInventario({ tipo, data, sede });
      return new Response("OK");
    } else {
      return new Response("Acción no soportada", { status: 400 });
    }
  } catch (e: any) {
    return new Response(e?.message || "Error en la operación", { status: 500 });
  }
};
export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const params = url.searchParams;
    const action = params.get('action');
    if (action === 'buscar') {
      const tipo = params.get('tipo') as any;
      const sede = params.get('sede') as any;
      const codigo = params.get('codigo') || '';
      if (!tipo || !sede || !codigo) return new Response(null, { status: 400 });
      const item = await buscarItemPorCodigo({ tipo, sedeDestino: sede, codigo });
      if (!item) return new Response(JSON.stringify(null), { status: 200 });
      return new Response(JSON.stringify(item), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response('Acción no soportada', { status: 400 });
  } catch (e: any) {
    return new Response(e?.message || 'Error', { status: 500 });
  }
};
import { supabase } from "../../../lib/supabase/SupabaseClient";
import type { Tipo } from "./get";
import type { Sede } from "./get";
import { tableName } from "./get";
import { buscarItemPorCodigo } from "./transfer";

// Editar un registro
export async function editarInventario({
  tipo,
  id,
  sede,
  data,
}: {
  tipo: Tipo;
  id: number | string;
  sede: Sede;
  data: any;
}) {
  const table = tableName(tipo, sede);
  // Forzar nombre en mayúsculas
  if (data.nombre) data.nombre = String(data.nombre).toUpperCase();
  if (data.codigo) data.codigo = String(data.codigo).toUpperCase();
  const { error } = await supabase.from("inventario").update(data).eq("id", id);

  console.log("Inventario editado:", data, " en la tabla:", table);
  if (error) throw new Error(error.message);
  return true;
}
export async function actualizarInventario({
  tipo,
  sede,
  data,
}: {
  tipo: Tipo;
  sede: Sede;
  data: any;
}) {
  const table = tableName(tipo, sede);
  // Forzar nombre en mayúsculas
  if (data.nombre) data.nombre = String(data.nombre).toUpperCase();
  const itemExistente = await buscarItemPorCodigo({ tipo, sedeDestino: sede, codigo: data.codigo });
  if (!itemExistente) {
    throw new Error("El item con el código especificado no existe en la sede.");
  }
  // Obtener la cantidad actual
  const cantidadActual = Number(itemExistente?.cantidad ?? 0);
  const nuevaCantidad = cantidadActual + Number(data?.cantidad ?? 0);
  const { error } = await supabase.from("inventario").update({ ...data, cantidad: nuevaCantidad }).eq("id", data?.id);
  const detalle = "Compra de " + (data?.codigo ?? "N/A");
  await actualizarKardex({ data: { ...data, nuevaCantidad: nuevaCantidad }, detalle });
  console.log("Inventario actualizado:", { ...data, cantidad: nuevaCantidad }, " en la tabla:", table);
  if (error) throw new Error(error.message);
  return true;
}

// Eliminar un registro
export async function eliminarInventario({
  tipo,
  id,
  sede,
}: {
  tipo: Tipo;
  id: number | string;
  sede: Sede;
}) {
  const { error } = await supabase.from("inventario").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return true;
}

export async function agregarKardex({
  data,
  detalle,
}: {
  data: any;
  detalle: string;
}) {
  const valor = Number(data?.valor_unitario ?? 0) * Number(data?.cantidad ?? 0);
  const { error } = await supabase.from("kardex").insert({
    tipo: "Compra",
	valor_unitario: data?.valor_unitario ?? 0,
    detalle,
    cantidad: data?.cantidad ?? 0,
    valor,
    cantidad_saldo: data?.cantidad ?? 0,
    valor_saldo: valor,
  });

  if (error) {
    console.log(error.message);
    throw new Error(error.message);
  }
}

export async function actualizarKardex({
  data,
  detalle,
}: {
  data: any;
  detalle: string;
}) {
  const valor = Number(data?.valor_unitario ?? 0) * Number(data?.cantidad ?? 0);
  const { error } = await supabase.from("kardex").insert({
    tipo: "Compra",
	valor_unitario: data?.valor_unitario ?? 0,
    detalle,
    cantidad: data?.cantidad ?? 0,
    valor,
    cantidad_saldo: data?.nuevaCantidad ?? 0,
    valor_saldo: valor,
  });

  if (error) {
    console.log(error.message);
    throw new Error(error.message);
  }
}

export async function agregarInventario({
  tipo,
  data,
  sede,
}: {
  tipo: Tipo;
  data: any;
  sede: Sede;
}) {
  const tabla = tableName(tipo, sede);
  // Forzar nombre en mayúsculas
  if (data.nombre) data.nombre = String(data.nombre).toUpperCase();
  if (data.codigo) data.codigo = String(data.codigo).toUpperCase();
  if (data.categoria) data.categoria = String(data.categoria).toUpperCase();
  if (data.unid_med) data.unid_med = String(data.unid_med).toUpperCase();
  if (tipo) tipo = String(tipo).toUpperCase() as Tipo;
  if (sede) sede = String(sede).toUpperCase() as Sede;
  data.tipo = tipo;
  data.sede = sede;
  const detalle =
    "Compra de " +
    (data?.codigo ?? "N/A");
  const { error } = await supabase.from("inventario").insert(data);
  await agregarKardex({ data, detalle });
  console.log("Nuevo inventario agregado:", data, " en la tabla:", tabla);

  if (error) {
    console.log(error.message);
    throw new Error(error.message);
  }

  return true;
}
