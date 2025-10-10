import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase/SupabaseClient";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { action, ...params } = body;
    if (action === "editar") {
      const { ...data } = params;
      await editCC({ data });
      return new Response("OK");
    } else if (action === "eliminar") {
      return new Response("No implementado", { status: 400 });
    } else {
      return new Response("Acción no soportada", { status: 400 });
    }
  } catch (e: any) {
    return new Response(e?.message || "Error en la operación", { status: 500 });
  }
};

export async function listCC() {
  const { data, error } = await supabase
    .from("centro_costo")
    .select("*")
    .order("codigo", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function editCC({ data }: { data: any }) {

  if(data.codigo) data.codigo = data.codigo.toUpperCase();
  if(data.cliente) data.cliente = data.cliente.toUpperCase();
  if(data.coordinador) data.coordinador = data.coordinador.toUpperCase();
  if(data.proyecto) data.proyecto = data.proyecto.toUpperCase();
  if(data.presupuesto) data.presupuesto = Number(data.presupuesto);

  console.log("Editando CC", data);
  const { error } = await supabase
    .from("centro_costo")
    .update(data)
    .eq("id", data.id);
  if (error) throw new Error(error.message);
  return true;
}

export async function deleteCC({ id }: { id: number | string }) {
  const { error } = await supabase.from("centro_costo").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return true;
}

export async function addCC({ data }: { data: any }) {
  if(data.codigo) data.codigo = data.codigo.toUpperCase();
  if(data.cliente) data.cliente = data.cliente.toUpperCase();
  if(data.coordinador) data.coordinador = data.coordinador.toUpperCase();
  if(data.proyecto) data.proyecto = data.proyecto.toUpperCase();
  if(data.presupuesto) data.presupuesto = Number(data.presupuesto);
  const { error } = await supabase.from("centro_costo").insert([data]);
  if (error) throw new Error(error.message);
  return true;
}
