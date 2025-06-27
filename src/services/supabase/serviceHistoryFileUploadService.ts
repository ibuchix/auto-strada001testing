import { supabase } from "@/integrations/supabase/client";

export type uploadTempServiceHistoryFileType = {
    documentUrl: string,
    fileName: string
}

export async function uploadTempServiceHistoryFile(serviceFile: File): Promise<uploadTempServiceHistoryFileType | null> {
    const bucket = "car-files";
    const folder = "car-files/service-history";
    const timestamp = Date.now();
    const sanitizedFileName = serviceFile.name.replace(/\s+/g, "_");
    const uniqueFileName = `${folder}/${timestamp}-${sanitizedFileName}`;

    const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(uniqueFileName, serviceFile);

    if (uploadError || !data) {
        console.error("Failed to upload service history file:", uploadError?.message);
        return null;
    }

    const {
        data: publicUrlData,
    } = supabase.storage.from(bucket).getPublicUrl(data.path);

    if (!publicUrlData?.publicUrl) {
        console.error("Failed to get public URL for uploaded file:");
        return null;
    }

    return {
        documentUrl: publicUrlData.publicUrl,
        fileName: sanitizedFileName
    };
}
