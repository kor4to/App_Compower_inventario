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
		}else if(action ==="agregar"){
			const { tipo, sede, ...data } = params;
			await agregarInventario({ tipo, data, sede });
			return new Response("OK");
		}
		 else {
			return new Response("Acción no soportada", { status: 400 });
		}
	} catch (e: any) {
		return new Response(e?.message || "Error en la operación", { status: 500 });
	}
};
import { supabase } from '../../../lib/supabase/SupabaseClient';
import type { Tipo } from './get';
import type { Sede } from './get';
import { tableName } from './get';

// Editar un registro
export async function editarInventario({ tipo, id, sede, data }: { tipo: Tipo, id: number | string, sede: Sede, data: any }) {
	const table = tableName(tipo, sede);
	const { error } = await supabase
		.from(table)
		.update(data)
		.eq('id', id);
	if (error) throw new Error(error.message);
	return true;
}

// Eliminar un registro
export async function eliminarInventario({ tipo, id, sede }: { tipo: Tipo, id: number | string, sede: Sede }) {
	const table = tableName(tipo, sede);
	const { error } = await supabase
		.from(table)
		.delete()
		.eq('id', id);
	if (error) throw new Error(error.message);
	return true;
}


export async function agregarInventario({ tipo, data, sede }: { tipo: Tipo, data: any, sede: Sede }) {
	const tabla = tableName(tipo, sede);
	const { error } = await supabase
		.from(tabla)
		.insert(data);

	console.log('Nuevo inventario agregado:', data, ' en la tabla:', tabla);

	if (error) {
		console.log(error.message);
		throw new Error(error.message);
	}

	return true;
}