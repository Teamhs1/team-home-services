import { useSupabaseWithClerk } from "@/utils/supabase/useSupabaseWithClerk";

export default function JobPhotos({ jobId }) {
  const { getClientWithToken } = useSupabaseWithClerk();

  const handleUpload = async (file) => {
    try {
      const supabaseAuth = await getClientWithToken();
      const filePath = `${jobId}/${Date.now()}_${file.name}`;

      const { data, error } = await supabaseAuth.storage
        .from("job-photos")
        .upload(filePath, file);

      if (error) throw error;
      console.log("✅ Uploaded:", data);
    } catch (err) {
      console.error("❌ Upload error:", err.message);
    }
  };

  return (
    <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />
  );
}
