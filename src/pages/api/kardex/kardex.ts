import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase/SupabaseClient";


export async function listKardex(){
    const {data, error} = await supabase.from("kardex").select("*").order("fecha", {ascending: true});
    if(error) throw new Error(error.message);
    return data ?? [];
}