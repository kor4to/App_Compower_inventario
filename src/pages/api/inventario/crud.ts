import type { APIRoute } from "astro";
export const POST: APIRoute = async ({ request }) => {
	try {
		const body = await request.json();
		const { action, ...params } = body;
		if (action === "editar") {
			const { tipo, id, ...data } = params;
			await editarInventario({ tipo, id, data });
			return new Response("OK");
		} else if (action === "eliminar") {
			const { tipo, id } = params;
			await eliminarInventario({ tipo, id });
			return new Response("OK");
		} else {
			return new Response("Acción no soportada", { status: 400 });
		}
	} catch (e: any) {
		return new Response(e?.message || "Error en la operación", { status: 500 });
	}
};
import { supabase } from '../../../lib/supabase/SupabaseClient';
import type { Tipo } from './get';
import { tableName } from './get';

// Editar un registro
export async function editarInventario({ tipo, id, data }: { tipo: Tipo, id: number | string, data: any }) {
	const table = tableName(tipo);
	const { error } = await supabase
		.from(table)
		.update(data)
		.eq('id', id);
	if (error) throw new Error(error.message);
	return true;
}

// Eliminar un registro
export async function eliminarInventario({ tipo, id }: { tipo: Tipo, id: number | string }) {
	const table = tableName(tipo);
	const { error } = await supabase
		.from(table)
		.delete()
		.eq('id', id);
	if (error) throw new Error(error.message);
	return true;
}
