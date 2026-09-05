-- Each user's evidence lives under a folder named with their user id.
CREATE POLICY "Users can read their own evidence files" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'challenge-evidence' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can upload their own evidence files" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'challenge-evidence' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own evidence files" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'challenge-evidence' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own evidence files" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'challenge-evidence' AND (storage.foldername(name))[1] = auth.uid()::text);