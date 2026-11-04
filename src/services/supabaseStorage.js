const getSupabaseClient = require('../config/supabase');

const uploadFileToSupabase = async (fileName, fileBuffer, mimeType) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(fileName, fileBuffer, {
      contentType: mimeType,
      upsert: true // Overwrite if file exists
    });

  if (error) throw error;

  // Get the public URL to save in the database
  const { data: urlData } = supabase.storage
    .from('uploads')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
};

const uploadProfilePictureToSupabase = async (userId, fileBuffer, mimeType) => {
  const supabase = getSupabaseClient();
  const fileName = `profiles/${userId}/avatar`;
  const { error } = await supabase.storage
    .from('uploads')
    .upload(fileName, fileBuffer, {
      contentType: mimeType,
      cacheControl: '0',
      upsert: true
    });

  if (error) throw error;

  const { data } = supabase.storage.from('uploads').getPublicUrl(fileName);
  return `${data.publicUrl}?v=${Date.now()}`;
};

module.exports = { uploadFileToSupabase, uploadProfilePictureToSupabase };