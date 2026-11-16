import {supabaseUrl,supabasePublishableKey} from "./supabase-config.mjs";

export const cloudConfigured=Boolean(supabaseUrl && supabasePublishableKey);

export function createJournalClient(client) {
  const columns = "id,created_at,entry,revision";
  const unpack = row => ({...row.entry,id:row.id,date:row.created_at,revision:row.revision});
  function pack(userId, item) {
    const {id,date,revision,...entry} = item;
    return {user_id:userId,id,created_at:date,entry};
  }
  function requireData(result) {
    if (result.error) throw result.error;
    return result.data;
  }
  const table = () => client.from("journal_entries");
  return {
    auth:client.auth,
    async list(userId) {
      const entries = [];
      const size = 250;
      for (let offset=0;;offset+=size) {
        const rows = requireData(await table().select(columns).eq("user_id",userId)
          .order("created_at",{ascending:false}).order("id").range(offset,offset+size-1));
        entries.push(...rows.map(unpack));
        if (rows.length<size) return entries;
      }
    },
    async save(userId,item,previous) {
      if (!previous) {
        return unpack(requireData(await table().insert(pack(userId,item)).select(columns).single()));
      }
      const {entry} = pack(userId,item);
      const row = requireData(await table().update({entry,revision:previous.revision+1})
        .eq("user_id",userId).eq("id",item.id).eq("revision",previous.revision)
        .select(columns).maybeSingle());
      if (!row) throw new Error("journal_conflict");
      return unpack(row);
    },
    async remove(userId,item) {
      const row = requireData(await table().delete().eq("user_id",userId)
        .eq("id",item.id).eq("revision",item.revision).select("id").maybeSingle());
      if (!row) throw new Error("journal_conflict");
    },
    async importLocal(userId,items) {
      for (let start=0;start<items.length;start+=50) {
        const rows = items.slice(start,start+50).map(item=>pack(userId,item));
        requireData(await table().upsert(rows,{onConflict:"user_id,id",ignoreDuplicates:true}));
      }
    }
  };
}

export async function connectJournal() {
  const {createClient}=await import("https://esm.sh/@supabase/supabase-js@2");
  return createJournalClient(createClient(supabaseUrl,supabasePublishableKey));
}
