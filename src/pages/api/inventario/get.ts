import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase/SupabaseClient";

export type Tipo = "material" | "herramienta" | "activo";
export type Sede = "surco" | "cusco";



export function tableName(tipo: Tipo, sede: Sede = "surco"): string {
    return `${sede}_${tipo}`;
}

export async function listInventario(opts: { tipo: Tipo, sede?: Sede }) {
    const sede = (opts.sede ?? "surco") as Sede;
    const table = tableName(opts.tipo, sede);
    const { data, error } = await supabase.from(table).select("*").order("codigo", { ascending: true });
    if(error) throw new Error(error.message);
    return data ?? [];
}

export function money(n:number | null | undefined) {
    return Number(n ?? 0). toLocaleString("es-PE",{style: "currency", currency:"PEN"});

}

export function subtotal(r: any){
    return Number(r.cantidad ?? 0) * Number(r.valor_unitario ?? 0);
}